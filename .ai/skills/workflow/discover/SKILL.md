# Discover

> Scan the repo and emit a structured understanding
> (architecture, risks, hot spots). One-shot output the
> agent can re-read on every turn.

## When to load

- "What is this project?"
- "Map the codebase."
- When the agent's intake is stale or missing.

## Procedure

1. **Identify the entry point.** Where does the program
   start? Where do requests come in? What runs the build?
2. **Map the top-level structure.** 1-2 levels of the
   source tree. Note which folders are code, which are
   config, which are tests, which are docs.
3. **Map the data flow.** Where does data come from, where
   does it go, where does it mutate?
4. **Map the trust boundaries.** External input, internal
   services, secrets, file system, network. Where does
   untrusted become trusted?
5. **Map the test surface.** What is tested, what isn't.
   Run the test command. Note the count.
6. **Find the hot spots.** Files that are most-touched
   (git log -n 100 --name-only | sort | uniq -c | sort
   -rn | head). Files that are largest. Files that are
   most-commented.
7. **Find the risks.** Untested, untyped, unlinted,
   unowned. Recently-churned. Recently-broken.
8. **Output a single document** the agent can re-read in
   30 seconds.

## What NOT to do

- Read every file. The point is to be fast. Read the
  README, the top-level config, the top-level directory
  listing, and 3-5 representative files.
- Recreate the architecture diagram. A textual map is
  enough.
- Re-do the intake. The intake is a conversation. The
  discovery is a scan.

## Output

```
## Discovery: <project>

### Entry point
- <path>

### Tree (top 2 levels)
```
src/
  api/
  domain/
  infra/
test/
docs/
```

### Data flow
- input: <where>
- transform: <where>
- storage: <where>
- output: <where>

### Trust boundaries
- external: <list>
- internal: <list>
- secrets: <list>

### Tests
- count: N
- coverage: <measured or unknown>
- run command: <cmd>

### Hot spots
- <file>: <why hot>

### Risks
- <risk>: <evidence>
```

Save this to `.ai/harness/discovery.md` so future turns
can re-read it without re-scanning.
