-- Migration: Add role column to officials table
-- Replaces heuristic ADMIN detection with explicit DB role
-- Rollback: drop column role from officials

-- Step 1: Add role column with default 'OFFICIAL' for existing rows
ALTER TABLE officials
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL'
  COMMENT 'Explicit role: ADMIN | OFFICIAL. ADMIN can access admin pages.'

  AFTER is_active;

-- Step 2: Update existing officials who match the old ADMIN heuristic
-- to have explicit ADMIN role (so they don't lose admin access)
UPDATE officials
SET role = 'ADMIN'
WHERE (
    LOWER(position_title) LIKE 'trưởng%'
    OR LOWER(position_title) LIKE 'viện trưởng%'
)
AND is_active = true;

-- Step 3 (optional seed note): any future admin should be inserted/updated
-- with role = 'ADMIN' explicitly.
