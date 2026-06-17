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
  created_by_name
)
VALUES
(
  (SELECT id FROM templates WHERE template_code = 'BM-001'),
  1,
  'storage/templates/original/BM-001/BM-001_Bien-ban-tiep-nhan-nguon-tin-ve-toi-pham.doc',
  'storage/templates/normalized-docx/BM-001/BM-001_Bien-ban-tiep-nhan-nguon-tin-ve-toi-pham.docx',
  'BM-001_{{case.caseCode}}',
  JSON_OBJECT('status', 'PENDING_DOCX_NORMALIZATION', 'note', 'Đã có file .doc gốc, chờ chuyển sang .docx'),
  NULL,
  TRUE,
  TRUE,
  'SYSTEM'
),
(
  (SELECT id FROM templates WHERE template_code = 'BM-053'),
  1,
  'storage/templates/original/BM-053/BM-053_Lenh-cam-di-khoi-noi-cu-tru.doc',
  'storage/templates/normalized-docx/BM-053/BM-053_Lenh-cam-di-khoi-noi-cu-tru.docx',
  'BM-053_{{person.fullName}}_{{case.caseCode}}',
  JSON_OBJECT('status', 'PENDING_DOCX_NORMALIZATION', 'note', 'Đã có file .doc gốc, chờ chuyển sang .docx'),
  NULL,
  TRUE,
  TRUE,
  'SYSTEM'
),
(
  (SELECT id FROM templates WHERE template_code = 'BM-090'),
  1,
  'storage/templates/original/BM-090/BM-090_QD-phe-chuan-QD-khoi-to-bi-can.doc',
  'storage/templates/normalized-docx/BM-090/BM-090_QD-phe-chuan-QD-khoi-to-bi-can.docx',
  'BM-090_{{person.fullName}}_{{case.caseCode}}',
  JSON_OBJECT('status', 'PENDING_DOCX_NORMALIZATION', 'note', 'Đã có file .doc gốc, chờ chuyển sang .docx'),
  NULL,
  TRUE,
  TRUE,
  'SYSTEM'
),
(
  (SELECT id FROM templates WHERE template_code = 'BM-097'),
  1,
  'storage/templates/original/BM-097/BM-097_QD-khoi-to-bi-can.doc',
  'storage/templates/normalized-docx/BM-097/BM-097_QD-khoi-to-bi-can.docx',
  'BM-097_{{person.fullName}}_{{case.caseCode}}',
  JSON_OBJECT('status', 'PENDING_DOCX_NORMALIZATION', 'note', 'Đã có file .doc gốc, chờ chuyển sang .docx'),
  NULL,
  TRUE,
  TRUE,
  'SYSTEM'
),
(
  (SELECT id FROM templates WHERE template_code = 'BM-156'),
  1,
  'storage/templates/original/BM-156/BM-156_Cao-trang.doc',
  'storage/templates/normalized-docx/BM-156/BM-156_Cao-trang.docx',
  'BM-156_{{case.caseCode}}',
  JSON_OBJECT('status', 'PENDING_DOCX_NORMALIZATION', 'note', 'Đã có file .doc gốc, chờ chuyển sang .docx'),
  NULL,
  TRUE,
  TRUE,
  'SYSTEM'
)
ON DUPLICATE KEY UPDATE
  original_file_path = VALUES(original_file_path),
  normalized_docx_path = VALUES(normalized_docx_path),
  output_name_pattern = VALUES(output_name_pattern),
  placeholder_summary = VALUES(placeholder_summary),
  is_default = VALUES(is_default),
  is_active = VALUES(is_active),
  updated_at = CURRENT_TIMESTAMP;