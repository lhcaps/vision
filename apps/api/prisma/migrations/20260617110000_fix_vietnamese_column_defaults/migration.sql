-- Fix Vietnamese defaults that were stored as mojibake in the local MariaDB schema.
-- Existing row values are left untouched; this only corrects future default values.

ALTER TABLE legal_articles
  MODIFY COLUMN law_name VARCHAR(255) NOT NULL DEFAULT 'Bộ luật Hình sự';

ALTER TABLE people
  MODIFY COLUMN nationality VARCHAR(100) NULL DEFAULT 'Việt Nam';

ALTER TABLE wards
  MODIFY COLUMN province_name VARCHAR(255) NULL DEFAULT 'Thành phố Hồ Chí Minh';
