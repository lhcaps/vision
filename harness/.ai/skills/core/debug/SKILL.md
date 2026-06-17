# Debug (customized for the meta-harness)

> Project-specific override. Loaded for this project instead of
> the bundle version.

## When to load

- A test that used to pass is failing.
- A `harness` subcommand produces wrong output.
- The agent's previous fix didn't actually fix it.
- You find yourself saying "I think it's the X".

## Procedure

1. **Reproduce.** Get a minimal, deterministic reproduction.
   If you can't reproduce, you can't debug — ask the user
   for a failing case.
2. **Capture the actual behavior.** Exact error message,
   exact exit code, exact log line, exact input. Don't
   paraphrase.
3. **Form 3-5 hypotheses.** Rank them by likelihood. Each
   must be falsifiable by an experiment you can run in
   seconds.
4. **Run the cheapest experiment first.** A `console.log`
   before the suspected line beats reading 200 lines of code.
5. **Log results.** Update the hypothesis as you go. When
   one is confirmed, write the fix and a regression test.
6. **Stop when the test passes twice.**

## CLI-specific debugging (this project)

When debugging the harness CLI itself:

- **Run with `HARNESS_DEBUG=1`** to get full stack traces
  on error. This is the single most useful environment
  variable.
- **Capture the exit code:**
  ```bash
  node cli/harness.mjs <cmd> ; echo $?
  ```
  Non-zero is a bug, even if the output looks fine.
- **For `install` / `update` / `diff` bugs, copy the
  manifest before and after and diff them:**
  ```bash
  cp .harness/manifest.yaml /tmp/manifest.before
  node cli/harness.mjs <cmd>
  diff /tmp/manifest.before .harness/manifest.yaml
  ```
  The manifest is the source of truth.
- **For YAML parser bugs, isolate to a 5-line YAML snippet.**
  The parser is intentionally minimal; do not paper over
  bugs by switching libraries. The test suite is in
  `test/yaml.test.mjs`; add a failing case, then fix.
- **For path bugs on Windows:**
  - Use `path.dirname(fileURLToPath(import.meta.url))`
    in scripts. `URL(import.meta.url).pathname` returns
    a leading `/` that `path.resolve` mishandles.
  - When spawning child processes from tests, use
    `path.resolve` of a `fileURLToPath(import.meta.url)`
    result.
  - PowerShell `Remove-Item -Recurse -Force` from this
    shell is destructive and can permanently delete
    files outside the Recycle Bin. Prefer `cmd /c "rmdir /s /q"`
    only on the EXACT path you intend, never with
    concatenated paths.
- **For copier bugs, write a 5-line scenario in a
  scratch dir:**
  ```bash
  mkdir /tmp/harness-debug
  cd /tmp/harness-debug
  node /path/to/harness/cli/harness.mjs init generic
  node /path/to/harness/cli/harness.mjs install
  node /path/to/harness/cli/harness.mjs diff
  ```
  If it works there, the bug is in the target repo's
  state, not the copier.

## Module-by-module suspect list

When the bug is "something is wrong" and you don't know
where, check in this order:

1. **The user's customization.** Most "regressions" are
   the user's customized copy diverging from the bundle.
2. **The manifest.** Has the manifest drifted? `harness
   doctor` will tell you.
3. **The CLI argv parser** (`cli/harness.mjs`, `cli/lib/runner.mjs`).
4. **The YAML parser** (`cli/lib/yaml.mjs`). It's small,
   but it has been wrong before.
5. **The copier** (`cli/lib/copier.mjs`). The path
   resolution and the conflict-detection logic are the
   most likely culprits.
6. **The detector** (`cli/lib/detector.mjs`).
7. **The manifest** (`cli/lib/manifest.mjs`).
8. **The doctor** (`cli/lib/doctor.mjs`).
9. **The output formatter** (`cli/lib/output.mjs`). Usually
   cosmetic.

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

- Patching the symptom. The user reports "the file is
  empty after install"; the cause is probably the
  manifest, not the file copy. Don't add a default-
  content fallback if the real bug is in
  `collectBundleFiles`.
- "It works on my machine." If the test passes only with
  a specific Node version, specific cwd, or specific
  locale, that's a test bug.
- More than 30 minutes of debugging without writing the
  hypothesis log. Stop and log.
- Doing destructive file operations from a PowerShell
  shell that's been concatenated with other commands.
  Move to `cmd /c "rmdir /s /q <exact path>"` for
  removals, and always verify the path first.
