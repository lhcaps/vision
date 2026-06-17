# BM-148 PLACEHOLDER CONTRACT

## Template

- Code: BM-148
- Name: Quyết định tạm đình chỉ vụ án hình sự đối với bị can
- Scope: PERSON_LEVEL
- Output strategy: ONE_FILE_PER_PERSON
- Test generated document id: 73
- Test case id: 2
- Test target person id: 2

## Required payload groups

### document

| Placeholder | Meaning |
|---|---|
| {{document.documentCode}} | Số quyết định |
| {{document.issuePlaceAndDateLine}} | Địa danh, ngày tháng năm ban hành |

### agency

| Placeholder | Meaning |
|---|---|
| {{agency.parentName}} | Cơ quan cấp trên |
| {{agency.name}} | Viện kiểm sát ban hành |

### legalBasis

| Placeholder | Meaning |
|---|---|
| {{legalBasis.procedureArticlesLine}} | Căn cứ điều 41, 236, 240, 247 BLTTHS |
| {{legalBasis.juvenileJusticeLine}} | Căn cứ Điều 2 Luật Tư pháp người chưa thành niên |

### caseDecision

| Placeholder | Meaning |
|---|---|
| {{caseDecision.prosecutionDecisionLegalBasisLine}} | Căn cứ quyết định khởi tố vụ án |

### accusedDecision

| Placeholder | Meaning |
|---|---|
| {{accusedDecision.prosecutionDecisionLegalBasisLine}} | Căn cứ quyết định khởi tố bị can |

### suspension

| Placeholder | Meaning |
|---|---|
| {{suspension.reasonLine}} | Dòng xét thấy |
| {{suspension.article1Line}} | Nội dung Điều 1 |
| {{suspension.article2ActionLine}} | Nội dung Điều 2 |
| {{suspension.executionRequestLine}} | Nội dung Điều 3 |

### person

| Placeholder | Meaning |
|---|---|
| {{person.fullName}} | Họ tên bị can |
| {{person.genderText}} | Giới tính dạng tiếng Việt |
| {{person.otherName}} | Tên gọi khác |
| {{person.birthDateLine}} | Sinh ngày/tháng/năm/tại |
| {{person.nationalityEthnicityReligionLine}} | Quốc tịch, dân tộc, tôn giáo |
| {{person.occupation}} | Nghề nghiệp |
| {{person.identityDocumentLine}} | Số CCCD/CMND/hộ chiếu |
| {{person.identityIssueLine}} | Cấp ngày, nơi cấp |
| {{person.permanentResidence}} | Nơi thường trú |
| {{person.temporaryResidence}} | Nơi tạm trú |
| {{person.currentResidence}} | Nơi ở hiện tại |

### recipients

| Placeholder | Meaning |
|---|---|
| {{recipients.line1}} | Nơi nhận dòng 1 |
| {{recipients.line2}} | Nơi nhận dòng 2 |
| {{recipients.archiveLine}} | Lưu hồ sơ |

### signature

| Placeholder | Meaning |
|---|---|
| {{signature.signMode}} | KT. VIỆN TRƯỞNG |
| {{signature.positionTitle}} | PHÓ VIỆN TRƯỞNG |
| {{signature.signerName}} | Trần Thanh Nam |

## Notes

- BM-148 is person-level. Always keep `target_person_id`.
- Do not reuse BM-146 case-level output strategy.
- Backend overlay marker: `BM-148_MVP_PAYLOAD_FIX_START`.
- Template version current status before mapping: `NORMALIZED_ONLY`.
- After mapping placeholders, update `template_versions.placeholder_summary.status` to `PLACEHOLDERS_MAPPED`.
