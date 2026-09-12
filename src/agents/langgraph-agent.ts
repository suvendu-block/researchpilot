import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { loadPrompt } from "../lib/prompt-loader";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("langgraph-agent");

// ── Config ──────────────────────────────────────────────────

const PRIMARY_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.5-flash";
const TIMEOUT_MS = 120_000; // 2 min — this agent does more work so needs more time
const MAX_RESULTS = 5;
const PARALLEL_QUERIES = 3; // how many different search queries to run in parallel

// ── Types ───────────────────────────────────────────────────

export interface AgentOptions {
  model?: string;
  promptVersion?: string;
  maxResults?: number;
  parallelQueries?: number;
}

// a paper as we use it internally
interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citations: number;
  venue?: string;
}

// the state that flows through the graph — each node reads/writes to this
interface AgentState {
  topic: string;
  searchQueries: string[];
  papers: Paper[];
  combinedPapers: Paper[];
  evaluation: string;
  error?: string;
}

// ── State Annotation ────────────────────────────────────────

// LangGraph needs this annotation to know what fields exist in state
// and how to merge results from multiple nodes
const AgentStateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  searchQueries: Annotation<string[]>,
  papers: Annotation<Paper[]>,
  combinedPapers: Annotation<Paper[]>,
  evaluation: Annotation<string>,
  error: Annotation<string | undefined>,
});

// ── LLM Setup ──────────────────────────────────────────────

// creates a fresh LLM instance — we need a new one each time
// because LangChain's ChatGoogleGenerativeAI is stateless anyway
function createLLM(model: string) {
  return new ChatGoogleGenerativeAI({
    model,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.3, // low temp = more focused, less creative. good for research.
  });
}

// ── Helper: Throttled Fetch ─────────────────────────────────

// basic rate limit handler — if we get a 429, wait and retry once
// (we have a fancier version in lib/throttle.ts but this works for now)
async function throttledFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetch(url, options);
  }
  return res;
}

// ── Helper: Parse OpenAlex Paper ────────────────────────────

// converts raw OpenAlex JSON into our clean Paper type
// handles the inverted index abstract thing (same as in the standard agent)
function parsePaper(paper: any): Paper {
  let abstract = "";
  if (paper.abstract_inverted_index) {
    const index = paper.abstract_inverted_index;
    const words: { pos: number; word: string }[] = [];
    for (const [word, positions] of Object.entries(index)) {
      for (const pos of positions as number[]) {
        words.push({ pos, word });
      }
    }
    abstract = words
      .sort((a, b) => a.pos - b.pos)
      .map((w) => w.word)
      .join(" ");
  }

  const authors = (paper.authorships ?? [])
    .map((a: any) => a.author?.display_name)
    .filter(Boolean);

  return {
    id: paper.id,
    title: paper.title,
    authors,
    abstract: abstract.slice(0, 500), // keep abstracts manageable
    year: paper.publication_year,
    citations: paper.cited_by_count,
    venue: paper.primary_location?.source?.display_name,
  };
}

// ── Node: Generate Search Queries ───────────────────────────

// the first step — ask the LLM to come up with diverse search queries
// this is way better than just searching for the raw topic because:
// - we get variations (synonyms, subtopics, broader/narrower terms)
// - parallel searches cast a wider net
// - different phrasings catch different papers
async function generateSearchQueries(state: AgentState): Promise<Partial<AgentState>> {
  log.info({ topic: state.topic }, "Generating search queries");

  try {
    const llm = createLLM(PRIMARY_MODEL);

    const systemPrompt = `You are a research assistant. Generate ${PARALLEL_QUERIES} diverse search queries for academic papers based on the given topic. 
    Return ONLY a JSON array of strings, no other text. 
    Include variations like:
    - Exact topic match
    - Related subtopics
    - Alternative terminology
    - Broader/narrower concepts`;

    // race the LLM against a 15s timeout — query generation should be fast
    const response = await Promise.race([
      llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(`Generate search queries for: ${state.topic}`),
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query generation timeout")), 15000)
      ),
    ]);

    const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    
    // the LLM sometimes wraps the JSON in markdown code blocks or adds extra text,
    // so we just grab the first JSON array we find
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      log.warn("Failed to parse queries from LLM, using fallback");
      return {
        searchQueries: [state.topic],
      };
    }

    try {
      const queries = JSON.parse(jsonMatch[0]) as string[];
      log.info({ queries }, "Generated search queries");
      return { searchQueries: queries };
    } catch {
      return { searchQueries: [state.topic] };
    }
  } catch (error) {
    log.warn({ error: (error as Error).message }, "Query generation failed, using topic as query");
    // if the LLM fails, just use the topic + some simple variations
    return {
      searchQueries: [
        state.topic,
        `${state.topic} review`,
        `${state.topic} recent`,
      ],
    };
  }
}

// ── Node: Search Papers (Parallel) ──────────────────────────

