# DECISIONS.md — Architecture Decision Records

## ADR-001: Use Vercel AI SDK for LLM Integration

**Date:** 2026-09-10  
**Status:** Accepted

### Context
We need to integrate with LLM providers (OpenAI, Anthropic) for the agent loop. There are multiple SDKs available: raw HTTP, LangChain, Vercel AI SDK, LlamaIndex.

### Decision
Use Vercel AI SDK as the primary abstraction layer.

### Rationale
- Provider-agnostic: switch between OpenAI/Anthropic with minimal code changes
- Built-in streaming support
- First-class tool-calling support
- Active maintenance, good TypeScript types
- Works with Next.js and Express

### Consequences
- + Easy to add fallback providers
- + Built-in telemetry and cost tracking
- - Another dependency to maintain
- - Slightly higher abstraction than raw API

---

## ADR-002: Semantic Scholar as Primary Paper Source

**Date:** 2026-09-10  
**Status:** Accepted

### Context
We need a source of academic papers. Options: Semantic Scholar, arXiv API, PubMed, OpenAlex, Crossref.

### Decision
Use Semantic Scholar as the primary paper source.

### Rationale
- 200M+ papers (largest free dataset)
- Rich metadata (abstracts, citations, references)
- Free API with reasonable rate limits (10 req/sec with key)
- Good search quality with semantic understanding
- No setup required beyond API key

### Consequences
- + Largest coverage of academic papers
- + Good search quality
- - Rate limits may require caching
- - Some papers may have incomplete metadata

---

## ADR-003: PostgreSQL + Prisma for Data Storage

**Date:** 2026-09-10  
**Status:** Accepted

### Context
We need to store user data, search history, and saved papers. Options: PostgreSQL, MongoDB, SQLite, Supabase.

### Decision
Use PostgreSQL with Prisma ORM.

### Rationale
- Relational data (users → searches → papers)
- Prisma provides type-safe queries and migrations
- pgvector extension available for future semantic search
- Battle-tested, good ecosystem

### Consequences
- + Type-safe database queries
- + Easy migrations
- + pgvector for future vector search
- - Requires PostgreSQL server (not SQLite simple)

---

## ADR-004: Agent Loop with Max 5 Steps

**Date:** 2026-09-10  
**Status:** Accepted

### Context
The agent needs to search, evaluate, and synthesize papers. We need to prevent infinite loops and control costs.

### Decision
Limit agent to 5 tool calls maximum.

### Rationale
- Most searches need 2-3 tool calls (search + details)
- 5 steps allows for query reformulation if needed
- Prevents runaway costs
- Keeps response time under 30 seconds

### Consequences
- + Predictable costs
- + Bounded response time
- - May miss some results on complex queries
- - Need good prompt engineering to use steps wisely

---

## ADR-005: Prompt Versioning in Files

**Date:** 2026-09-10  
**Status:** Accepted

### Context
System prompts need to be iterated on. We need version control and easy rollback.

### Decision
Store prompts in `prompts/` directory with semantic versioning.

### Rationale
- Prompts are code, not config
- Easy to diff between versions
- Can A/B test prompt variations
- Rollback is just changing PROMPT_VERSION env var

### Consequences
- + Version control for prompts
- + Easy to test variations
- + Rollback capability
- - Need to manage prompt files
