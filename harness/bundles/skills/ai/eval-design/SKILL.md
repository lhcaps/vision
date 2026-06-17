# Eval Design

> Build a reference set and rubrics for an AI feature.
> Use this when an AI call site exists but its quality is
> unknown.

## When to load

- "How do we know if the AI is working?"
- "We're shipping an AI feature; we need tests."
- "The model changed, did anything break?"

## Procedure

1. **Define the eval dimensions.** Pull from the AI
   integration skill's pillars (input contract, output
   contract, failure modes, cost & latency, safety). For
   each, what does "good" mean for **this** feature?
2. **Sample inputs.** Aim for 20-50 cases. Mix:
   - **Common** (5+): the bread and butter. Must pass
     always.
   - **Edge** (5+): empty, max, malformed, mixed-script.
   - **Adversarial** (5+): prompt injection, refusal
     attempts, off-topic, leading questions.
   - **Should-refuse** (3+): things the model must NOT
     attempt.
3. **For each case, define a rubric.** A rubric is a list
   of pass/fail conditions, not a single "expected
   output". For example:
   - "Output is valid JSON."
   - "Output does NOT contain a user email."
   - "Output names at least one risk."
   - "Output is < 200 words."
4. **Build the runner.** A script that takes a model + a
   case, runs the call, applies the rubric, returns a
   pass/fail + reasoning. Deterministic. Re-runnable.
5. **Wire to CI.** Every PR runs the eval. Pass rate must
   not drop below a threshold. New cases must not be
   deleted casually.
6. **Track over time.** Plot pass rate per dimension. A
   dimension that's stuck at 100% is a candidate for
   retirement. A dimension that's stuck below 90% is a
   real product problem, not an eval problem.

## Rubric forms

- **Boolean**: pass / fail.
- **Counted**: "Contains at least 1 of {a, b, c}."
- **Scored**: 0-3 against a 3-level rubric
  (correct / partial / wrong).
- **Categorical**: maps output to one of {refuse, answer,
  defer, error}.

Prefer boolean and counted for unit-level tests. Use scored
for higher-level quality (coherence, helpfulness). Use
categorical when the right answer is a class, not a string.

## Reference set management

- **Versioned** in git. Each eval case has a name, an
  inputs, a rubric, and a date it was added.
- **Diverse** by author. One author's cases will share
  blind spots.
- **Living**. New failures get a new case before they
  get a fix.

## Output

```
## Eval: <feature>

### Dimensions
- <list with one-line definition>

### Cases
- common: N
- edge: N
- adversarial: N
- should-refuse: N

### Rubric form
- <boolean|counted|scored|categorical|...>

### Runner
- path: <where>
- model: <default>
- timeout: <seconds>

### CI
- threshold: <pass-rate>
- job: <path or workflow>

### Tracking
- dashboard: <path or "none">
```