// kicks off all searches at once — this is where the parallelism happens
// each query gets its own API call, and we collect everything into one flat list
async function searchPapersParallel(state: AgentState): Promise<Partial<AgentState>> {
  log.info({ queries: state.searchQueries }, "Searching papers in parallel");

  const searchPromises = state.searchQueries.map(async (query) => {
    try {
      const url = new URL("https://api.openalex.org/works");
      url.searchParams.set("search", query);
      url.searchParams.set("per_page", String(MAX_RESULTS));
      url.searchParams.set(
        "select",
        "id,title,authorships,publication_year,cited_by_count,doi,primary_location,abstract_inverted_index"
      );

      const res = await throttledFetch(url.toString(), {
        headers: {
          "User-Agent": "ResearchPilot/1.0 (mailto:research@pilot.dev)",
        },
      });

      if (!res.ok) {
        log.error({ query, status: res.status }, "OpenAlex API error");
        return [];
      }

      const data = await res.json();
      return (data.results ?? []).map(parsePaper);
    } catch (error) {
      log.error({ query, error: (error as Error).message }, "Search failed");
      return [];
    }
  });

  // wait for all searches to finish, then flatten into one array
  const results = await Promise.all(searchPromises);
  const allPapers = results.flat();

  log.info({ totalPapers: allPapers.length }, "Parallel search completed");
  return { papers: allPapers };
}

// ── Node: Combine & Deduplicate ─────────────────────────────

// merges all the search results, removes duplicates (by title),
// and sorts by citation count — more citations = more impactful paper
function combineResults(state: AgentState): Partial<AgentState> {
  log.info({ count: state.papers.length }, "Combining and deduplicating results");

  const seen = new Set<string>();
  const combined: Paper[] = [];

  // sort by citations descending — most cited papers first
  const sorted = [...state.papers].sort((a, b) => b.citations - a.citations);

  for (const paper of sorted) {
    // deduplicate by title — different queries often return the same paper
    const normalizedTitle = paper.title.toLowerCase().trim();
    if (seen.has(normalizedTitle)) {
      continue;
    }
    seen.add(normalizedTitle);
    combined.push(paper);
  }

  // keep 2x maxResults so the LLM has more to evaluate
  const result = combined.slice(0, MAX_RESULTS * 2);
  log.info({ deduplicatedCount: result.length }, "Results combined");
  return { combinedPapers: result };
}

// ── Node: Evaluate with LLM ────────────────────────────────

// the final step — send all the deduplicated papers to the LLM
// and ask it to evaluate and score them for relevance
async function evaluatePapers(state: AgentState): Promise<Partial<AgentState>> {
  log.info({ count: state.combinedPapers.length }, "Evaluating papers with LLM");

  const llm = createLLM(PRIMARY_MODEL);
  const systemPrompt = loadPrompt("v1");

  const papersText = state.combinedPapers
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" (${p.year})\n   Authors: ${p.authors.join(", ")}\n   Citations: ${p.citations}\n   Venue: ${p.venue ?? "N/A"}\n   Abstract: ${p.abstract.slice(0, 200)}...`
    )
    .join("\n\n");

  const prompt = `Here are papers found for "${state.topic}":\n\n${papersText}\n\nEvaluate and present the results. Score each paper 0-1 for relevance.`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(prompt),
    ]);

    const evaluation = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    return { evaluation };
  } catch (error) {
    log.error({ error: (error as Error).message }, "LLM evaluation failed");
    
    // if the primary model fails, try the fallback
    try {
      const fallbackLlm = createLLM(FALLBACK_MODEL);
      const response = await fallbackLlm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(prompt),
      ]);
      const evaluation = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      return { evaluation };
    } catch (fallbackError) {
      return { error: `Evaluation failed: ${(fallbackError as Error).message}` };
    }
  }
}

// ── Build Graph ─────────────────────────────────────────────

// wires up the state graph — this is the "flow" of the agent:
// start -> generate queries -> search papers -> combine results -> evaluate -> end
function buildAgentGraph() {
  const graph = new StateGraph(AgentStateAnnotation)
    .addNode("generateQueries", generateSearchQueries)
    .addNode("searchPapers", searchPapersParallel)
    .addNode("combineResults", combineResults)
    .addNode("evaluatePapers", evaluatePapers)
    .addEdge("__start__", "generateQueries")
    .addEdge("generateQueries", "searchPapers")
    .addEdge("searchPapers", "combineResults")
    .addEdge("combineResults", "evaluatePapers")
    .addEdge("evaluatePapers", "__end__");

  return graph.compile();
}

// ── Main Agent ──────────────────────────────────────────────

// the public API — sets up initial state and runs the whole graph
export async function runLangGraphAgent(
  topic: string,
  options: AgentOptions = {}
): Promise<string> {
  const {
    model = PRIMARY_MODEL,
    promptVersion,
    maxResults = MAX_RESULTS,
    parallelQueries = PARALLEL_QUERIES,
  } = options;

  const startTime = Date.now();
  log.info({ topic, model, promptVersion, maxResults, parallelQueries }, "LangGraph agent started");

  const graph = buildAgentGraph();

  try {
    // run the whole graph with a hard timeout
    const result = await Promise.race([
      graph.invoke({
        topic,
        searchQueries: [],
        papers: [],
        combinedPapers: [],
        evaluation: "",
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
      ),
    ]);

    if (result.error) {
      return `Error: ${result.error}`;
    }

    if (!result.evaluation) {
      return `No evaluation generated for "${topic}". Try a different search query.`;
    }

    log.info({ durationMs: Date.now() - startTime }, "LangGraph agent completed");
    return result.evaluation;
  } catch (error) {
    log.error({ error: (error as Error).message }, "Agent failed");
    return `Error: Agent failed. ${(error as Error).message}`;
  }
}
