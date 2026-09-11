import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { loadPrompt } from "../lib/prompt-loader";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("langgraph-agent");

// ── Config ──────────────────────────────────────────────────
const PRIMARY_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.5-flash";
const TIMEOUT_MS = 120_000;
const MAX_RESULTS = 5;
const PARALLEL_QUERIES = 3;

// ── Types ───────────────────────────────────────────────────
export interface AgentOptions {
  model?: string;
  promptVersion?: string;
  maxResults?: number;
  parallelQueries?: number;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citations: number;
  venue?: string;
}

interface AgentState {
  topic: string;
  searchQueries: string[];
  papers: Paper[];
  combinedPapers: Paper[];
  evaluation: string;
  error?: string;
}

// ── State Annotation ────────────────────────────────────────
const AgentStateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  searchQueries: Annotation<string[]>,
  papers: Annotation<Paper[]>,
  combinedPapers: Annotation<Paper[]>,
  evaluation: Annotation<string>,
  error: Annotation<string | undefined>,
});

// ── LLM Setup ──────────────────────────────────────────────
function createLLM(model: string) {
  return new ChatGoogleGenerativeAI({
    model,
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.3,
  });
}

// ── Helper: Throttled Fetch ─────────────────────────────────
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
    abstract: abstract.slice(0, 500),
    year: paper.publication_year,
    citations: paper.cited_by_count,
    venue: paper.primary_location?.source?.display_name,
  };
}

// ── Node: Generate Search Queries ───────────────────────────
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
    
    // Extract JSON array from response
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
    // Fallback: use topic and simple variations
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

  const results = await Promise.all(searchPromises);
  const allPapers = results.flat();

  log.info({ totalPapers: allPapers.length }, "Parallel search completed");
  return { papers: allPapers };
}

// ── Node: Combine & Deduplicate ─────────────────────────────
function combineResults(state: AgentState): Partial<AgentState> {
  log.info({ count: state.papers.length }, "Combining and deduplicating results");

  const seen = new Set<string>();
  const combined: Paper[] = [];

  // Sort by citations descending
  const sorted = [...state.papers].sort((a, b) => b.citations - a.citations);

  for (const paper of sorted) {
    // Deduplicate by title similarity
    const normalizedTitle = paper.title.toLowerCase().trim();
    if (seen.has(normalizedTitle)) {
      continue;
    }
    seen.add(normalizedTitle);
    combined.push(paper);
  }

  const result = combined.slice(0, MAX_RESULTS * 2); // Keep more for evaluation
  log.info({ deduplicatedCount: result.length }, "Results combined");
  return { combinedPapers: result };
}

// ── Node: Evaluate with LLM ────────────────────────────────
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
    
    // Fallback to simpler model
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
