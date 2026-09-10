# AGENTS.md — AI Agent Instructions

## For AI Agents Working on This Codebase

You are an AI assistant helping build ResearchPilot. Follow these instructions:

## Context

- **Language:** TypeScript (strict mode)
- **Framework:** Express.js or Next.js
- **AI SDK:** Vercel AI SDK
- **Database:** PostgreSQL + Prisma
- **Validation:** Zod at every boundary

## Rules

1. **Never use `any`** — use `unknown` and narrow types
2. **Always validate** — zod schemas at API boundaries
3. **Always log** — structured JSON with request-ID
4. **Always handle errors** — no unhandled rejections
5. **Never commit secrets** — use env vars
6. **Always stream** — user-facing LLM calls stream by default
7. **Always terminate** — agents have max steps and timeouts

## File Organization

```
src/
├── api/           # Route handlers (one file per resource)
├── agent/         # Agent engine
│   ├── tools/     # Tool implementations
│   └── index.ts   # Agent orchestration
├── lib/           # Shared utilities
├── config/        # Environment config
├── schemas/       # Zod schemas
└── types/         # TypeScript types
```

## Common Patterns

### API Endpoint
```typescript
import { z } from "zod";
import { Request, Response } from "express";

const RequestSchema = z.object({ ... });

export async function handler(req: Request, res: Response) {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error });
  }
  // ... business logic
}
```

### Tool Definition
```typescript
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "What this tool does",
  parameters: z.object({ ... }),
  execute: async (params) => {
    // ... implementation
    return { success: true, data: ... };
  },
});
```

### Structured Logging
```typescript
import { logger } from "@/lib/logger";

logger.info({ requestId, userId }, "Operation completed");
logger.error({ error, requestId }, "Operation failed");
```

## Do NOT

- Don't hardcode API keys
- Don't skip validation
- Don't use `console.log` (use Pino)
- Don't throw raw errors (transform them)
- Don't make multiple LLM calls without streaming
- Don't ignore TypeScript errors
