ALTER TABLE people
  MODIFY nationality VARCHAR(100) NULL DEFAULT 'Việt Nam';

UPDATE people
SET nationality = 'Việt Nam'
WHERE nationality IS NULL
   OR nationality LIKE 'Vi%';