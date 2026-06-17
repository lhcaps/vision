# Security Audit

> Audit a surface for OWASP Top 10 and stack-specific risks.
> Use this for any user-facing surface, especially anything
> handling auth, PII, or money.

## When to load

- "Is this secure?"
- "Audit the auth flow."
- Pre-launch for any new surface.

## Procedure

1. **Scope the surface.** Enumerate the endpoints, the
   inputs, the trust boundaries. A "surface" is one
   feature, not the whole app.
2. **Check OWASP Top 10** for the surface:
   - **A01 Broken Access Control**: who can do what? Are
     the checks on the server, not the client? Are they
     tested?
   - **A02 Cryptographic Failures**: TLS in transit,
     strong cipher in storage, no plaintext secrets.
   - **A03 Injection**: SQL, NoSQL, OS command, LDAP.
     Parameterize everything. Don't string-concat.
   - **A04 Insecure Design**: the threat model. Does the
     surface handle abuse, replay, race conditions?
   - **A05 Security Misconfiguration**: defaults, exposed
     debug endpoints, verbose errors.
   - **A06 Vulnerable Components**: outdated deps with
     known CVEs.
   - **A07 Auth Failures**: weak password policy, no MFA,
     session fixation.
   - **A08 Data Integrity**: unsigned updates, unverified
     deserialization.
   - **A09 Logging Failures**: missing audit logs, no
     alerting on suspicious events.
   - **A10 SSRF**: user-controlled URLs being fetched
     server-side.
3. **Check stack-specific risks.** Each stack has a few
   classics:
   - **Node/Express**: prototype pollution, JSON parser
     DoS, missing rate limits.
   - **Next.js**: open redirects via `redirect()`,
     RSC data leaks, server-action auth.
   - **FastAPI**: missing OAuth scopes, `eval` / `exec`,
     unbounded query params.
4. **Check the manifest.** Any customized skill that
   guards auth? Any `eval` or `exec` in the dependency
   tree?
5. **Report.** For each finding: severity, location,
   impact, fix. Don't bury critical issues in a list of
   minors.

## Severity scale

- **Critical**: exploitable now, real impact, trivial fix.
  Block release.
- **High**: exploitable with effort, real impact. Block
  release unless mitigated.
- **Medium**: not directly exploitable but a real risk.
  Plan to fix in next sprint.
- **Low**: hygiene. Track in backlog.

## Output

```
## Security Audit: <surface>

### Scope
- endpoints: <list>
- trust boundaries: <list>

### OWASP findings
- A0X - <issue>: severity, location, fix

### Stack-specific findings
- <list>

### Manifest check
- <findings or "clean">

### Severity summary
- critical: N
- high: N
- medium: N
- low: N

### Verdict
- ship / ship-with-mitigation / block
```
