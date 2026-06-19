# Phase D.2 Renderer Seam Design

## Goal

Create a stable application boundary in front of the legacy DOCX renderer so
contract-driven rendering can be introduced one reviewed template at a time.
Phase D.2.1 must not change production output: the default mode remains
`off`, and every request continues through `DocumentRendererService`.

## Current constraint

`DocumentRendererService` currently owns payload assembly, template rendering,
pre-export customization, file storage, database updates, audit events, and
render locking. Rewriting those responsibilities in one change would create a
high-risk cutover. The first step is therefore an orchestration seam, not a
renderer rewrite.

## Boundary

`DocumentRendererController` delegates `render-docx` to
`RenderGeneratedDocumentUseCase`. Other payload and form-input endpoints remain
on the legacy service until their own application boundaries are designed.

The use case depends on ports:

- `LegacyDocumentRendererPort`: adapter over the current renderer.
- `ContractDocumentRendererPort`: future contract renderer entry point.
- `GeneratedDocumentDescriptorPort`: resolves the template code for routing.
- `DocumentRendererRoutingPolicy`: selects legacy, shadow, or active behavior.

## Routing modes

- `off` (default): call legacy directly and do not query contract routing data.
- `shadow`: for an allow-listed template, return the legacy result and execute
  the contract candidate only for comparison. Candidate failures are logged and
  cannot break the user request.
- `active`: for an allow-listed template, call the contract renderer. Errors
  propagate; there is no silent fallback to legacy.
- Templates outside the allow-list always use legacy.

Configuration:

- `DOCUMENT_RENDERER_MODE=off|shadow|active`
- `DOCUMENT_RENDERER_CONTRACT_TEMPLATES=BM-001,BM-002`

The allow-list defaults to empty. D.2.1 ships an explicit unavailable contract
adapter, so accidentally enabling an allow-listed template in `active` mode
fails clearly instead of producing a misleading legacy result.

## Safety invariants

1. Default configuration preserves the exact legacy call and response.
2. Unsupported templates never enter the contract renderer.
3. Active contract failures never silently fall back.
4. Shadow execution never changes the response returned to the caller.
5. The new layer does not write files or database rows itself in D.2.1.
6. No Prisma schema or dependency changes are required.

## Next increment

D.2.2 replaces the unavailable contract adapter for BM-001 with a real
contract-aware implementation, introduces semantic comparison evidence in
shadow mode, and reuses one persistence path before active cutover.
