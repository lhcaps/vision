# Phase 11: README & Portfolio First Impression - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

## Phase Boundary

This phase delivers a portfolio-grade README. It is a documentation-only phase — no code changes beyond README updates and one documentation file.

## Implementation Decisions

### README Content
- Fix API port from 3000 to 3100 in all locations
- Add demo GIF placeholder section with recording instructions
- Add ASCII architecture diagram (6 components, data flow arrows)
- Add implementation status table (implemented/in-progress/not-started)
- Add known limitations section (honest, specific, actionable)
- Add database migrations section (generate, migrate, push, studio)
- Add testing section (test commands, coverage, python tests)

### Demo Assets
- `docs/demo/README-DEMO.md` with recording script
- README demo section with placeholder GIF path
- Demo flow covers: overview → media → annotate → lock → pipeline → job → overlay → metrics

### Architecture Diagram
- ASCII diagram (not Mermaid — renders everywhere)
- 6 components: Web App, NestJS API, PostgreSQL, Redis, MinIO, CV Worker
- Data flow arrows showing request/response and async paths
- Distinguishes between implemented and planned capabilities

## Deferred Ideas

- Actually record the demo GIF (requires developer to run the app and record)
- Add architecture diagram as an SVG for docs/ (future enhancement)
