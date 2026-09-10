# SECURITY.md — Security Policies

## Security Principles

1. **User input is untrusted** — always validate and sanitize
2. **API keys are server-side only** — never expose to clients
3. **PII stays out of logs** — redact sensitive data
4. **Defense in depth** — multiple layers of protection

## API Security

### Authentication
- All endpoints require Bearer token (JWT)
- Tokens validated on every request
- Tokens expire after 24 hours

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/search | 20 | 1 minute |
| GET /api/search/:id | 60 | 1 minute |
| POST /api/papers/save | 30 | 1 minute |
| GET /api/papers/saved | 60 | 1 minute |

### Input Validation
- All request bodies validated with Zod
- Rejected requests return 400 with error details
- Maximum topic length: 200 characters
- Maximum topics per request: 5

### CORS
```typescript
// Only allow known origins
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
```

## Data Security

### API Keys
```bash
# Good: server-side only
OPENAI_API_KEY=sk-...

# Bad: never expose to client
NEXT_PUBLIC_OPENAI_API_KEY=sk-...  # WRONG
```

### PII Handling
- Don't log user email or name
- Don't embed PII in vector databases
- Don't send PII to external APIs
- Redact PII in error messages

### Database
- Use parameterized queries (Prisma handles this)
- Encrypt sensitive fields at rest
- Use connection pooling
- Regular backups

## LLM Security

### Prompt Injection
- Treat user input as untrusted
- Never interpolate user input into system prompts directly
- Validate tool inputs with zod
- Monitor for injection attempts

### Output Validation
- Validate all LLM outputs with zod
- Don't execute code from LLM responses
- Don't allow LLM to access raw database
- Tools are the only interface

### Cost Protection
- Max 5 steps per agent invocation
- 30-second timeout
- Cost tracking per request
- Alert on unusual spending

## Incident Response

1. **Detect** — monitoring alerts
2. **Contain** — disable affected endpoints
3. **Investigate** — review logs with request-ID
4. **Remediate** — fix the vulnerability
5. **Report** — document and notify affected users

## Security Checklist

- [ ] No secrets in code
- [ ] API keys server-side only
- [ ] All inputs validated
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] PII excluded from logs
- [ ] HTTPS enforced
- [ ] Dependencies audited (`npm audit`)
