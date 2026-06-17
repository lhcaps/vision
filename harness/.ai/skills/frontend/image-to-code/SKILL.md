# Image to Code

> Convert a reference image into idiomatic UI for the current stack.

## When to load

- "Build this from this screenshot."
- "Make our app look like this."
- "Match the design from this image."

## Procedure

1. **Read the image carefully.** What is the primary content?
   What is the call to action? What is the navigation? What
   is decorative?
2. **Extract the design tokens, not the pixels.**
   - Type scale and roles.
   - Spacing scale.
   - Color palette (sample the image, don't guess).
   - Radii.
   - Shadows.
   - Motion (if any is implied by the still — usually none).
3. **Map to the project's existing tokens.** If the project
   already has a type scale, use it. Don't introduce a new
   one. If the project has no tokens, `design-taste` first.
4. **Build the structure with `ui-architect`.** Component
   tree, state model, data flow. The image is the *target*,
   not the architecture.
5. **Implement, top-down.** Outer layout first. Content
   second. States third. Polish last.
6. **Compare side-by-side.** 80% match is fine. The remaining
   20% is usually a copy-paste of bad decisions from the
   reference (a too-clever animation, an arbitrary color).
7. **Document deviations.** "We use 16px padding instead of
   14px because 14 isn't on our scale." One line per
   deviation.

## Anti-patterns

- **Pixel-pushing.** Measuring distances in the image and
  hardcoding them. The image is wrong about 20% of the time.
- **Cargo-culting copy.** If the reference says "Get started
  today" in a giant CTA, that may be the reference's
  mistake, not your feature.
- **Skipping architecture.** The image is the surface, not
  the structure. The structure must serve the user's
  goal, not the image's layout.
- **Importing the reference's tokens verbatim.** Their
  scale is not your scale. Adapt, don't copy.

## Output

```
## Image to Code: <source image path>

### Tokens extracted
- type: <list>
- spacing: <list>
- color: <list>
- radius: <list>

### Tokens mapped to project
- <extracted> -> <project token>

### Components built
- <list with paths>

### Deviations
- <list with reason>

### Comparison
- 80%+ match. Notable diffs: <list>
```
