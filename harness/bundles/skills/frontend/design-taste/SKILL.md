# Design Taste

> Apply visual hierarchy, type scale, and spacing discipline.
> No new components, no new colors — only system values used
> correctly.

## When to load

- After `ui-architect`, when the design exists but feels off.
- "Polish this UI."
- Code review for any visible change.

## Procedure

1. **Establish a type scale.** 1-2 sizes per role. No ad-hoc
   font sizes. A scale like 12, 14, 16, 20, 24, 32, 40
   covers 90% of needs.
2. **Establish a spacing scale.** 4, 8, 12, 16, 24, 32, 48,
   64. The same scale for padding, margin, and gap. No magic
   `13px`.
3. **Establish a color system.** Background, surface, text,
   text-muted, border, primary, danger, success. Derived from
   a single base. 8-10 colors total, used everywhere.
4. **Establish a radius scale.** 0, 4, 8, 12, 999. Pick the
   one that matches the brand's geometry.
5. **Establish a shadow scale.** 0, 1, 2, 3 elevation levels.
   Shadows are expensive; use them sparingly.
6. **Audit the design.** Walk through every screen. Find the
   elements that broke the scale. Fix them.
7. **Add the discipline to the lint.** If your tooling
   supports custom rules for magic numbers, add them.

## What to look for

- **Type soup**: more than 4 font sizes in one screen.
- **Padding lottery**: 7, 11, 13, 17 — anything that's not on
  the scale.
- **Color drift**: a brand red that's `#E53935` in one place
  and `#E63E3A` in another.
- **Inconsistent radius**: 6 here, 10 there, 4 over here.
- **Two primaries**: two buttons both styled as the primary
  action.

## Output

```
## Design Audit: <feature/page>

### Tokens used
- type: <sizes actually used>
- spacing: <values actually used>
- color: <roles actually used>
- radius: <values actually used>
- shadow: <elevations actually used>

### Off-scale
- file:line - <offending value> -> <token>

### Verdict
- ship / fix-first / major-rework
```
