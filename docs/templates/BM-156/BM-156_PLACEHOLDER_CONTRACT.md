# BM-156 PLACEHOLDER CONTRACT

Biểu mẫu: BM-156 — Cáo trạng  
Render scope: CASE_LEVEL  
Output strategy: ONE_FILE_PER_CASE  

Template path:

C:\LUẬT\QUANLYVKS\storage\templates\normalized-docx\BM-156\BM-156_Cao-trang.docx

Generated document test:

- documentId: 3
- caseId: 2
- templateId: 5
- targetScope: CASE_LEVEL
- targetPersonId: NULL

---

## 1. Nguyên tắc

BM-156 là biểu mẫu CASE_LEVEL, không render theo từng bị can riêng lẻ.

Không dùng nhầm form BM-053, BM-097, BM-001.

Không sửa mất bố cục gốc DOCX.

BM-156 là Cáo trạng, nội dung dài nên phase đầu dùng các placeholder dạng paragraph/block để bảo toàn layout và giảm rủi ro vỡ mẫu.

Sau khi render ổn, có thể tách nhỏ thêm ở phase frontend form BM-156.

---

## 2. Nhóm placeholder chính

### agency

| Placeholder | Ý nghĩa |
|---|---|
| {{agency.parentName}} | Cơ quan cấp trên |
| {{agency.name}} | Tên Viện kiểm sát ban hành cáo trạng |
| {{agency.shortName}} | Tên viết tắt dùng trong số văn bản nếu có |
| {{agency.issuePlace}} | Địa danh ban hành |

### document

| Placeholder | Ý nghĩa |
|---|---|
| {{document.fullDocumentCode}} | Số cáo trạng, ví dụ: 01/CT-VKS-KV7 |
| {{document.issuePlaceDateLine}} | Địa danh, ngày tháng năm |

### official

| Placeholder | Ý nghĩa |
|---|---|
| {{official.issuerTitle}} | VIỆN TRƯỞNG VIỆN KIỂM SÁT... |

### legalBasis

| Placeholder | Ý nghĩa |
|---|---|
| {{legalBasis.procedureArticlesLine}} | Căn cứ các điều 41, 236, 239 và 243 của Bộ luật Tố tụng hình sự; |

### caseDecision

| Placeholder | Ý nghĩa |
|---|---|
| {{caseDecision.legalBasisLine}} | Căn cứ Quyết định khởi tố vụ án hình sự... |

### accusedDecision

| Placeholder | Ý nghĩa |
|---|---|
| {{accusedDecision.legalBasisLine}} | Căn cứ Quyết định khởi tố bị can... |

### caseJoinder

| Placeholder | Ý nghĩa |
|---|---|
| {{caseJoinder.legalBasisLine}} | Căn cứ Quyết định nhập vụ án hình sự... nếu có |

### caseRecovery

| Placeholder | Ý nghĩa |
|---|---|
| {{caseRecovery.legalBasisLine}} | Căn cứ Quyết định phục hồi vụ án hình sự... nếu có |

### investigationConclusion

| Placeholder | Ý nghĩa |
|---|---|
| {{investigationConclusion.legalBasisLine}} | Căn cứ Bản kết luận điều tra đề nghị truy tố... |

### indictment

| Placeholder | Ý nghĩa |
|---|---|
| {{indictment.factFindingsSection}} | Toàn bộ phần kết quả điều tra / diễn biến hành vi / vật chứng / dân sự |
| {{indictment.evidenceConclusionLine}} | Dòng chuyển ý: Căn cứ vào các tình tiết và chứng cứ nêu trên,... |
| {{indictment.conclusionSection}} | Toàn bộ phần KẾT LUẬN, lý lịch bị can, nhận định, tình tiết |
| {{indictment.prosecutionDecisionLine}} | Nội dung quyết định truy tố ra trước Tòa án |
| {{indictment.replacementLine}} | Dòng cáo trạng thay thế nếu có; để trống nếu không có |

### attachments

| Placeholder | Ý nghĩa |
|---|---|
| {{attachments.caseFileLine}} | Hồ sơ vụ án gồm bao nhiêu tập, bao nhiêu tờ |
| {{attachments.evidenceListLine}} | Bản kê vật chứng nếu có |
| {{attachments.courtSummonsListLine}} | Danh sách người VKS đề nghị Tòa án triệu tập |

### recipients

| Placeholder | Ý nghĩa |
|---|---|
| {{recipients.courtLine}} | Tòa án nhận cáo trạng |
| {{recipients.accusedLine}} | Bị can/người đại diện của bị can |
| {{recipients.investigationUnitLine}} | Cơ quan điều tra |
| {{recipients.superiorProcuracyLine}} | Viện kiểm sát cấp trên nếu có |
| {{recipients.otherRecipientsLine}} | Nơi nhận khác nếu có |
| {{recipients.archiveLine}} | Lưu: HSVA, HSKS, VP. |

### signature

| Placeholder | Ý nghĩa |
|---|---|
| {{signature.signMode}} | KT. VIỆN TRƯỞNG hoặc để trống |
| {{signature.positionTitle}} | PHÓ VIỆN TRƯỞNG / VIỆN TRƯỞNG |
| {{signature.signerName}} | Họ tên người ký |

---

## 3. Danh sách placeholder cần cấy trong DOCX

- {{agency.parentName}}
- {{agency.name}}
- {{document.fullDocumentCode}}
- {{document.issuePlaceDateLine}}
- {{official.issuerTitle}}
- {{legalBasis.procedureArticlesLine}}
- {{caseDecision.legalBasisLine}}
- {{accusedDecision.legalBasisLine}}
- {{caseJoinder.legalBasisLine}}
- {{caseRecovery.legalBasisLine}}
- {{investigationConclusion.legalBasisLine}}
- {{indictment.factFindingsSection}}
- {{indictment.evidenceConclusionLine}}
- {{indictment.conclusionSection}}
- {{indictment.prosecutionDecisionLine}}
- {{indictment.replacementLine}}
- {{attachments.caseFileLine}}
- {{attachments.evidenceListLine}}
- {{attachments.courtSummonsListLine}}
- {{recipients.courtLine}}
- {{recipients.accusedLine}}
- {{recipients.investigationUnitLine}}
- {{recipients.superiorProcuracyLine}}
- {{recipients.otherRecipientsLine}}
- {{recipients.archiveLine}}
- {{signature.signMode}}
- {{signature.positionTitle}}
- {{signature.signerName}}

Tổng dự kiến: 28 placeholder.

---

## 4. Ghi chú

BM-156 không nên cấy quá nhiều field nhỏ ngay từ đầu vì phần cáo trạng dài, dễ vỡ layout.

Phase đầu ưu tiên render đúng toàn văn và đúng bố cục.

Sau khi DOCX/PDF ổn, frontend BM-156 sẽ tách form thành các nhóm:
- Cơ quan / số cáo trạng
- Căn cứ tố tụng
- Kết quả điều tra
- Kết luận
- Quyết định truy tố
- Hồ sơ kèm theo
- Nơi nhận
- Chữ ký
