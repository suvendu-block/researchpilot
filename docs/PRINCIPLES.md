# PRINCIPLES.md — Design Principles

## 1. Models Are Unreliable Components

Treat LLMs as unreliable. Everything around them — validation, evals, guardrails, fallbacks — is where the engineering lives.

- Always validate model output with zod
- Always have a fallback plan
- Never trust model output without verification

## 2. Stream by Default

Anything user-facing should stream. Users should see results as they're generated, not all at once.

- Use `streamText` for all user-facing LLM calls
- Structure streaming chunks with discriminated unions
- Handle partial results gracefully

## 3. Validate at Boundaries

Every inbound and outbound data contract gets a zod schema. No exceptions.

- API request bodies: zod validated
- API responses: zod typed
- Tool inputs/outputs: zod validated
- Database queries: Prisma type-safe

## 4. Tools Are the Only Interface

The agent's only interface to the world is tools. Never give it raw access to databases, APIs, or files.

- Tools have clear, descriptive names
- Tools have typed inputs and outputs
- Tools are idempotent where possible
- Tools handle their own errors

## 5. Explicit Termination

Agents must terminate. No infinite loops, no unbounded retry.

- Max steps enforced
- Timeout enforced
- Partial results returned on failure
- Clear error messages

## 6. Grounded Retrieval

RAG responses must be grounded in retrieved context. No hallucinated sources.

- Cite sources for every claim
- Refuse to answer when context is insufficient
- Evaluate faithfulness in tests

## 7. Security as Default

User input is untrusted data. API keys never reach clients. PII stays out of logs.

- Sanitize all user input
- Server-side API keys only
- PII redaction in logs
- Rate limiting on every endpoint

## 8. Fail Gracefully

Every component can fail. Design for failure, not just success.

- Fallback models on provider errors
- Partial results on timeout
- Cached responses when API is down
- Clear error messages to users

## 9. Observability from Day One

If you can't measure it, you can't fix it. Add logging, tracing, and metrics from the start.

- Request-ID tracing through all calls
- Structured JSON logs
- Cost tracking per request
- Latency metrics

## 10. Iterate with Evidence

Don't guess. Measure. Use evals, tests, and metrics to drive decisions.

- Prompt changes require eval runs
- Model changes require benchmark comparison
- Performance claims require measurements
