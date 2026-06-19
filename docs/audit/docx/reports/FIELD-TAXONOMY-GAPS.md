# Field Taxonomy Gaps

Sinh lúc: 2026-06-19T01:19:42.451Z

## Phân tích

So sánh các `canonicalField.path` thực sự xuất hiện trong BESPOKE (213 file) với namespace đã khai báo trong `field-taxonomy.json`.

## Tần suất field trong BESPOKE (top 30)

| Field path | Số file dùng |
|---|---:|
| signature.positionTitle | 226 |
| agency.name | 222 |
| document.documentCode | 220 |
| signature.signMode | 220 |
| agency.parentName | 219 |
| recipients.archiveLine | 191 |
| signature.signerName | 190 |
| document.issuePlace | 175 |
| document.issueDate | 151 |
| agency.issuePlace | 148 |
| legalBasis.procedureArticlesLine | 93 |
| document.issueDateIso | 84 |
| agency.bodyName | 50 |
| agency.shortName | 48 |
| document.issueDateText | 47 |
| document.issuePlaceAndDateLine | 45 |
| agency.nameUpper | 33 |
| agency.parentNameUpper | 32 |
| recipients.primaryLine | 30 |
| recipients.investigatingAgencyLine | 27 |
| recipients.personLine | 22 |
| legalBasis.juvenileJusticeLine | 22 |
| decision.caseTitle | 22 |
| recipients.executionAgencyLine | 21 |
| recipients.accusedLine | 18 |
| document.documentNo | 16 |
| decision.procedureArticlesLine | 16 |
| case.caseTitle | 15 |
| decision.offenseName | 15 |
| recipients.line1 | 15 |

## Gaps so với field-taxonomy.json

- Đa số field thuộc namespace đã khai báo (`informant`, `agency`, `document`, ...).
- Một số field đặc thù xuất hiện nhiều lần cần được thêm vào `commonFields` của namespace:

- **informant.dateOfBirth**: Ngày sinh (ISO yyyy-MM-dd) — BESPOKE dùng `dateOfBirth`, contract gợi ý `birthDate` (chưa thống nhất).
- **informant.birthYear**: Năm sinh riêng (khi không rõ ngày/tháng).
- **informant.identityIssuedDate**: Ngày cấp giấy tờ (ISO).
- **informant.identityIssuedPlace**: Nơi cấp giấy tờ.
- **informant.signerName**: Tên ký cho người khai.
- **receiver.signerName**: Tên ký cho người tiếp nhận.
- **document.issuePlace**: Địa danh (lấy từ agency).
- **document.issueDay**: Ngày tách (dd).
- **document.issueMonth**: Tháng tách (mm).
- **document.issueYear**: Năm tách (yyyy).
- **reception.startedAtDate**: Ngày bắt đầu (ISO).
- **reception.startedAtDay**: Ngày tách dd.
- **reception.endedAtDate**: Ngày kết thúc (ISO).
- **reception.endedAtDay**: Ngày tách dd.

## Action items

1. Reviewer quyết định convention cuối:
   - BESPOKE đang dùng `dateOfBirth` (ISO) — contract nên dùng `dateOfBirth` cho consistent?
   - Hay contract dùng `birthDate` cho consistent với `issueDate`?
2. Sau khi quyết, update `field-taxonomy.json` `commonFields` cho từng namespace.
3. Chạy lại pipeline → draft contracts sẽ tự động dùng canonical path.
