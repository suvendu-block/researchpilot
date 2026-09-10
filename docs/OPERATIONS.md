# OPERATIONS.md — Operations Runbook

## Daily Operations

### Morning Checklist
- [ ] Check error rates (Sentry dashboard)
- [ ] Check response times (logs)
- [ ] Check cost tracking (usage logs)
- [ ] Verify health check endpoint

### Monitor Key Metrics
```bash
# Check health
curl https://your-domain.com/api/health

# Check logs
docker-compose logs --tail=100 app

# Check Redis
redis-cli info stats

# Check PostgreSQL
docker-compose exec postgres psql -U researchpilot -c "SELECT count(*) FROM users;"
```

## Incident Response

### LLM Provider Down
**Symptoms:** High error rate, timeout errors
**Impact:** Searches fail
**Response:**
1. Check provider status page
2. Verify API key is valid
3. Check if fallback model is working
4. If prolonged, notify users

### Database Down
**Symptoms:** Connection errors, 503 responses
**Impact:** All write operations fail
**Response:**
1. Check PostgreSQL status
2. Check connection pool
3. Restart if necessary
4. Check disk space

### High Latency
**Symptoms:** Response times > 5s
**Impact:** Poor user experience
**Response:**
1. Check LLM latency
2. Check database queries
3. Check Redis connectivity
4. Scale if needed

### High Costs
**Symptoms:** Daily cost > $50
**Impact:** Budget overrun
**Response:**
1. Check search volume
2. Check average tokens per request
3. Review prompt efficiency
4. Consider caching

## Common Tasks

### Restart Services
```bash
# Restart app
docker-compose restart app

# Restart all
docker-compose down && docker-compose up -d
```

### Database Maintenance
```bash
# Backup
docker-compose exec postgres pg_dump -U researchpilot > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U researchpilot
```

### Update Dependencies
```bash
npm update
npm audit fix
npx prisma migrate dev
```

### Clear Cache
```bash
# Clear Redis
redis-cli FLUSHALL
```

## Log Analysis

### Find Errors
```bash
docker-compose logs app | grep '"level":"error"'
```

### Find Slow Requests
```bash
docker-compose logs app | grep 'latencyMs' | sort -t: -k2 -n
```

### Find Rate Limited Requests
```bash
docker-compose logs app | grep 'rate_limit'
```

## Backup Schedule

| Data | Frequency | Retention |
|------|-----------|-----------|
| Database | Daily | 30 days |
| Redis | On change | 7 days |
| Logs | Daily | 30 days |
| Prompts | On change | Forever |
