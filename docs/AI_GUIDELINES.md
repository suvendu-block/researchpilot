# AI_GUIDELINES.md — AI Usage Guidelines

## How We Use AI

AI is a tool, not a replacement for engineering judgment. Use it wisely.

## Allowed Uses

### Code Generation
- Generate boilerplate and repetitive code
- Suggest implementations based on patterns
- Write test cases from function signatures
- Generate documentation from code

### Code Review
- Suggest improvements to code quality
- Identify potential bugs or security issues
- Recommend performance optimizations
- Check for consistency with codebase patterns

### Documentation
- Generate API documentation from schemas
- Write README sections from code analysis
- Create inline documentation
- Summarize architectural decisions

### Testing
- Generate unit test cases
- Suggest edge cases to test
- Write integration test scenarios
- Create test fixtures

## Prohibited Uses

### Never Without Review
- Don't commit AI-generated code without human review
- Don't trust AI with security-critical code
- Don't let AI make architectural decisions alone
- Don't use AI to bypass code review

### Never At All
- Don't use AI to generate secrets or credentials
- Don't use AI to scrape or bypass security
- Don't use AI to impersonate humans
- Don't use AI to make legal or ethical decisions

## Quality Gates

Every AI-generated code must pass:

1. **Type check:** `npm run typecheck`
2. **Lint:** `npm run lint`
3. **Tests:** `npm test`
4. **Human review:** At least one approval

## Prompt Engineering

### System Prompts
- Version controlled in `prompts/` directory
- Tested with eval suite before deployment
- Never contain secrets or PII
- Always include termination conditions

### Tool Descriptions
- Clear, specific descriptions
- Typed parameters with examples
- Error handling documented
- Rate limits noted

## Cost Tracking

| Operation | Approximate Cost |
|-----------|-----------------|
| Single search (5 papers) | ~$0.008 |
| 1000 searches/day | ~$8/day |
| Monthly (1000/day) | ~$240/month |

Monitor costs daily. Set alerts at $50/day.

## Evaluation

Before deploying prompt changes:

1. Run eval suite: `npm run eval`
2. Check relevance scores
3. Verify no regressions
4. Test edge cases
5. Human review of sample outputs
