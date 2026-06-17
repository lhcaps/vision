# AI Integration Eval

For any feature that uses an LLM, generative model, or AI tool.
Score each pillar 0-3.

## 1. Input Contract
- Is the system prompt explicit, scoped, and self-contained?
- Is the user input treated as untrusted? Sanitized? Bounded?
- Are examples (few-shot) used, and are they the **right** examples?

## 2. Output Contract
- Is the output type/JSON schema strict?
- Is the output validated before it is used downstream?
- Is there a fallback for malformed output?

## 3. Failure Modes
- What happens on timeout, rate-limit, refusal, empty completion,
  schema-violation?
- Is each failure surfaced to the user, with a clear recovery path?
- Are retries bounded and back-off'd?

## 4. Cost & Latency
- Is the prompt the minimum size for the task?
- Is the model the minimum capability for the task?
- Is caching used where it would help?
- Are p50 / p95 / p99 latency budgeted?

## 5. Eval & Regression
- Is there a reference set (>= 20 cases)?
- Are rubrics defined for each case?
- Are evals run on every PR?
- Are regressions caught in CI?

## 6. Safety
- Is PII handled correctly (no logging, no training)?
- Is prompt-injection defended?
- Are user messages quoted distinctly from system messages?
- Are dangerous capabilities (exec, network, fs) gated?

## Verdict

- Total >= 16: ship.
- Total 12-15: ship with a follow-up issue.
- Total < 12: stop and address the gaps.
