# CONTRIBUTING.md — Contribution Guide

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/my-feature`
5. Make your changes
6. Run checks: `npm run check`
7. Commit: `git commit -m "feat: add my feature"`
8. Push: `git push origin feature/my-feature`
9. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Start databases
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

## Code Style

- TypeScript strict mode
- No `any` types
- Functional style
- Named exports only
- Zod validation at boundaries

See [CONVENTIONS.md](CONVENTIONS.md) for full details.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add paper search tool
fix: handle API timeout gracefully
docs: update architecture diagram
test: add unit tests for searchPapers
chore: update dependencies
```

## Pull Request Process

1. Fill out the PR template
2. Link the related issue
3. Ensure all checks pass
4. Request review from a maintainer
5. Address review comments
6. Merge when approved

## PR Title Format

```
feat: add paper search tool
fix: handle API timeout gracefully
docs: update architecture diagram
```

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:int      # Integration tests
npm run test:e2e      # E2E tests
```

## Code Review Checklist

- [ ] Types are correct
- [ ] Validation is in place
- [ ] Errors are handled
- [ ] Tests cover new code
- [ ] Documentation is updated
- [ ] No secrets in code
- [ ] Logging includes request-ID
