# Phase D.2.1 Renderer Seam Implementation Plan

## 1. Lock configuration behavior

- Add tests for default `off`, valid modes, invalid mode rejection, and
  normalized template allow-list parsing.
- Add typed renderer configuration to `AppConfigService`.
- Document safe defaults in `.env.example`.

## 2. Define application ports and policy

- Define render request/result contracts and dependency tokens.
- Add a descriptor port for template-code lookup.
- Add routing-policy tests for `off`, unsupported, `shadow`, and `active`.
- Guarantee active failures propagate without legacy fallback.

## 3. Add infrastructure adapters

- Wrap `DocumentRendererService` behind the legacy port.
- Resolve generated-document template codes through Prisma.
- Add an explicit unavailable contract adapter for the pre-pilot state.

## 4. Wire the controller and module

- Route only `POST .../render-docx` through the use case.
- Keep existing payload, pre-export, and form-input endpoints unchanged.
- Register all ports in `DocumentsModule` without introducing circular DI.

## 5. Verify

- Run focused renderer/config tests.
- Run API lint, API tests, root tests, production build, and hardcode/template/
  encoding audits.
- Confirm the default `off` mode delegates once to the legacy renderer and
  returns its result unchanged.

## Exit criteria

- Default runtime behavior is unchanged.
- The architecture supports a BM-001 shadow implementation without editing the
  controller again.
- No hidden fallback exists for active contract rendering.
- All repository verification gates pass.
