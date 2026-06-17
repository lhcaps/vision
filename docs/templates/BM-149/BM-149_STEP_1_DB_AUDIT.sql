SET NAMES utf8mb4;

SELECT
  'TEMPLATES_BY_CODE' AS section,
  id,
  template_code,
  template_no,
  template_name,
  group_id,
  stage_code,
  render_scope,
  output_strategy,
  default_output_formats,
  requires_review,
  is_active,
  created_at,
  updated_at
FROM templates
WHERE template_code = 'BM-149'
   OR template_no LIKE '%149%'
   OR template_name LIKE '%tạm đình chỉ%'
ORDER BY id DESC;

SELECT
  'TEMPLATE_VERSIONS_BY_CODE' AS section,
  tv.id,
  tv.template_id,
  t.template_code,
  tv.version_no,
  tv.original_file_path,
  tv.normalized_docx_path,
  tv.output_name_pattern,
  tv.placeholder_summary,
  tv.checksum,
  tv.is_default,
  tv.is_active,
  tv.created_by_name,
  tv.created_at,
  tv.updated_at
FROM template_versions tv
JOIN templates t ON t.id = tv.template_id
WHERE t.template_code = 'BM-149'
ORDER BY tv.id DESC;

SELECT
  'REFERENCE_BM148' AS section,
  t.id,
  t.template_code,
  t.template_no,
  t.template_name,
  t.group_id,
  t.stage_code,
  t.render_scope,
  t.output_strategy,
  t.default_output_formats,
  t.is_active
FROM templates t
WHERE t.template_code = 'BM-148';

SELECT
  'REFERENCE_BM146' AS section,
  t.id,
  t.template_code,
  t.template_no,
  t.template_name,
  t.group_id,
  t.stage_code,
  t.render_scope,
  t.output_strategy,
  t.default_output_formats,
  t.is_active
FROM templates t
WHERE t.template_code = 'BM-146';
