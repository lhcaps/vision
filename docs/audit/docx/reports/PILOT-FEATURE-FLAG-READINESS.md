# Pilot Feature Flag Readiness

> Phase B.5 — DOCX-first audit pipeline
> Generated: 2026-06-19

## Overview

This report audits where feature flags could be introduced for the BM-001..BM-004 contract-driven forms pilot. No UI rewrite in Phase B.5.

## Architecture

### Route / page that creates BM forms

The primary entry point is `apps/web/src/app/documents/[documentId]/page.tsx` which renders `<GeneratedDocumentWorkspace>` from `generated-document-workspace.tsx`.

The workspace is driven by `templateCode` from the document payload returned by the API (`GET /documents/generated/{id}/render-payload`). The component dispatches to the correct panel via a `BM_PANEL_BY_CODE` dictionary lookup:

```ts
// apps/web/src/components/documents/generated-document-workspace.tsx
const BM_PANEL_BY_CODE = {
  "BM-001": Bm001FormInputsPanel,
  "BM-002": Bm002FormInputsPanel,
  "BM-003": Bm003FormInputsPanel,
  "BM-004": Bm004FormInputsPanel,
  // ... BM-005 through BM-213 ...
};
```

### Components rendering BM-001..BM-004

| Component | File |
|---|---|
| `Bm001FormInputsPanel` | `apps/web/src/components/documents/bm-001-form-inputs.tsx` |
| `Bm002FormInputsPanel` | `apps/web/src/components/documents/bm-002-form-inputs.tsx` |
| `Bm003FormInputsPanel` | `apps/web/src/components/documents/bm-003-form-inputs.tsx` |
| `Bm004FormInputsPanel` | `apps/web/src/components/documents/bm-004-form-inputs.tsx` |

All BM panels use shared primitives from `apps/web/src/components/documents/bm-form/`:
- `bm-field.tsx` — `BmFieldText`, `BmFieldTextarea`, `BmFieldDate`, `BmFieldSelect`, `BmFieldCheckbox`
- `bm-form-section.tsx` — section wrapper
- `bm-form-meta-bar.tsx` — status bar
- `classes.ts` — CSS constants + date helpers

### Existing `NEXT_PUBLIC_` env vars

| Variable | Usage |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | API base URL (all components) |

No existing feature flag patterns found.

## Where to Add a Pilot Flag

### Option A: Route-level guard (minimal UI impact)

In `generated-document-workspace.tsx`, wrap the panel dispatch:

```ts
const USE_CONTRACT_DRIVEN = process.env.NEXT_PUBLIC_CONTRACT_DRIVEN_FORMS_PILOT === "1";

export default function GeneratedDocumentWorkspace({ documentId }) {
  const panel = BM_PANEL_BY_CODE[templateCode];

  if (USE_CONTRACT_DRIVEN && pilotCodes.has(templateCode)) {
    return <ContractDrivenFormPanel documentId={documentId} templateCode={templateCode} />;
  }

  // Existing fallback
  return panel ? (
    <panel documentId={documentId} />
  ) : (
    <GenericTemplateFormInputsPanel documentId={documentId} />
  );
}
```

**Pros**: Single insertion point, zero UI change.
**Cons**: Needs new `ContractDrivenFormPanel` component in Phase D.

### Option B: API-level gating (backend)

Add a query parameter or header in `apps/web/src/lib/api-client.ts`:

```ts
// Check before fetching contract-driven data
const useContract = process.env.NEXT_PUBLIC_CONTRACT_DRIVEN_FORMS_PILOT === "1";
if (useContract && PILOT_CODES.has(templateCode)) {
  const r = await api.get(`/documents/generated/${id}/contract-render`);
  // ...
}
```

### Option C: Feature flag service (Phase D)

Install `unleash-client` or similar. Define flag `contractDrivenFormsPilot`. Gate in `generated-document-workspace.tsx`. Default `OFF`.

## Recommendation

**Option A** is the safest for Phase B.5. It requires:
1. Add `NEXT_PUBLIC_CONTRACT_DRIVEN_FORMS_PILOT` env var (default: `"0"`)
2. Add `pilotCodes` set = `new Set(["BM-001", "BM-002", "BM-003", "BM-004"])`
3. No existing UI changes
4. No changes to `Bm001..Bm004FormInputsPanel` components

The actual `ContractDrivenFormPanel` component can be built in Phase D.

## Phase D Checklist

- [ ] Add `NEXT_PUBLIC_CONTRACT_DRIVEN_FORMS_PILOT` env var to `.env.example`
- [ ] Add to `apps/web/src/lib/api-client.ts` or `generated-document-workspace.tsx`
- [ ] Define pilot codes list
- [ ] Build `ContractDrivenFormPanel` that reads from contract JSON
- [ ] Wire contract `docxSlots` → form fields
- [ ] Wire canonical fields → API POST payload
- [ ] Add preview panel using `renderFormatHints`
- [ ] Ensure `NEXT_PUBLIC_CONTRACT_DRIVEN_FORMS_PILOT=0` by default
- [ ] Do NOT enable pilot for all users until Phase D complete
