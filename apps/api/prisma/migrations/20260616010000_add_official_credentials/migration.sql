-- Migration: add username/password credentials for officials.
-- Existing rows are kept active but cannot password-login until password_hash is set.

ALTER TABLE officials
  ADD COLUMN username VARCHAR(100) NULL AFTER full_name,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER username;

UPDATE officials
SET username = LOWER(
  TRIM(
    REPLACE(
      REPLACE(
        REPLACE(full_name, '  ', ' '),
        ' ',
        '.'
      ),
      '..',
      '.'
    )
  )
)
WHERE username IS NULL OR username = '';

CREATE UNIQUE INDEX uq_officials_username ON officials(username);
