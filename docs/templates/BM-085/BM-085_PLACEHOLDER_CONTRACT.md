# BM-085 Placeholder Contract

## Template

- Code: BM-085
- Template no: 85/HS
- Name: Quyết định chuyển vụ án hình sự để điều tra theo thẩm quyền
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Test generated document: document_id = 71

## Critical rules

Không dùng prosecutionTransfer.* vì group đó dùng cho chuyển vụ án để truy tố theo thẩm quyền.
BM-085 điều tra phải dùng group riêng:

caseInvestigationTransfer.*

Không dùng document.fullDocumentCode vì payload bị nhân đôi mã văn bản.
Dùng document.documentCode.

Nếu template giữ sẵn "Điều 1." và "Điều 2." thì:
- caseInvestigationTransfer.article1Line không chứa lại "Điều 1."
- caseInvestigationTransfer.article2Line không chứa lại "Điều 2."

## Official placeholders

{{agency.parentName}}
{{agency.name}}
{{document.documentCode}}
{{document.issuePlaceAndDateLine}}
{{official.issuerTitle}}

{{caseInvestigationTransfer.procedureArticlesLine}}
{{caseInvestigationTransfer.reasonLine}}
{{caseInvestigationTransfer.article1Line}}
{{caseInvestigationTransfer.article2Line}}
{{caseInvestigationTransfer.fromInvestigationAuthorityRecipientLine}}
{{caseInvestigationTransfer.toInvestigationAuthorityRecipientLine}}
{{caseInvestigationTransfer.toProcuracyRecipientLine}}

{{recipients.accusedLine}}
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
=> {{caseInvestigationTransfer.procedureArticlesLine}}

Xét thấy...
=> {{caseInvestigationTransfer.reasonLine}}

Điều 1
=> {{caseInvestigationTransfer.article1Line}}

Điều 2
=> {{caseInvestigationTransfer.article2Line}}

Nơi nhận - cơ quan đang điều tra
=> {{caseInvestigationTransfer.fromInvestigationAuthorityRecipientLine}}

Nơi nhận - cơ quan nhận chuyển
=> {{caseInvestigationTransfer.toInvestigationAuthorityRecipientLine}}

Nơi nhận - Viện kiểm sát có thẩm quyền
=> {{caseInvestigationTransfer.toProcuracyRecipientLine}}

Bị can hoặc người đại diện của bị can
=> {{recipients.accusedLine}}

Lưu hồ sơ
=> {{recipients.archiveLine}}

Chữ ký
=> {{signature.signMode}}
=> {{signature.positionTitle}}
=> {{signature.signerName}}
