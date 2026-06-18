"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CasePayload } from "./case-payload-normalizer";

export type {
  CasePayload,
  CasePayloadAgency,
  CasePayloadAssignment,
  CasePayloadAssignmentOfficial,
  CasePayloadCase,
  CasePayloadOffense,
  CasePayloadPerson,
} from "./case-payload-normalizer";

/**
 * Phase 1 — Case payload context (foundation for BM auto-populate).
 *
 * Exposes the render-payload data (case + people + offenses + assignments)
 * via React context so any BM form panel can read it via `useCasePayload()`
 * without prop drilling. Provider is mounted by `GeneratedDocumentWorkspace`.
 *
 * Data shape mirrors `GET /documents/generated/:documentId/render-payload`.
 * Optional everywhere because payload is still loading or generic.
 */

const CasePayloadContext = createContext<CasePayload | null>(null);

export function CasePayloadProvider({
  value,
  children,
}: {
  value: CasePayload;
  children: ReactNode;
}) {
  return (
    <CasePayloadContext.Provider value={value}>
      {children}
    </CasePayloadContext.Provider>
  );
}

/**
 * Returns the current case payload, or null if rendered outside a
 * CasePayloadProvider (e.g. tests, standalone preview). Phase 2-3 will
 * gate the "Lấy từ vụ án" button on a non-null result.
 */
export function useCasePayload(): CasePayload | null {
  return useContext(CasePayloadContext);
}
