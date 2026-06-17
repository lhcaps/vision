# BM-103 PLACEHOLDER CONTRACT

## 1. Template information

- Template code: BM-103
- Template name: Đề nghị gia hạn thời hạn điều tra vụ án hình sự
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Template status before mapping: NORMALIZED_READY

## 2. Required placeholders

1. {{agency.parentName}}
2. {{agency.name}}
3. {{document.documentCode}}
4. {{document.issuePlaceAndDateLine}}
5. {{recipients.superiorProcuracyName}}
6. {{legalBasis.procedureArticlesLine}}
7. {{caseDecision.prosecutionDecisionLegalBasisLine}}
8. {{investigationExtension.previousDecisionLegalBasisLine}}
9. {{proposal.requestingDocumentLine}}
10. {{proposal.proposingProcuracyName}}
11. {{investigationExtension.requestRoundText}}
12. {{caseDecision.prosecutionDecisionSummaryLine}}
13. {{investigationExtension.durationText}}
14. {{investigationExtension.fromDateText}}
15. {{investigationExtension.toDateText}}
16. {{recipients.superiorProcuracyLine}}
17. {{recipients.investigatingAgencyLine}}
18. {{recipients.archiveLine}}
19. {{signature.signMode}}
20. {{signature.positionTitle}}
21. {{signature.signerName}}

## 3. Form sections

### Cơ quan ban hành

- agency.parentName
- agency.name

### Thông tin văn bản

- document.documentCode
- document.issuePlaceAndDateLine

### VKS nhận đề nghị

- recipients.superiorProcuracyName

### Căn cứ pháp lý và vụ án

- legalBasis.procedureArticlesLine
- caseDecision.prosecutionDecisionLegalBasisLine
- investigationExtension.previousDecisionLegalBasisLine

### Nội dung đề nghị gia hạn

- proposal.requestingDocumentLine
- proposal.proposingProcuracyName
- investigationExtension.requestRoundText
- caseDecision.prosecutionDecisionSummaryLine
- investigationExtension.durationText
- investigationExtension.fromDateText
- investigationExtension.toDateText

### Nơi nhận

- recipients.superiorProcuracyLine
- recipients.investigatingAgencyLine
- recipients.archiveLine

### Chữ ký

- signature.signMode
- signature.positionTitle
- signature.signerName

## 4. Mapping notes

- Chỉ sửa normalized DOCX, không sửa generated DOCX/PDF.
- Không để placeholder bị tách dòng.
- Nếu backend đã sinh nguyên câu có dấu chấm phẩy thì không thêm dấu câu thừa bên ngoài.
- Sau khi map xong phải verify placeholder count và update checksum.