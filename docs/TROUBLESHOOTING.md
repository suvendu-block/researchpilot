# TROUBLESHOOTING.md — Troubleshooting Guide

## Common Issues

### 1. "OPENAI_API_KEY is not set"

**Cause:** Environment variable not loaded
**Fix:**
```bash
# Check .env.local exists
cat .env.local

# Verify env var is set
echo $OPENAI_API_KEY

# Restart dev server after changing env
npm run dev
```

### 2. "Cannot find module '@/...'"

**Cause:** TypeScript path aliases not configured
**Fix:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. "Connection refused" (Database)

**Cause:** PostgreSQL not running
**Fix:**
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check status
docker-compose ps

# Check logs
docker-compose logs postgres
```

### 4. "Rate limit exceeded"

**Cause:** Too many requests
**Fix:**
- Wait for rate limit window to reset
- Check Redis is running: `redis-cli ping`
- Verify rate limit config in middleware

### 5. "Agent timeout"

**Cause:** LLM response too slow
**Fix:**
- Check OpenAI status: https://status.openai.com
- Increase `AGENT_TIMEOUT_MS` in env
- Check network connectivity
- Consider using a faster model

### 6. "Tool execution failed"

**Cause:** Semantic Scholar API error
**Fix:**
- Check API key is valid
- Check rate limits (10 req/sec with key)
- Check Semantic Scholar status
- Add retry logic

### 7. "TypeScript compilation error"

**Cause:** Type mismatch
**Fix:**
```bash
# Run type checker
npm run typecheck

# Fix errors shown
# Common: missing types, wrong imports
```

### 8. "Prisma migration failed"

**Cause:** Database schema out of sync
**Fix:**
```bash
# Reset database (DEVELOPMENT ONLY)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix
```

### 9. "Streaming not working"

**Cause:** Response headers not set correctly
**Fix:**
```typescript
// Ensure correct headers
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");
```

### 10. "CORS error"

**Cause:** Origin not allowed
**Fix:**
```typescript
// Add your origin to CORS config
app.use(cors({
  origin: ["http://localhost:3000", "https://your-domain.com"]
}));
```

## Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Verbose Prisma queries
DATABASE_URL="postgresql://...?schema=public&logging=true"
```

## Getting Help

1. Check this document
2. Search existing issues
3. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Environment info
   - Relevant logs
