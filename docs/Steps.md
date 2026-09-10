# Steps.md — AI Agent: Zero to Production

Step-by-step guide to building the AI agent only. No frontend, no database, no API routes.

---

## Step 1: Initialize Project

```bash
mkdir researchpilot && cd researchpilot
npm init -y
npm i -D typescript @types/node tsx
npx tsc --init --strict --outDir dist --rootDir src
```

---

## Step 2: Install AI Dependencies

```bash
npm i ai @ai-sdk/openai zod
```

- `ai` — Vercel AI SDK (agent loop, streaming, tools)
- `@ai-sdk/openai` — OpenAI provider
- `zod` — tool input validation

---

## Step 3: Create Project Structure

```bash
mkdir -p src/agent/tools prompts
```

```
src/
└── agent/
    ├── tools/
    │   ├── search-papers.ts
    │   └── get-paper-details.ts
    └── index.ts
prompts/
└── research-agent-v1.txt
```

---

## Step 4: Set Environment Variable

```bash
export OPENAI_API_KEY=sk-...
```

Or create `.env`:
```
OPENAI_API_KEY=sk-...
```

---

## Step 5: Write Tool — `searchPapers`

```typescript
// src/agent/tools/search-papers.ts
import { tool } from "ai";
import { z } from "zod";

export const searchPapersTool = tool({
  description: "Search for academic papers by topic. Returns paper titles, authors, abstracts, year, and citation count.",
  parameters: z.object({
    query: z.string().describe("Search query or keywords"),
    maxResults: z.number().int().min(1).max(50).default(10),
  }),
  execute: async ({ query, maxResults }) => {
    const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(maxResults));
    url.searchParams.set("fields", "paperId,title,authors,abstract,year,citationCount,url");

    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY ?? "",
      },
    });

    if (!res.ok) throw new Error(`Semantic Scholar error: ${res.status}`);
    const data = await res.json();

    return {
      success: true,
      papers: data.data ?? [],
      totalResults: data.total ?? 0,
    };
  },
});
```

---

## Step 6: Write Tool — `getPaperDetails`

```typescript
// src/agent/tools/get-paper-details.ts
import { tool } from "ai";
import { z } from "zod";

export const getPaperDetailsTool = tool({
  description: "Get full details for specific papers by their IDs.",
  parameters: z.object({
    paperIds: z.array(z.string()).min(1).max(10).describe("Paper IDs to look up"),
  }),
  execute: async ({ paperIds }) => {
    const papers = await Promise.all(
      paperIds.map(async (id) => {
        const url = `https://api.semanticscholar.org/graph/v1/paper/${id}?fields=paperId,title,authors,abstract,year,citationCount,url,venue`;
        const res = await fetch(url, {
          headers: { "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY ?? "" },
        });
        if (!res.ok) return null;
        return res.json();
      })
    );

    return {
      success: true,
      papers: papers.filter(Boolean),
    };
  },
});
```

---

## Step 7: Write System Prompt

```text
// prompts/research-agent-v1.txt
You are ResearchPilot, an academic research assistant.

Your job is to find and evaluate research papers based on the user's topics.

## Instructions

1. Use `searchPapers` to find papers matching the user's topic.
2. Evaluate each paper's relevance based on title, abstract, and citation count.
3. For the top 3-5 most relevant papers, use `getPaperDetails` to get full abstracts.
4. Assign a relevance score (0-1) and a brief reason for each paper.
5. Present results ordered by relevance score (descending).

## Rules

- Never fabricate paper details. Only return papers from the tools.
- If no relevant papers are found, say so honestly.
- Max 5 tool calls total.
```

---

## Step 8: Build Agent Loop

```typescript
// src/agent/index.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { searchPapersTool } from "./tools/search-papers";
import { getPaperDetailsTool } from "./tools/get-paper-details";
import { readFileSync } from "fs";
import { join } from "path";

const systemPrompt = readFileSync(
  join(__dirname, "../prompts/research-agent-v1.txt"),
  "utf-8"
);

export async function runAgent(topic: string) {
  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    prompt: `Find research papers about: ${topic}`,
    tools: {
      searchPapers: searchPapersTool,
      getPaperDetails: getPaperDetailsTool,
    },
    maxSteps: 5,
  });

  return result;
}
```

---

## Step 9: Create Entry Point

```typescript
// src/index.ts
import { runAgent } from "./agent";

async function main() {
  const topic = process.argv[2] || "transformer attention mechanisms";

  console.log(`\nSearching for: ${topic}\n`);

  const result = await runAgent(topic);

  // Stream text output
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  // Log usage
  const usage = await result.usage;
  console.log("\n\n--- Usage ---");
  console.log(`Input tokens:  ${usage.promptTokens}`);
  console.log(`Output tokens: ${usage.completionTokens}`);
  console.log(`Total tokens:  ${usage.totalTokens}`);
}

