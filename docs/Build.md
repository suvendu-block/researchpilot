# ResearchPilot — Build Plan

## What

A TypeScript AI agent that finds research papers based on user-provided topics.
It uses a tool-calling LLM agent with the Semantic Scholar API to search, evaluate,
and synthesize relevant academic papers.

## Docs

| File | What it covers |
|------|----------------|
| [docs/architecture.md](docs/architecture.md) | System overview, data flow, components, error handling, security |
| [docs/api.md](docs/api.md) | REST endpoints, request/response schemas, rate limits |
| [docs/data-models.md](docs/data-models.md) | Zod schemas, TypeScript types, Prisma DB schema, Redis keys |
| [docs/agent-design.md](docs/agent-design.md) | Agent loop, tools, system prompt, termination, cost tracking |
| [docs/retrieval.md](docs/retrieval.md) | Semantic Scholar API, vector DB index, embedding pipeline, hybrid strategy |
| [docs/providers.md](docs/providers.md) | Model selection, pricing, Vercel AI SDK integration, fallback strategy |
| [docs/deployment.md](docs/deployment.md) | Env vars, Docker, CI/CD, production checklist, monitoring |

## Stack

- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Next.js or Express (TBD)
- **AI:** Vercel AI SDK + OpenAI GPT-4o (primary), Anthropic Claude (fallback)
- **Database:** PostgreSQL (Prisma) + pgvector (optional)
- **Cache/Rate-limit:** Redis (Upstash)
- **Paper Source:** Semantic Scholar API

## Getting Started

```bash
cd ResearchPilot
npm install
cp .env.example .env.local   # fill in API keys
docker-compose up -d          # start postgres + redis
npx prisma migrate dev        # create tables
npm run dev                   # start dev server
```

## Env Vars

```
OPENAI_API_KEY              # Required
ANTHROPIC_API_KEY           # Optional (fallback)
SEMANTIC_SCHOLAR_API_KEY    # Optional but recommended
DATABASE_URL                # PostgreSQL connection string
REDIS_URL                   # Redis connection string
PROMPT_VERSION              # Active prompt (default: v1)
MAX_AGENT_STEPS             # Agent tool-call limit (default: 5)
AGENT_TIMEOUT_MS            # Timeout (default: 30000)
```
