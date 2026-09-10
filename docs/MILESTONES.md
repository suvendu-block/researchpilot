# MILESTONES.md — Milestones

## Milestone 1: Foundation Complete
**Target:** End of Week 2  
**Status:** Not Started

### Deliverables
- [ ] Project initializes without errors
- [ ] Database connects and migrations run
- [ ] Agent responds to a topic with paper results
- [ ] Streaming works end-to-end

### Success Criteria
```bash
npm run dev
# POST /api/search { "topics": ["transformers"] }
# Returns streamed Paper[] with relevance scores
```

---

## Milestone 2: API Complete
**Target:** End of Week 3  
**Status:** Not Started

### Deliverables
- [ ] All 5 API endpoints functional
- [ ] Zod validation on all inputs
- [ ] Rate limiting active
- [ ] Error responses consistent

### Success Criteria
```bash
curl -X POST /api/search -d '{"topics":["NLP"]}'
# Returns 200 with streaming papers

curl /api/papers/saved
# Returns saved papers list
```

---

## Milestone 3: Frontend Complete
**Target:** End of Week 4  
**Status:** Not Started

### Deliverables
- [ ] Search form works
- [ ] Results stream in real-time
- [ ] Papers can be saved/unsaved
- [ ] Search history visible

### Success Criteria
- User can search for a topic and see results appear one by one
- User can save papers and view them later

---

## Milestone 4: Hardened
**Target:** End of Week 5  
**Status:** Not Started

### Deliverables
- [ ] Test coverage > 80%
- [ ] All prompts versioned
- [ ] Security checklist passed
- [ ] Docker builds successfully

### Success Criteria
```bash
npm test              # All pass
npm run typecheck     # No errors
docker build .        # Builds without errors
```

---

## Milestone 5: Launched
**Target:** End of Week 6  
**Status:** Not Started

### Deliverables
- [ ] Deployed to production
- [ ] Monitoring active
- [ ] Documentation complete
- [ ] Beta users onboarded

### Success Criteria
- 10 beta users can search and save papers
- No P0 bugs in first week
- Response time < 5s (p95)
