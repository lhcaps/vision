# Ship-Readiness Checklist

Run this **before** opening a PR or tagging a release.

## Pre-merge

- [ ] All tests pass.
- [ ] Linter and formatter are clean.
- [ ] `harness doctor` passes (manifest, no missing files, no drift).
- [ ] No `harness diff` conflicts.
- [ ] CHANGELOG entry added (if user-facing).
- [ ] No secrets in the diff.
- [ ] Bundle files I touched have a registry entry (if I added a new
      skill or rule).
- [ ] Stack overlay still in sync with the stack (if I changed the
      stack).

## PR

- [ ] Title follows `type(scope): summary` conventional commits.
- [ ] Body uses the review-changes prompt's output format.
- [ ] At least one approver requested.
- [ ] CI is green (doctor + tests).

## Release (if cutting a release)

- [ ] Version bumped in `package.json` (or `meta.yaml` for the harness
      itself) per SemVer.
- [ ] `CHANGELOG.md` updated with the new version, date, and link.
- [ ] Git tag matches version.
- [ ] Release notes include: what changed, why, how to migrate,
      known issues.
- [ ] A follow-up issue is filed for anything that didn't make it.
