# Motion Design

> Add motion that respects duration, easing, and reduced-motion.
> No decorative animation.

## When to load

- "Animate this transition."
- "Make this feel smoother."
- "Add a micro-interaction."

## Procedure

1. **Why is this moving?** Name the user-perceivable reason.
   Examples: drawing attention to a new element, confirming
   an action, showing spatial relationship, indicating
   progress. If you can't name one, the motion is decorative
   — remove it.
2. **Pick the duration.** Default to 200ms for state changes,
   350ms for transitions, 500ms+ only for storytelling. The
   shorter the better, until it's no longer perceptible.
3. **Pick the easing.** One curve for everything (e.g.
   `cubic-bezier(0.4, 0, 0.2, 1)`). A second curve only for
   exits, slightly faster at the end. Never `linear` for UI
   motion.
4. **Define the property transitions.** Translate, opacity,
   scale, color. Avoid layout-affecting properties (`width`,
   `height`, `top`/`left`).
5. **Honor `prefers-reduced-motion`.** Replace with
   instantaneous state changes, or short opacity fades only.
6. **No motion on first paint.** First paint is the user's
   first impression. Don't add an entrance animation that
   delays the LCP.

## Patterns

- **Stagger**: when a list reveals, stagger by 30-50ms per
  item, capped at 5 items.
- **Cross-fade**: opacity transition only. No scale on text.
- **Slide-in**: translate from a small distance, not from off
  screen.
- **Press feedback**: scale to 0.98 on press, back to 1 on
  release. Never more.
- **Skeleton**: pulsing opacity, not a shimmer gradient. Skeletons
  should look like the content's shape.

## Anti-patterns

- Bouncy springs on a checkout button.
- Long transitions (1s+) on a list of 100 items.
- Motion that loops forever (it stops being motion, it
  becomes background noise).
- Different easings for the same class of transition in
  different places.

## Output

```
## Motion: <where>

### Why this moves
- <user-perceivable reason>

### Properties
- <prop>: <from> -> <to>, <duration>, <easing>

### Reduced motion
- <fallback>

### Verification
- [ ] no first-paint delay
- [ ] no layout thrash
- [ ] reduced-motion tested
```
