import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { throttledFetch } from "../lib/throttle";
import { loadPrompt } from "../lib/prompt-loader";
import { createChildLogger } from "../lib/logger";

const log = createChildLogger("agent");

// Config 
const PRIMARY_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.5-flash";
const TIMEOUT_MS = 60_000;
const MAX_RESULTS = 5;

// Types
interface AgentOptions {
  model?: string;
  promptVersion?: string;
  maxResults?: number;
}

interface AgentError extends Error {
  statusCode?: number;
  isRetryable?: boolean;
}

// Helpers 
function isProviderError(error: unknown): boolean {
  const err = error as AgentError;
  return (
    err instanceof Error &&
    [429, 500, 502, 503].includes(err.statusCode ?? 0)
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// Search OpenAlex 
async function searchPapers(topic: string, maxResults: number = MAX_RESULTS) {
  log.info({ topic, maxResults }, "Searching OpenAlex");

  const searchUrl = new URL("https://api.openalex.org/works");
  searchUrl.searchParams.set("search", topic);
  searchUrl.searchParams.set("per_page", String(maxResults));
  searchUrl.searchParams.set(
    "select",
    "id,title,authorships,publication_year,cited_by_count,doi,primary_location,abstract_inverted_index"
  );

  const res = await throttledFetch(searchUrl.toString(), {
    headers: {
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
      authors: authors.slice(0, 3),
      abstract: abstract.slice(0, 300),
      year: paper.publication_year,
      citations: paper.cited_by_count,
      venue,
    };
  });
}

// Format papers for LLM 
function formatPapers(papers: any[], topic: string): string {
  const papersText = papers
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" (${p.year})\n   Authors: ${p.authors.join(", ")}\n   Citations: ${p.citations}\n   Abstract: ${p.abstract}...`
    )
    .join("\n\n");

  return `Here are papers found for "${topic}":\n\n${papersText}\n\nEvaluate and present the results.`;
}

// Generate with model 
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

// Main agent
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

  // Step 1: Search papers
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

    // Step 3: Try fallback model
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
