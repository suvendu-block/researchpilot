# REQUIREMENTS.md — Requirements

## Functional Requirements

### FR-1: Paper Search
- User can submit one or more research topics
- System returns relevant papers with metadata
- Results include: title, authors, abstract, year, citations, URL

### FR-2: AI Evaluation
- Agent evaluates paper relevance to the query
- Each paper gets a relevance score (0-1)
- Each paper gets a human-readable relevance reason

### FR-3: Search History
- User's past searches are stored
- User can view and re-run previous searches

### FR-4: Paper Library
- User can save papers to a personal library
- Saved papers support tags and notes
- User can remove papers from library

### FR-5: Streaming Response
- Results stream to the client in real-time
- User sees papers as they're found, not all at once

## Non-Functional Requirements

### NFR-1: Performance
- Search response time < 5 seconds (p95)
- Streaming starts within 500ms of request
- Agent completes within 30 seconds

### NFR-2: Reliability
- 99.9% uptime for API endpoints
- Graceful degradation when LLM provider is down
- Fallback to secondary model on provider errors

### NFR-3: Security
- API keys never exposed to client
- User input treated as untrusted
- Rate limiting on all endpoints
- PII excluded from logs

### NFR-4: Scalability
- Support 100 concurrent users
- Handle 1000 searches per hour
- Database connection pooling

## Constraints

- Must use TypeScript throughout
- Must use Vercel AI SDK for LLM integration
- Must validate all inputs with zod
- Must have request-ID tracing
