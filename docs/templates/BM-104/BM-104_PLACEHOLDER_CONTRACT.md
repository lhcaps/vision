# BM-104 PLACEHOLDER CONTRACT

## Template information

- Template code: BM-104
- Template name: Quyết định gia hạn thời hạn điều tra vụ án hình sự
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Status before mapping: NORMALIZED_READY

## Required placeholders

1. {{agency.parentName}}
2. {{agency.name}}
3. {{document.documentCode}}
4. {{document.issuePlaceAndDateLine}}
5. {{investigationExtension.requestRoundText}}
6. {{official.issuerTitle}}
7. {{legalBasis.procedureArticlesLine}}
8. {{caseDecision.prosecutionDecisionLegalBasisLine}}
9. {{investigationRecovery.legalBasisLine}}
10. {{proposal.requestingDocumentLine}}
11. {{investigationExtension.reasonLine}}
12. {{investigationExtension.decisionArticle1Line}}
13. {{investigationExtension.decisionArticle2Line}}
14. {{recipients.investigatingAgencyLine}}
15. {{recipients.archiveLine}}
16. {{signature.signMode}}
17. {{signature.positionTitle}}
18. {{signature.signerName}}

## Sections

### 1. Cơ quan
- agency.parentName
- agency.name

### 2. Thông tin quyết định
- document.documentCode
- document.issuePlaceAndDateLine
- investigationExtension.requestRoundText
- official.issuerTitle

### 3. Căn cứ pháp lý
- legalBasis.procedureArticlesLine
- caseDecision.prosecutionDecisionLegalBasisLine
- investigationRecovery.legalBasisLine

### 4. Hồ sơ đề nghị và nhận định
- proposal.requestingDocumentLine
- investigationExtension.reasonLine

### 5. Nội dung quyết định
- investigationExtension.decisionArticle1Line
- investigationExtension.decisionArticle2Line

### 6. Nơi nhận
- recipients.investigatingAgencyLine
- recipients.archiveLine

### 7. Chữ ký
- signature.signMode
- signature.positionTitle
- signature.signerName

## Mapping notes

- Chỉ sửa normalized DOCX.
- Không sửa generated DOCX/PDF.
- Không để placeholder bị tách dòng.
- Verify placeholder count phải bằng 18.
- Sau khi map xong phải update checksum/status.
