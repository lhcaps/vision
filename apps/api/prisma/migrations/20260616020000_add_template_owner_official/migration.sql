-- Track which authenticated account uploaded or seeded each template.

ALTER TABLE templates
  ADD COLUMN created_by_official_id BIGINT UNSIGNED NULL AFTER is_active;

ALTER TABLE template_versions
  ADD COLUMN created_by_official_id BIGINT UNSIGNED NULL AFTER created_by_name;

UPDATE templates t
JOIN officials o ON o.username = 'admin'
SET t.created_by_official_id = o.id
WHERE t.created_by_official_id IS NULL;

UPDATE template_versions tv
JOIN templates t ON t.id = tv.template_id
SET tv.created_by_official_id = t.created_by_official_id
WHERE tv.created_by_official_id IS NULL
  AND t.created_by_official_id IS NOT NULL;

CREATE INDEX idx_templates_created_by_official
  ON templates(created_by_official_id);

CREATE INDEX idx_template_versions_created_by_official
  ON template_versions(created_by_official_id);

ALTER TABLE templates
  ADD CONSTRAINT fk_templates_created_by_official
  FOREIGN KEY (created_by_official_id) REFERENCES officials(id)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

ALTER TABLE template_versions
  ADD CONSTRAINT fk_template_versions_created_by_official
  FOREIGN KEY (created_by_official_id) REFERENCES officials(id)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;
