# ARCHITECTURE.md — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│                   (Web / CLI / API)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER                               │
│              Express / Next.js Routes                       │
│         ┌──────────┬──────────┬──────────┐                  │
│         │ /search  │ /papers  │ /health  │                  │
│         └──────────┴──────────┴──────────┘                  │
│              Zod validation, Rate limiting                  │
│              Request-ID injection                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENT ENGINE                             │
│                Vercel AI SDK streamText                      │
│         ┌──────────────────────────────────┐                │
│         │  LLM (GPT-4o / Claude fallback)  │                │
│         └──────────────┬───────────────────┘                │
│                        │ tool calls                         │
│         ┌──────────────┼───────────────────┐                │
│         ▼              ▼                   ▼                │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐        │
│  │search    │  │getPaper      │  │searchLocal     │        │
│  │Papers    │  │Details       │  │Index           │        │
│  └────┬─────┘  └──────┬───────┘  └───────┬────────┘        │
└───────┼───────────────┼──────────────────┼─────────────────┘
        │               │                  │
        ▼               ▼                  ▼
┌───────────────┐ ┌───────────┐  ┌─────────────────┐
│Semantic       │ │Semantic   │  │ pgvector /      │
│Scholar API    │ │Scholar    │  │ Qdrant          │
│               │ │API        │  │ (optional)      │
└───────────────┘ └───────────┘  └─────────────────┘
        │               │                  │
        └───────────────┼──────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│         ┌──────────────┐  ┌──────────────┐                  │
│         │ PostgreSQL   │  │ Redis        │                  │
│         │ (Prisma)     │  │ (cache/rl)   │                  │
│         └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Failure Mode |
|-----------|---------------|--------------|
| API Layer | Request validation, routing, rate limiting | 400/429/503 responses |
| Agent Engine | Orchestrate LLM + tools, manage conversation | Timeout → partial results |
| Semantic Scholar | Paper search and metadata | Retry → fallback to cache |
| PostgreSQL | User data, search history, saved papers | 503 + alert |
| Redis | Rate limit counters, session cache | Degrade to in-memory |

## Data Flow

```
1. Client sends POST /api/search { topics: ["attention mechanisms"] }
2. API validates with zod, generates request-ID
3. API calls agent engine with topics
4. Agent loads system prompt (versioned)
5. Agent calls searchPapers tool → Semantic Scholar API
6. Agent evaluates results, may call getPaperDetails for top picks
7. Agent streams Paper[] chunks back to client
8. API logs usage, cost, and timing with request-ID
```

## Security Boundaries

```
Client ──[HTTPS]──▶ API ──[internal]──▶ Agent ──[API key]──▶ External APIs
                       │
                       ├── API keys server-side only
                       ├── User input sanitized
                       └── No PII in logs/embeddings
```
