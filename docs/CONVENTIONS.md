# CONVENTIONS.md — Coding Conventions

## TypeScript

- **Strict mode:** Always (`strict: true` in tsconfig)
- **No `any`:** Use `unknown` and narrow with type guards
- **Functional style:** Prefer functions over classes
- **Immutable:** Use `const` by default, avoid mutation
- **Named exports:** Always use named exports, not default exports

```typescript
// Good
export function searchPapers(query: string): Promise<Paper[]> { ... }

// Bad
export default function searchPapers(query: string) { ... }
```

## File Structure

```
src/
├── api/           # Route handlers
├── agent/         # Agent loop, tools
│   ├── tools/     # Tool implementations
│   └── prompts/   # System prompts (versioned)
├── lib/           # Shared utilities
├── config/        # Environment, settings
├── schemas/       # Zod schemas
└── types/         # TypeScript types
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `search-papers.ts` |
| Functions | camelCase | `searchPapers()` |
| Types | PascalCase | `SearchRequest` |
| Constants | SCREAMING_SNAKE | `MAX_AGENT_STEPS` |
| Zod schemas | PascalCase + Schema | `SearchRequestSchema` |

## Imports

```typescript
// Group imports: external, then internal, then relative
import { z } from "zod";
import { streamText } from "ai";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

import { SearchRequestSchema } from "@/schemas/search";
```

## Error Handling

```typescript
// Always catch and transform errors
try {
  const result = await externalApi.call();
  return { success: true, data: result };
} catch (error) {
  logger.error({ error, requestId }, "External API failed");
  return { success: false, error: "Service temporarily unavailable" };
}
```

## Logging

```typescript
// Use structured logging with context
logger.info({ requestId, userId, topicCount }, "Search completed");
logger.error({ error, requestId }, "Agent failed");
```

## Validation

```typescript
// Validate at boundaries, trust internally
const request = SearchRequestSchema.parse(req.body); // Throws on invalid
// or
const result = SearchRequestSchema.safeParse(req.body); // Returns { success, data, error }
```

## Testing

- Unit tests for tools and utilities
- Integration tests for API endpoints
- Use `describe` blocks that match file/function names
- Test both success and error paths

```typescript
describe("searchPapers", () => {
  it("returns papers for valid query", async () => { ... });
  it("throws on empty query", async () => { ... });
  it("handles API timeout gracefully", async () => { ... });
});
```
