# PROJECT.md — Project Overview

## ResearchPilot

An AI-powered research paper finder that helps researchers, students, and professionals discover relevant academic papers based on topics of interest.

## Problem

Finding relevant research papers is time-consuming. Researchers spend hours searching through databases, reading abstracts, and filtering results. Existing tools return keyword matches but don't understand the *intent* behind a query.

## Solution

ResearchPilot uses an AI agent with tool-calling capabilities to:

1. **Understand** the user's research topic in natural language
2. **Search** academic databases (Semantic Scholar, arXiv) intelligently
3. **Evaluate** paper relevance using LLM reasoning
4. **Synthesize** results with explanations of why each paper matters

## Target Users

- Graduate students doing literature reviews
- Researchers exploring new domains
- Engineers looking for state-of-the-art methods
- Academics tracking citation trends

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 + TypeScript |
| AI | Vercel AI SDK + OpenAI GPT-4o |
| Database | PostgreSQL (Prisma) |
| Cache | Redis |
| Papers | Semantic Scholar API |

## Status

**Phase:** Planning  
**Version:** 0.0.0  
**Last Updated:** 2026-09-10
