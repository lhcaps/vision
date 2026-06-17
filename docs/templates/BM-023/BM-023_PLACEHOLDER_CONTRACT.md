# BM-023 PLACEHOLDER CONTRACT

## 1. Template metadata

- Template code: BM-023
- Template no: 23
- Template name: Quyết định khởi tố vụ án hình sự
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Template version: 1
- Current DB status: NORMALIZED_READY
- Normalized DOCX path: C:\LUẬT\QUANLYVKS\storage\templates\normalized-docx\BM-023\BM-023_normalized.docx

## 2. Business purpose

BM-023 dùng để ban hành Quyết định khởi tố vụ án hình sự.

Mẫu này là biểu mẫu cấp vụ án, không xuất riêng theo từng bị can.

## 3. Required payload groups

### agency

Dùng cho phần cơ quan ban hành.

Required fields:

- agency.parentName
- agency.name
- agency.shortName
- agency.issuePlace

### document

Dùng cho số văn bản và dòng địa danh/ngày tháng.

Required fields:

- document.documentCode
- document.issuePlaceAndDateLine
- document.issueDay
- document.issueMonth
- document.issueYear

### case

Dùng cho thông tin vụ việc/vụ án.

Required fields:

- case.caseCode
- case.caseTitle
- case.caseName
- case.summary
- case.receivedDateText

### offense

Dùng cho tội danh và điều khoản.

Required fields:

- offense.offenseName
- offense.legalArticle
- offense.criminalCodeText

### caseDecision

Dùng cho phần xét thấy và phần quyết định khởi tố.

Required fields:

- caseDecision.prosecutionReasonLine
- caseDecision.prosecutionDecisionLine
- caseDecision.investigationRequestLine

### legalBasis

Dùng cho căn cứ pháp lý.

Required fields:

- legalBasis.procedureArticlesLine
- legalBasis.criminalCodeLine

### signature / official

Dùng cho chức danh, người ký.

Required fields:

- signature.signMode
- signature.positionTitle
- signature.signerName
- official.issuerTitle

### recipients

Dùng cho nơi nhận.

Required fields:

- recipients.investigationAgencyLine
- recipients.superiorProcuracyLine
- recipients.archiveLine

## 4. Placeholder mapping plan

Header:

- {{agency.parentName}}
- {{agency.name}}
- {{document.documentCode}}
- {{document.issuePlaceAndDateLine}}

Legal basis:

- {{legalBasis.procedureArticlesLine}}

Reason:

- {{caseDecision.prosecutionReasonLine}}

Article 1:

- {{caseDecision.prosecutionDecisionLine}}

Article 2:

- {{caseDecision.investigationRequestLine}}

Recipients:

- {{recipients.investigationAgencyLine}}
- {{recipients.superiorProcuracyLine}}
- {{recipients.archiveLine}}

Signature:

- {{signature.signMode}}
- {{signature.positionTitle}}
- {{signature.signerName}}

## 5. Expected rendered content sample

- agency.name = VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7
- document.documentCode = 19/QĐ-VKSKV7
- case.caseTitle = Vụ án đánh bạc tại phường Trung Mỹ Tây
- offense.offenseName = Đánh bạc
- offense.legalArticle = khoản 1 Điều 321
- offense.criminalCodeText = Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025
- signature.signerName = Trần Thanh Nam

## 6. FE form requirements

BM-023 cần form riêng:

apps/web/src/components/documents/bm-023-form-inputs.tsx

Sections:

1. Thông tin văn bản
2. Thông tin vụ án/vụ việc
3. Căn cứ pháp lý
4. Tội danh/điều khoản
5. Yêu cầu điều tra
6. Người ký
7. Nơi nhận

## 7. Current status

- DB row: created
- Template version: created
- Normalized DOCX: exists
- Placeholder mapping: pending
- Render payload audit: pending
- Backend payload patch: pending if required
- DOCX render: pending
- PDF convert: pending
- Format fixed: pending
- FE form: pending
