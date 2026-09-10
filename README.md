# ResearchPilot

AI-powered research paper finder. Search for academic papers by topic and get AI-evaluated results with relevance scores.

## Quick Start

```bash
# Install
npm install

# Set API key
export GOOGLE_GENERATIVE_AI_API_KEY=your-key

# Run
npm start -- -t "transformer attention mechanisms"
```

## What It Does

1. **Search** — Queries OpenAlex (250M+ papers) for your topic
2. **Evaluate** — Gemini LLM rates each paper's relevance (0-1)
3. **Present** — Structured list with titles, authors, citations, and explanations

**Example output:**
```
1. "Attention Is All You Need" (2017)
   Authors: Vaswani, Shazeer, Parmar
   Citations: 7327
   Relevance: 1.0
   Why: Foundational paper introducing the Transformer...
```

## CLI Usage

```bash
# Basic search
npm start -- -t "neural networks"

# More results
npm start -- -t "quantum computing" -r 10

# Use different prompt
npm start -- -t "deep learning" -p v2

# Help
npm start -- --help
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-t, --topic` | Search topic (required) | — |
| `-r, --results` | Number of papers | 5 |
| `-m, --model` | Override LLM model | gemini-3.6-flash |
| `-p, --prompt-version` | Prompt version | v1 |
| `-h, --help` | Show help | — |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Google Gemini API key |
| `PROMPT_VERSION` | No | Active prompt (default: v1) |
| `LOG_LEVEL` | No | Logging level (default: info) |

Get a free Gemini API key at: https://aistudio.google.com/apikey

## Project Structure

```
src/
├── cli.ts                  ← CLI entry point
├── index.ts                ← Simple entry point
├── agents/
│   ├── index.ts            ← Agent logic (search + LLM)
│   └── tools/
│       ├── search-papers.ts      ← OpenAlex search tool
│       └── get-paper-details.ts  ← OpenAlex details tool
└── lib/
    ├── logger.ts           ← Structured logging (Pino)
    ├── throttle.ts         ← Rate limiting
    └── prompt-loader.ts    ← Prompt versioning

prompts/
├── research-agent-v1.txt   ← Default prompt
└── research-agent-v2.txt   ← Improved prompt
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (strict) |
| Runtime | Node.js 20 |
| LLM | Google Gemini 3.6 Flash |
| Papers | OpenAlex API (free, no key) |
| Logging | Pino |
| Rate Limiting | p-throttle |
| Tests | Node.js test runner + tsx |

## Docker

```bash
# Build
docker build -t researchpilot .

# Run
docker run --env-file .env researchpilot -t "your topic"

# Development
docker-compose run researchpilot -t "your topic"
```

## Development

```bash
# Install
npm install

# Run
npm start -- -t "your topic"

# Tests
npm test

# Logs
LOG_LEVEL=debug npm start -- -t "your topic"
```

## License

ISC
