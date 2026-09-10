# HUMAN_GUIDELINES.md — Human Contributor Guide

## Welcome

This guide is for humans contributing to ResearchPilot.

## Prerequisites

- Node.js 20+
- PostgreSQL (or Docker)
- Redis (or Docker)
- OpenAI API key
- Basic TypeScript knowledge

## First Time Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-org/researchpilot.git
   cd researchpilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start databases**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

5. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Start dev server**
   ```bash
   npm run dev
   ```

## Development Workflow

1. Pick a task from [TASKS.md](TASKS.md)
2. Create a branch: `git checkout -b feat/task-name`
3. Write code
4. Write tests
5. Run checks: `npm run check`
6. Commit with conventional commit message
7. Open PR

## Code Review

- Review your own PR first
- Check for type safety
- Check for error handling
- Check for tests
- Check for documentation

## Getting Help

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Open an issue for bugs
- Start a discussion for questions
