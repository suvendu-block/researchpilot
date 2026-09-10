# DEPLOYMENT.md — Deployment Guide

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)
```bash
npm i -g vercel
vercel
```

### Option 2: Railway
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Option 3: Fly.io
```bash
fly auth login
fly launch
fly deploy
```

### Option 4: Docker + VPS
```bash
docker build -t researchpilot .
docker-compose up -d
```

## Environment Variables

Set these in your deployment platform:

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
ANTHROPIC_API_KEY=sk-ant-...
SEMANTIC_SCHOLAR_API_KEY=...

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Config
PROMPT_VERSION=v1
MAX_AGENT_STEPS=5
AGENT_TIMEOUT_MS=30000
NODE_ENV=production
```

## Pre-Deployment Checklist

- [ ] All env vars set
- [ ] Database migrations applied
- [ ] TypeScript compiles without errors
- [ ] Tests pass
- [ ] Docker builds successfully
- [ ] Health check endpoint works
- [ ] Rate limiting configured
- [ ] CORS configured for production domain
- [ ] Logging configured
- [ ] Error tracking set up

## Post-Deployment Verification

```bash
# Health check
curl https://your-domain.com/api/health

# Test search
curl -X POST https://your-domain.com/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"topics": ["transformers"]}'
```

## Rollback

If something goes wrong:

```bash
# Vercel
vercel rollback

# Railway
railway rollback

# Fly.io
fly releases list
fly deploy --image <previous-image>

# Docker
docker-compose down
docker-compose up -d --build
```

## Monitoring

After deployment, monitor:
- Error rates (Sentry)
- Response times (logs)
- Cost tracking (usage logs)
- Rate limit hits (Redis)

## Scaling

| Metric | Threshold | Action |
|--------|-----------|--------|
| Response time > 5s | p95 | Check LLM latency |
| Error rate > 1% | per minute | Check provider status |
| Cost > $50/day | daily | Review search volume |
| Rate limit hits > 100/hour | per endpoint | Adjust limits or add capacity |
