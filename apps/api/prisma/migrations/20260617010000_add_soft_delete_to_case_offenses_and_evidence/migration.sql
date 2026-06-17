-- Add is_deleted soft-delete flag to case_offenses and evidence_items.
-- This aligns with the soft-delete pattern already used by cases/people (is_deleted)
-- and case_people/case_assignments (is_active).
--
-- Phase 2 — Case Detail CRUD foundation.
-- Going forward:
--   DELETE /cases/:caseId/people/:id    -> is_active = false
--   DELETE /cases/:caseId/offenses/:id  -> is_deleted = true
--   DELETE /cases/:caseId/assignments/:id -> is_active = false
--   DELETE /cases/:caseId/evidence/:id  -> is_deleted = true
-- All GET list endpoints filter out the soft-deleted rows.

ALTER TABLE case_offenses
  ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD INDEX idx_case_offenses_deleted (is_deleted);

ALTER TABLE evidence_items
  ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD INDEX idx_evidence_deleted (is_deleted);
