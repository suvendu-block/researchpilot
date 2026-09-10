# SPECIFICATION.md — Technical Specification

## System Components

### 1. API Server
- **Framework:** Express.js or Next.js API Routes
- **Validation:** Zod schemas at every boundary
- **Logging:** Pino with structured JSON
- **Tracing:** Request-ID injected into all logs and model calls

### 2. Agent Engine
- **SDK:** Vercel AI SDK `streamText`
- **Model:** OpenAI GPT-4o (primary), Anthropic Claude (fallback)
- **Tools:** `searchPapers`, `getPaperDetails`, `searchLocalIndex`
- **Max Steps:** 5 (configurable)
- **Timeout:** 30 seconds

### 3. Paper Retrieval
- **Primary:** Semantic Scholar API (200M+ papers)
- **Optional:** Local vector index (pgvector)
- **Rate Limit:** 10 req/sec with API key

### 4. Data Store
- **Primary DB:** PostgreSQL via Prisma
- **Cache:** Redis for rate limiting and session data
- **Optional:** pgvector extension for embeddings

## API Specification

### POST /api/search
```
Request:  { topics: string[], maxResults?: number, yearRange?: { from?, to? } }
Response: Stream<PaperChunk>
Rate:     20 req/min
```

### GET /api/search/:id
```
Response: { paper: Paper }
Rate:     60 req/min
```

### POST /api/papers/save
```
Request:  { paperId: string, tags?: string[], notes?: string }
Response: { saved: SavedPaper }
Rate:     30 req/min
```

### GET /api/papers/saved
```
Response: { papers: SavedPaper[] }
Rate:     60 req/min
```

### DELETE /api/papers/save/:id
```
Response: 204 No Content
```

## Data Schemas

### Paper
```typescript
{
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citationCount: number;
  url: string;
  venue?: string;
  doi?: string;
  relevanceScore: number;  // 0-1
  relevanceReason: string;
}
```

### SearchRequest
```typescript
{
  topics: string[];        // 1-5 topics, each 1-200 chars
  maxResults?: number;     // 1-50, default 10
  yearRange?: { from?: number; to?: number };
  fields?: string[];       // subset of paper fields
}
```

## Agent Prompt Structure

```
System: "You are ResearchPilot, an academic research assistant..."
User:   "Find papers about {topics}"
Tools:  [searchPapers, getPaperDetails]
MaxSteps: 5
```

## Error Codes

| Code | Meaning |
|------|---------|
| VALIDATION_ERROR | Invalid request body |
| RATE_LIMITED | Too many requests |
| PROVIDER_ERROR | LLM provider unavailable |
| TOOL_ERROR | Paper search API failed |
| TIMEOUT | Agent exceeded time limit |
| PARTIAL_RESULTS | Agent hit max steps |
