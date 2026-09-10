# TESTING.md — Testing Strategy

## Testing Pyramid

```
        ╱╲
       ╱  ╲        E2E Tests (5%)
      ╱    ╲       - Full user flows
     ╱──────╲
    ╱        ╲     Integration Tests (25%)
   ╱          ╲    - API endpoints
  ╱────────────╲   - Database queries
 ╱              ╲  - External API calls
╱                ╲ Unit Tests (70%)
╱────────────────╲ - Tools, utilities, schemas
```

## Test Types

### Unit Tests (70%)
- Tool implementations
- Zod schemas
- Utility functions
- Cost calculations

```bash
npm run test:unit
```

### Integration Tests (25%)
- API endpoints (Supertest)
- Database operations
- Agent behavior (mocked LLM)

```bash
npm run test:int
```

### E2E Tests (5%)
- Full search flow
- Paper save/unsave
- Streaming behavior

```bash
npm run test:e2e
```

## Test Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:unit     # Unit only
npm run test:int      # Integration only
npm run test:e2e      # E2E only
npm run test:coverage # Coverage report
```

## Coverage Requirements

| Component | Minimum Coverage |
|-----------|-----------------|
| Overall | 80% |
| Agent tools | 90% |
| API endpoints | 85% |
| Schemas | 95% |

## Writing Tests

### Unit Test Example
```typescript
import { searchPapersTool } from "@/agent/tools/search-papers";

describe("searchPapers", () => {
  it("returns papers for valid query", async () => {
    const result = await searchPapersTool.execute({
      query: "transformers",
      maxResults: 5,
    });

    expect(result.success).toBe(true);
    expect(result.papers).toHaveLength(5);
  });

  it("handles empty results", async () => {
    const result = await searchPapersTool.execute({
      query: "xyznonexistent",
      maxResults: 5,
    });

    expect(result.success).toBe(true);
    expect(result.papers).toHaveLength(0);
  });
});
```

### Integration Test Example
```typescript
import request from "supertest";
import { app } from "@/api/app";

describe("POST /api/search", () => {
  it("returns streaming response", async () => {
    const response = await request(app)
      .post("/api/search")
      .send({ topics: ["transformers"] })
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/text\/event-stream/);
  });

  it("validates request body", async () => {
    await request(app)
      .post("/api/search")
      .send({ topics: [] })
      .expect(400);
  });
});
```

## Prompt Evaluation

```bash
npm run eval
```

Evaluates:
- Relevance scores
- Citation accuracy
- Response quality
- Edge case handling

## CI Integration

Tests run on every push and PR:
```yaml
- run: npm run typecheck
- run: npm run lint
- run: npm test
```
