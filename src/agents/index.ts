import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { throttledFetch } from "../lib/throttle";
import { loadPrompt } from "../lib/prompt-loader";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("agent");

// ── Config ─────────────────────────────────────────────────

// default models — gemini 3.6 flash is fast and cheap, 3.5 as fallback
const PRIMARY_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.5-flash";
const TIMEOUT_MS = 60_000; // 60s should be plenty for most queries
const MAX_RESULTS = 5;

// ── Types ──────────────────────────────────────────────────

// options you can pass when calling the agent
interface AgentOptions {
  model?: string;        // override the default model
  promptVersion?: string; // which prompt file to use (v1, v2, etc.)
  maxResults?: number;   // how many papers to fetch
}

// extend Error with optional fields from the provider
interface AgentError extends Error {
  statusCode?: number;
  isRetryable?: boolean;
}

// ── Helpers ────────────────────────────────────────────────

// check if this is a transient provider error we should retry
function isProviderError(error: unknown): boolean {
  const err = error as AgentError;
  return (
    err instanceof Error &&
    [429, 500, 502, 503].includes(err.statusCode ?? 0)
  );
}

// race a promise against a timeout — if it takes too long, bail
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ── Search OpenAlex ────────────────────────────────────────

// hits the OpenAlex API to find papers matching the topic
// OpenAlex is great because it's free and doesn't need an API key
async function searchPapers(topic: string, maxResults: number = MAX_RESULTS) {
  log.info({ topic, maxResults }, "Searching OpenAlex");

  const searchUrl = new URL("https://api.openalex.org/works");
  searchUrl.searchParams.set("search", topic);
  searchUrl.searchParams.set("per_page", String(maxResults));
  // only grab the fields we actually need — keeps response size down
  searchUrl.searchParams.set(
    "select",
    "id,title,authorships,publication_year,cited_by_count,doi,primary_location,abstract_inverted_index"
  );

  const res = await throttledFetch(searchUrl.toString(), {
    headers: {
      // OpenAlex asks us to identify ourselves — this is polite
      "User-Agent": "ResearchPilot/1.0 (mailto:research@pilot.dev)",
    },
  });

  if (!res.ok) {
    log.error({ status: res.status }, "OpenAlex API error");
    throw new Error(`OpenAlex API error: ${res.status}`);
  }

  const data = await res.json();
  const count = data.results?.length ?? 0;
  log.info({ count, total: data.meta?.count }, "Papers found");

  return (data.results ?? []).map((paper: any) => {
    // OpenAlex stores abstracts as an "inverted index" — basically a word position map.
    // we need to reconstruct the actual text from it. weird format but it works.
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

    const venue = paper.primary_location?.source?.display_name ?? undefined;

    return {
      title: paper.title,
      authors: authors.slice(0, 3), // cap at 3 authors to keep it readable
      abstract: abstract.slice(0, 300), // abstracts can be long, trim it
      year: paper.publication_year,
      citations: paper.cited_by_count,
      venue,
    };
  });
}

// ── Format papers for LLM ──────────────────────────────────

// takes the raw paper data and turns it into a nice text block
// that the LLM can evaluate and score
function formatPapers(papers: any[], topic: string): string {
  const papersText = papers
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" (${p.year})\n   Authors: ${p.authors.join(", ")}\n   Citations: ${p.citations}\n   Abstract: ${p.abstract}...`
    )
    .join("\n\n");

  return `Here are papers found for "${topic}":\n\n${papersText}\n\nEvaluate and present the results.`;
}

// ── Generate with model ────────────────────────────────────

// the actual LLM call — swaps in whichever model we're using
async function generateWithModel(
  model: string,
  prompt: string,
  promptVersion?: string
): Promise<string> {
  log.info({ model, promptVersion }, "Generating with LLM");

  const result = await generateText({
    model: google(model),
    system: loadPrompt(promptVersion),
    prompt,
  });

  if (!result.text) {
    throw new Error(`No text generated from ${model}`);
  }

  log.info({ model, tokens: result.usage?.totalTokens }, "LLM completed");
  return result.text;
}

// ── Main agent ─────────────────────────────────────────────

// the entry point — searches for papers, then asks the LLM to evaluate them
// if the primary model fails, we try the fallback automatically
export async function runAgent(
  topic: string,
  options: AgentOptions = {}
): Promise<string> {
  const {
    model = PRIMARY_MODEL,
    promptVersion,
    maxResults = MAX_RESULTS,
  } = options;

  const startTime = Date.now();
  log.info({ topic, model, promptVersion, maxResults }, "Agent started");

  // Step 1: Search papers from OpenAlex
  let papers: any[];
  try {
    papers = await searchPapers(topic, maxResults);
  } catch (error) {
    log.error({ error: (error as Error).message }, "Search failed");
    return `Error: Failed to search papers. ${(error as Error).message}`;
  }

  if (papers.length === 0) {
    log.warn({ topic }, "No papers found");
    return `No papers found for "${topic}". Try a different search query.`;
  }

  const prompt = formatPapers(papers, topic);

  // Step 2: Generate evaluation with primary model
  try {
    const text = await withTimeout(
      generateWithModel(model, prompt, promptVersion),
      TIMEOUT_MS
    );
    log.info({ durationMs: Date.now() - startTime }, "Agent completed");
    return text;
  } catch (error) {
    log.warn({ model, error: (error as Error).message }, "LLM failed");

    // Step 3: If primary model choked, try the fallback
    // this catches 429 (rate limit), 500s, and timeouts
    if (isProviderError(error) || (error as Error).message.includes("Timeout")) {
      const fallback = model === PRIMARY_MODEL ? FALLBACK_MODEL : PRIMARY_MODEL;
      log.info({ fallback }, "Trying fallback model");
      try {
        const text = await withTimeout(
          generateWithModel(fallback, prompt, promptVersion),
          TIMEOUT_MS
        );
        log.info({ durationMs: Date.now() - startTime }, "Agent completed (fallback)");
        return text;
      } catch (fallbackError) {
        log.error({ error: (fallbackError as Error).message }, "Fallback also failed");
        return `Error: Both ${model} and ${fallback} failed. Please try again later.`;
      }
    }

    throw error;
  }
}
