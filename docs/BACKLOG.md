# BACKLOG.md — Backlog

## Priority: High (Must Have)

- [ ] Initialize TypeScript project with strict mode
- [ ] Set up Express.js with middleware chain
- [ ] Configure Prisma with PostgreSQL
- [ ] Integrate Vercel AI SDK
- [ ] Implement searchPapers tool
- [ ] Implement getPaperDetails tool
- [ ] Write system prompt v1
- [ ] Build agent loop (max 5 steps)
- [ ] Create POST /api/search endpoint (streaming)
- [ ] Create GET /api/search/:id endpoint
- [ ] Create POST /api/papers/save endpoint
- [ ] Create GET /api/papers/saved endpoint
- [ ] Create DELETE /api/papers/save/:id endpoint
- [ ] Add Zod validation on all inputs
- [ ] Add rate limiting
- [ ] Add request-ID tracing
- [ ] Add structured logging (Pino)
- [ ] Docker Compose for local dev
- [ ] Basic error handling

## Priority: Medium (Should Have)

- [ ] Fallback to Claude on provider error
- [ ] Cost tracking per request
- [ ] Search history endpoint
- [ ] Redis caching for repeated searches
- [ ] Unit tests (Jest)
- [ ] Integration tests (Supertest)
- [ ] GitHub Actions CI
- [ ] Production Dockerfile
- [ ] Health check endpoint
- [ ] CORS configuration

## Priority: Low (Nice to Have)

- [ ] pgvector semantic search
- [ ] Paper embedding pipeline
- [ ] Multi-turn conversations
- [ ] Search query reformulation
- [ ] Citation graph visualization
- [ ] Frontend UI (React)
- [ ] User authentication
- [ ] Paper export (BibTeX, RIS)
- [ ] Webhook notifications
- [ ] Analytics dashboard

## Ideas (Future)

- [ ] Zotero integration
- [ ] Obsidian plugin
- [ ] Slack bot
- [ ] Chrome extension
- [ ] Mobile app
- [ ] Team workspaces
- [ ] Paper recommendations
- [ ] Auto-literature review
- [ ] Research trend analysis
