SET NAMES utf8mb4;

SELECT
  'REFERENCE_TEMPLATES' AS section,
  id,
  template_code,
  template_no,
  template_name,
  group_id,
  stage_code,
  render_scope,
  output_strategy,
  default_output_formats,
  is_active
FROM templates
WHERE template_code IN ('BM-146', 'BM-057', 'BM-148')
ORDER BY template_code;

SET @group_id_ref = (
  SELECT group_id
  FROM templates
  WHERE template_code = 'BM-146'
  LIMIT 1
);

SET @stage_code_ref = (
  SELECT stage_code
  FROM templates
  WHERE template_code = 'BM-146'
  LIMIT 1
);

SET @output_strategy_ref = (
  SELECT output_strategy
  FROM templates
  WHERE template_code = 'BM-146'
  LIMIT 1
);

SET @default_output_formats_ref = (
  SELECT default_output_formats
  FROM templates
  WHERE template_code = 'BM-146'
  LIMIT 1
);

SET @render_scope_person_ref = (
  SELECT render_scope
  FROM templates
  WHERE template_code = 'BM-057'
  LIMIT 1
);

SELECT
  'REFERENCE_VALUES' AS section,
  @group_id_ref AS group_id_ref_from_BM146,
  @stage_code_ref AS stage_code_ref_from_BM146,
  @output_strategy_ref AS output_strategy_ref_from_BM146,
  @default_output_formats_ref AS default_output_formats_ref_from_BM146,
  @render_scope_person_ref AS render_scope_person_ref_from_BM057;

INSERT INTO templates (
  template_code,
  template_no,
  template_name,
  group_id,
  source_file_name,
  original_ext,
  stage_code,
  render_scope,
  output_strategy,
  default_output_formats,
  requires_review,
  description,
  is_active,
  created_at,
  updated_at
)
SELECT
  'BM-148',
  '148/HS',
  'Quyết định tạm đình chỉ vụ án hình sự đối với bị can',
  @group_id_ref,
  '148-QĐ tạm đình chỉ vụ án đối với bị can.doc',
  'doc',
  @stage_code_ref,
  @render_scope_person_ref,
  @output_strategy_ref,
  @default_output_formats_ref,
  1,
  'Mẫu số 148/HS - Quyết định tạm đình chỉ vụ án hình sự đối với bị can. Normalized DOCX đã tạo, chưa map placeholder.',
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM templates
  WHERE template_code = 'BM-148'
)
AND @stage_code_ref IS NOT NULL
AND @render_scope_person_ref IS NOT NULL
AND @output_strategy_ref IS NOT NULL;

SET @template_id_bm148 = (
  SELECT id
  FROM templates
  WHERE template_code = 'BM-148'
  LIMIT 1
);

SELECT
  'BM148_TEMPLATE_ID' AS section,
  @template_id_bm148 AS template_id_bm148;

INSERT INTO template_versions (
  template_id,
  version_no,
  original_file_path,
  normalized_docx_path,
  output_name_pattern,
  placeholder_summary,
  checksum,
  is_default,
  is_active,
  created_by_name,
  created_at,
  updated_at
)
SELECT
  @template_id_bm148,
  1,
  'C:\\LUẬT\\QUANLYVKS\\storage\\imports\\template-zips\\extracted\\Biểu mẫu\\148-QĐ tạm đình chỉ vụ án đối với bị can.doc',
  'C:\\LUẬT\\QUANLYVKS\\storage\\templates\\normalized-docx\\BM-148\\BM-148_normalized.docx',
  'BM-148_Quyet-dinh-tam-dinh-chi-vu-an-hinh-su-doi-voi-bi-can_{{caseCode}}_{{personSlug}}_v{{version}}',
  JSON_OBJECT(
    'status', 'NORMALIZED_ONLY',
    'placeholderCount', 0,
    'mappedAt', NULL,
    'notes', JSON_ARRAY(
      'Converted from source DOC to normalized DOCX.',
      'XML parser audit passed: no real XML leak in text nodes.',
      'Placeholders have not been mapped yet.'
    )
  ),
  'D4839DD93E9B42775303B64AC8A68ABCA8D3D9925B80F70F30E6EEACD4EFAE85',
  1,
  1,
  'ChatGPT',
  NOW(),
  NOW()
WHERE @template_id_bm148 IS NOT NULL
AND NOT EXISTS (
  SELECT 1
  FROM template_versions
  WHERE template_id = @template_id_bm148
    AND version_no = 1
);

SELECT
  'FINAL_TEMPLATE' AS section,
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
WHERE template_code = 'BM-148';

SELECT
  'FINAL_TEMPLATE_VERSION' AS section,
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
WHERE t.template_code = 'BM-148'
ORDER BY tv.id DESC;
