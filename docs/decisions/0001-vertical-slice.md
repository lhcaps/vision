# ADR 0001, Build Vertical Slices

## Status

Accepted.

## Context

The source plan warns that building database, API, and UI as separate horizontal layers invites dead code. VisionFlow needs the product engine to be visible early.

## Decision

Each phase should connect frontend, API/contracts, persistence, and verification where applicable.

## Consequences

- Early phases may include thin implementations across multiple apps.
- Shared contracts become important earlier.
- UI states must be seeded before real backend persistence is complete.
