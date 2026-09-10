import "dotenv/config";
import { runAgent } from "./agents";
import { createChildLogger } from "./lib/logger";

const log = createChildLogger("cli");

// ── Parse args ─────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(flag: string, short?: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1) return args[idx + 1];
  if (short) {
    const sIdx = args.indexOf(short);
    if (sIdx !== -1) return args[sIdx + 1];
  }
  return undefined;
}

function hasFlag(flag: string, short?: string): boolean {
  return args.includes(flag) || (short ? args.includes(short) : false);
}

// ── Help 
if (hasFlag("--help", "-h")) {
  console.log(`
ResearchPilot - AI Research Paper Finder

Usage:
  researchpilot [options]

Options:
  -t, --topic <text>          Search topic (required)
  -r, --results <number>      Number of papers (default: 5)
  -m, --model <name>          Override LLM model
  -p, --prompt-version <ver>  Prompt version (default: v1)
  -h, --help                  Show this help

Examples:
  researchpilot -t "transformer attention"
  researchpilot --topic "neural networks" --results 10
  researchpilot -t "quantum computing" -p v2
`);
  process.exit(0);
}

// ── Get options ────────────────────────────────────────────
const topic = getArg("--topic", "-t");
const results = parseInt(getArg("--results", "-r") || "5", 10);
const model = getArg("--model", "-m");
const promptVersion = getArg("--prompt-version", "-p");

if (!topic) {
  console.error("Error: --topic is required. Use --help for usage.");
  process.exit(1);
}

// ── Banner ─────────────────────────────────────────────────
console.log(`
ResearchPilot - AI Research Paper Finder
────────────────────────────────────────
Topic:    ${topic}
Results:  ${results}
Prompt:   ${promptVersion || "v1"}
`);

// ── Run agent ──────────────────────────────────────────────
const startTime = Date.now();
log.info({ topic, model, promptVersion, results }, "CLI started");

try {
  const text = await runAgent(topic, { model, promptVersion, maxResults: results });
  console.log(text);
  log.info({ durationMs: Date.now() - startTime }, "CLI completed");
} catch (error) {
  log.error({ error: (error as Error).message }, "CLI failed");
  console.error("\n[error]", (error as Error).message);
  process.exit(1);
}