main().catch(console.error);
```

---

## Step 10: Run and Test

```bash
# Run with tsx
npx tsx src/index.ts "transformer attention mechanisms"

# Expected output:
# Searching for: transformer attention mechanisms
#
# ## Top Papers
#
# ### 1. Attention Is All You Need (2017)
# - **Authors:** Ashish Vaswani, et al.
# - **Citations:** 90,000+
# - **Relevance:** 0.98
# - **Why:** Foundational paper introducing the transformer architecture...
#
# --- Usage ---
# Input tokens:  850
# Output tokens: 420
# Total tokens:  1270
```

---

## Step 11: Add Error Handling

```typescript
// src/agent/index.ts — wrap with try/catch
export async function runAgent(topic: string) {
  try {
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Find research papers about: ${topic}`,
      tools: {
        searchPapers: searchPapersTool,
        getPaperDetails: getPaperDetailsTool,
      },
      maxSteps: 5,
      onError: (error) => {
        console.error("Agent error:", error);
      },
    });

    return result;
  } catch (error) {
    console.error("Failed to run agent:", error);
    throw error;
  }
}
```

---

## Step 12: Add Fallback Model

```typescript
import { anthropic } from "@ai-sdk/anthropic";

async function getModel() {
  try {
    // Try OpenAI first
    return openai("gpt-4o");
  } catch {
    // Fallback to Anthropic
    console.warn("OpenAI unavailable, falling back to Claude");
    return anthropic("claude-sonnet-4-20250514");
  }
}
```

---

## Step 13: Add Throttling (Rate Limit API Calls)

```bash
npm i p-throttle
```

```typescript
// src/lib/throttle.ts
import pThrottle from "p-throttle";

export const throttle = pThrottle({
  limit: 10,       // requests
  interval: 1000,  // per second
});

export const throttledFetch = throttle(async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "5");
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetch(url, init);
  }

  return res;
});
```

---

## Step 14: Write Tests

```bash
npm i -D jest @types/jest ts-jest
npx ts-jest init
```

```typescript
// src/agent/tools/__tests__/search-papers.test.ts
import { searchPapersTool } from "../search-papers";

describe("searchPapers", () => {
  it("returns papers for valid query", async () => {
    const result = await searchPapersTool.execute({
      query: "transformers",
      maxResults: 5,
    }, "");

    expect(result.success).toBe(true);
    expect(Array.isArray(result.papers)).toBe(true);
  });
});
```

---

## Step 15: Add Prompt Versioning

```bash
# Create a new version
cp prompts/research-agent-v1.txt prompts/research-agent-v2.txt

# Update agent to use version from env
```

```typescript
// src/agent/index.ts
const promptVersion = process.env.PROMPT_VERSION || "v1";
const systemPrompt = readFileSync(
  join(__dirname, `../prompts/research-agent-${promptVersion}.txt`),
  "utf-8"
);
```

---

## Step 16: Wrap as CLI Tool

```json
// package.json
{
  "bin": {
    "researchpilot": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

```bash
# Build
npm run build

# Run
node dist/index.js "quantum computing"

# Or install globally
npm link
researchpilot "quantum computing"
```

---

## Step 17: Add Logging

```bash
npm i pino
```

```typescript
// src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
});
```

```typescript
// Use in agent
import { logger } from "../lib/logger";

logger.info({ topic, requestId }, "Search started");
logger.info({ paperCount, cost }, "Search completed");
logger.error({ error }, "Search failed");
```

---

## Step 18: Dockerize

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY prompts/ ./prompts/
CMD ["node", "dist/index.js"]
```

```bash
docker build -t researchpilot .
docker run -e OPENAI_API_KEY=sk-... researchpilot "attention mechanisms"
```

---

## Step 19: Deploy

### Option A: Run as CLI
```bash
# On any server
node dist/index.js "your topic"
```

### Option B: Wrap in minimal API
```typescript
// src/server.ts
import express from "express";
import { runAgent } from "./agent";

const app = express();
app.use(express.json());

app.post("/search", async (req, res) => {
  const { topic } = req.body;
  const result = await runAgent(topic);

  res.setHeader("Content-Type", "text/event-stream");
  for await (const chunk of result.textStream) {
    res.write(`data: ${chunk}\n\n`);
  }
  res.end();
});

app.listen(3000, () => console.log("Agent API on :3000"));
```

---

## Verification Checklist

- [ ] `npx tsx src/index.ts "test"` returns papers
- [ ] Streaming works (output appears incrementally)
- [ ] Tool calls succeed (Semantic Scholar responds)
- [ ] Max 5 steps enforced
- [ ] Error handling works (bad API key, network failure)
- [ ] Fallback model works (disable OpenAI, test Claude)
- [ ] Logging outputs structured JSON
- [ ] Docker builds successfully
- [ ] No secrets hardcoded
