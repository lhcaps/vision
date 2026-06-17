# BM-070 PLACEHOLDER CONTRACT

## 1. Thông tin biểu mẫu

- Template code: BM-070
- Tên chuẩn: Quyết định phân công Phó Viện trưởng thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Template id hiện tại: 13
- Template version id hiện tại: 13
- Normalized DOCX: C:\LUẬT\QUANLYVKS\storage\templates\normalized-docx\BM-070\BM-070_normalized.docx

## 2. Trạng thái hiện tại

- DB row đã có.
- template_versions đã có.
- normalized DOCX đã có.
- Checksum hiện tại khớp DB.
- DOCX hiện chưa có placeholder.
- Status hiện tại: NORMALIZED_READY.
- Chưa render DOCX/PDF.
- Chưa có FE form riêng.

## 3. Mục tiêu nghiệp vụ

BM-070 dùng để ra quyết định phân công Phó Viện trưởng thực hành quyền công tố, kiểm sát việc giải quyết vụ án hình sự.
Mẫu này là CASE_LEVEL vì nội dung gắn với vụ án, không phải một bị can cụ thể.

## 4. Placeholder cần kiểm trong render-payload

- agency.name
- agency.shortName
- agency.issuePlace
- document.documentCode
- document.issuePlaceAndDateLine
- official.issuerTitle
- legalBasis.assignmentProcedureArticlesLine
- caseDecision.caseProsecutionDecisionLine
- assignment.deputyChiefName
- assignment.deputyChiefTitle
- assignment.deputyChiefAgencyName
- assignment.responsibilityLine
- recipients.investigationAuthorityLine
- recipients.assignedPersonLine
- recipients.archiveLine
- signature.signMode
- signature.positionTitle
- signature.signerName

## 5. Mapping đề xuất vào DOCX

Header:
- {{agency.name}}
- Số: {{document.documentCode}}
- {{document.issuePlaceAndDateLine}}

Chủ thể ban hành:
- {{official.issuerTitle}}

Căn cứ pháp lý:
- {{legalBasis.assignmentProcedureArticlesLine}}

Căn cứ quyết định khởi tố vụ án:
- {{caseDecision.caseProsecutionDecisionLine}}

Điều 1:
- Điều 1. Phân công ông/bà {{assignment.deputyChiefName}}, {{assignment.deputyChiefTitle}} {{assignment.deputyChiefAgencyName}} thực hành quyền công tố, kiểm sát việc giải quyết vụ án theo {{caseDecision.caseProsecutionDecisionLine}}.

Điều 2:
- Điều 2. Ông/Bà {{assignment.deputyChiefName}} {{assignment.responsibilityLine}}./.

Nơi nhận:
- {{recipients.investigationAuthorityLine}}
- {{recipients.assignedPersonLine}}
- {{recipients.archiveLine}}

Chữ ký:
- {{signature.signMode}}
- {{signature.positionTitle}}
- {{signature.signerName}}

## 6. Việc cần làm tiếp theo

1. Tạo generated_document test cho BM-070 với case_id = 2 và target_person_id = NULL.
2. Gọi render-payload.
3. Kiểm payload có đủ các field trong contract không.
4. Nếu thiếu field nghiệp vụ, patch document-renderer.service.ts.
5. Chỉ chèn placeholder vào DOCX sau khi payload đã rõ.
6. Sau khi map xong, update checksum và status PLACEHOLDERS_MAPPED.
7. Render DOCX/PDF.
8. Nếu format ổn, update status FORMAT_FIXED.
9. Tạo FE form riêng bm-070-form-inputs.tsx.
10. Wire vào generated-document-workspace.tsx.
11. Update mapping ở template-selector-workspace.tsx.
12. Update rule matrix ở template-recommendation-rules.ts.
13. Test /documents và /templates review queue.

