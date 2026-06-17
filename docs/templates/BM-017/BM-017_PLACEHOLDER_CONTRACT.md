# BM-017 Placeholder Contract

## Template

- Code: BM-017
- Template no: 17/HS
- Name: Yêu cầu khởi tố vụ án hình sự
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Test generated document: document_id = 70

## Critical rules

Không dùng document.fullDocumentCode vì payload bị nhân đôi mã văn bản.
Dùng document.documentCode.

Không dùng sourceVerification.* vì group này rỗng trong BM-017.
BM-017 dùng group riêng:

caseInitiationRequest.*

Nếu template giữ sẵn số thứ tự "1." và "2." thì:
- caseInitiationRequest.article1Line không chứa lại "1."
- caseInitiationRequest.article2Line không chứa lại "2."

## Official placeholders

{{agency.parentName}}
{{agency.name}}
{{document.documentCode}}
{{document.issuePlaceAndDateLine}}
{{official.issuerTitle}}

{{caseInitiationRequest.procedureArticlesLine}}
{{caseInitiationRequest.assessmentLine}}
{{caseInitiationRequest.article1Line}}
{{caseInitiationRequest.article2Line}}
{{caseInitiationRequest.investigationAuthorityRecipientLine}}

{{recipients.archiveLine}}

{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

## Mapping

VIỆN KIỂM SÁT cấp trên
=> {{agency.parentName}}

VIỆN KIỂM SÁT ban hành
=> {{agency.name}}

Số văn bản
=> Số: {{document.documentCode}}

Địa danh, ngày tháng
=> {{document.issuePlaceAndDateLine}}

Chủ thể ban hành
=> {{official.issuerTitle}}

Căn cứ tố tụng
=> {{caseInitiationRequest.procedureArticlesLine}}

Xét thấy...
=> {{caseInitiationRequest.assessmentLine}}

Mục 1
=> {{caseInitiationRequest.article1Line}}

Mục 2
=> {{caseInitiationRequest.article2Line}}

Nơi nhận cơ quan điều tra
=> {{caseInitiationRequest.investigationAuthorityRecipientLine}}

Lưu hồ sơ
=> {{recipients.archiveLine}}

Chữ ký
=> {{signature.signMode}}
=> {{signature.positionTitle}}
=> {{signature.signerName}}
