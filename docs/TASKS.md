# TASKS.md — Task Breakdown

## Epic 1: Project Setup

| ID | Task | Status | Assignee |
|----|------|--------|----------|
| T-1.1 | Initialize npm project with TypeScript | Pending | - |
| T-1.2 | Set up Express.js server | Pending | - |
| T-1.3 | Configure Prisma + PostgreSQL | Pending | - |
| T-1.4 | Set up Redis connection | Pending | - |
| T-1.5 | Add Zod validation middleware | Pending | - |
| T-1.6 | Add Pino structured logging | Pending | - |
| T-1.7 | Create request-ID middleware | Pending | - |
| T-1.8 | Set up environment variable config | Pending | - |

## Epic 2: Agent Engine

| ID | Task | Status | Assignee |
|----|------|--------|----------|
| T-2.1 | Integrate Vercel AI SDK | Pending | - |
| T-2.2 | Implement `searchPapers` tool | Pending | - |
| T-2.3 | Implement `getPaperDetails` tool | Pending | - |
| T-2.4 | Write system prompt v1 | Pending | - |
| T-2.5 | Build agent loop with max steps | Pending | - |
| T-2.6 | Add fallback model (Claude) | Pending | - |
| T-2.7 | Add cost tracking per call | Pending | - |
| T-2.8 | Add timeout handling | Pending | - |

## Epic 3: API Endpoints

| ID | Task | Status | Assignee |
|----|------|--------|----------|
| T-3.1 | `POST /api/search` - streaming endpoint | Pending | - |
| T-3.2 | `GET /api/search/:id` - paper details | Pending | - |
| T-3.3 | `POST /api/papers/save` - save paper | Pending | - |
| T-3.4 | `GET /api/papers/saved` - list saved | Pending | - |
| T-3.5 | `DELETE /api/papers/save/:id` - remove | Pending | - |
| T-3.6 | `GET /api/health` - health check | Pending | - |
| T-3.7 | Rate limiting middleware | Pending | - |
| T-3.8 | Error handling middleware | Pending | - |

## Epic 4: Database

| ID | Task | Status | Assignee |
|----|------|--------|----------|
| T-4.1 | User model + migration | Pending | - |
| T-4.2 | Search model + migration | Pending | - |
| T-4.3 | SavedPaper model + migration | Pending | - |
| T-4.4 | Redis rate-limit store | Pending | - |
| T-4.5 | Redis session cache | Pending | - |

## Epic 5: Testing

| ID | Task | Status | Assignee |
|----|------|--------|----------|
| T-5.1 | Unit tests for tools | Pending | - |
| T-5.2 | Integration tests for API | Pending | - |
| T-5.3 | Agent behavior tests | Pending | - |
| T-5.4 | Prompt evaluation tests | Pending | - |
| T-5.5 | E2E tests (Playwright) | Pending | - |

## Epic 6: Deployment

| ID | Task | Status | Assignee |
|----|------|--------|----------|
| T-6.1 | Dockerfile (multi-stage) | Pending | - |
| T-6.2 | docker-compose.yml | Pending | - |
| T-6.3 | GitHub Actions CI | Pending | - |
| T-6.4 | Production environment setup | Pending | - |
| T-6.5 | Monitoring (Sentry) | Pending | - |
