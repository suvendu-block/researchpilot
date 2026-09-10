# ROADMAP.md — Development Roadmap

## Phase 1: Foundation (Week 1-2)

### Week 1: Project Setup
- [x] Create project structure
- [x] Write documentation
- [ ] Initialize TypeScript project
- [ ] Set up Express/Next.js
- [ ] Configure Prisma + PostgreSQL
- [ ] Set up Redis connection
- [ ] Add Zod validation
- [ ] Add Pino logging

### Week 2: Agent Core
- [ ] Integrate Vercel AI SDK
- [ ] Implement `searchPapers` tool
- [ ] Implement `getPaperDetails` tool
- [ ] Write system prompt (v1)
- [ ] Build agent loop with max steps
- [ ] Add cost tracking
- [ ] Add request-ID tracing

## Phase 2: API Layer (Week 3)

- [ ] `POST /api/search` endpoint (streaming)
- [ ] `GET /api/search/:id` endpoint
- [ ] `POST /api/papers/save` endpoint
- [ ] `GET /api/papers/saved` endpoint
- [ ] `DELETE /api/papers/save/:id` endpoint
- [ ] Rate limiting middleware
- [ ] Error handling middleware
- [ ] Health check endpoint

## Phase 3: Frontend (Week 4)

- [ ] Search form UI
- [ ] Streaming results display
- [ ] Paper detail view
- [ ] Saved papers library
- [ ] Search history view

## Phase 4: Hardening (Week 5)

- [ ] Unit tests (Jest)
- [ ] Integration tests (Supertest)
- [ ] E2E tests (Playwright)
- [ ] Prompt evaluation suite
- [ ] Security audit
- [ ] Performance testing
- [ ] Docker containerization
- [ ] CI/CD pipeline

## Phase 5: Launch (Week 6)

- [ ] Deploy to production
- [ ] Set up monitoring (Sentry)
- [ ] Set up error tracking
- [ ] Write operations runbook
- [ ] Create troubleshooting guide
- [ ] Launch beta

## Future Phases

### Phase 2.0: Enhanced Search (Month 2)
- Multi-turn conversations
- Search query reformulation
- Citation graph visualization

### Phase 3.0: Knowledge Engine (Month 3-4)
- Paper embeddings + semantic search
- Auto-summarization
- Literature review generation
