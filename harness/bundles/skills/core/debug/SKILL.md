# Debug

> Systematic debugging with a hypothesis log. Stop guessing; start
> disproving.

## When to load

- A test that used to pass is failing.
- A user reports a bug with a vague description.
- The agent's previous fix didn't actually fix it.
- You find yourself saying "I think it's the X".

## Procedure

1. **Reproduce.** Get a minimal, deterministic reproduction. If
   you can't reproduce, you can't debug — ask the user for a
   failing case.
2. **Capture the actual behavior.** Exact error message, exact
   exit code, exact log line, exact input. Don't paraphrase.
3. **Form 3-5 hypotheses.** Rank them by likelihood. Each must be
   falsifiable by an experiment you can run in seconds.
4. **Run the cheapest experiment first.** A `console.log` before
   the suspected line beats reading 200 lines of code.
5. **Log results.** Update the hypothesis as you go. When one is
   confirmed, write the fix and a regression test.
6. **Stop when the test passes twice** (once on this branch, once
   from a fresh clone, if practical).

## CLI-specific debugging (this project)

When debugging the harness CLI itself:

- Run with `HARNESS_DEBUG=1` to get full stack traces on error.
- Capture the exit code: `node cli/harness.mjs <cmd> ; echo $?`.
- For `install` / `update` / `diff` bugs, copy the manifest before
  and after and diff them. The manifest is the source of truth.
- For YAML parser bugs, isolate to a 5-line YAML snippet. The
  parser is intentionally minimal; do not paper over bugs by
  switching libraries.
- For path bugs on Windows, use `path.dirname(fileURLToPath(import.meta.url))`
  in scripts. `URL(import.meta.url).pathname` returns a leading
  `/` that `path.resolve` mishandles.

## Hypothesis log template

```
## Bug: <one-line>
**Repro**: <command + input>
**Actual**: <exact>
**Expected**: <exact>

### Hypotheses
1. <hypothesis A> (likelihood: high)
   - Test: <what to do>
   - Result: ...
2. <hypothesis B> (likelihood: med)
   - Test: <what to do>
   - Result: ...

### Confirmed
- <the one that turned out to be true>

### Fix
- <change>, and the regression test: <name>
```

## Anti-patterns

- Patching the symptom. The user reports "the file is empty after
  install"; the cause is probably the manifest, not the file copy.
  Don't add a default-content fallback if the real bug is in
  `collectBundleFiles`.
- "It works on my machine." If the test passes only with a specific
  Node version, specific cwd, or specific locale, that's a test
  bug.
- More than 30 minutes of debugging without writing the hypothesis
  log. Stop and log.
