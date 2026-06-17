# UI 6-Pillar Audit

For any UI deliverable (component, page, flow, motion, image-to-code).
Score each pillar 0-3.

## 1. Hierarchy
- Is the visual order of importance clear in <2 seconds?
- Are primary actions visually primary (size, contrast, position)?
- Are secondary actions clearly demoted?

## 2. Type & Spacing
- Is there a single type scale (no ad-hoc font-sizes)?
- Is spacing on a grid (no magic px values)?
- Are line lengths, leading, and tracking intentional?

## 3. State Coverage
- Empty state, loading state, error state, success state, disabled
  state.
- For forms: invalid, dirty, submitting, server-error.
- For lists: empty, 1 item, many items, very many items (paginated?).

## 4. Affordance & Feedback
- Every interactive element looks interactive.
- Every action has a visible response within 100ms.
- Every long action has a progress indicator.
- Destructive actions confirm.

## 5. Motion
- Motion is purposeful, never decorative.
- Durations are within 150-350ms for state changes.
- Easing is consistent (one curve, with one counter-curve for exits).
- Honors `prefers-reduced-motion`.

## 6. Accessibility
- Color contrast meets WCAG AA.
- All interactive elements reachable by keyboard.
- Focus indicators visible.
- All images have meaningful alt text.
- Form fields have labels.

## Verdict

- Total >= 16: ship.
- Total 12-15: ship with a follow-up issue.
- Total < 12: stop and address the gaps.
