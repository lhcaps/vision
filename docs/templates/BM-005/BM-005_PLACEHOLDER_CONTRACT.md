# BM-005 Placeholder Contract

## Template

- Code: BM-005
- Template no: 05/HS
- Name: Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm
- Render scope: CASE_LEVEL
- Output strategy: ONE_FILE_PER_CASE
- Test generated document: document_id = 68
- Case test: VKS-2026-0001

## Rule

Không dùng document.fullDocumentCode vì payload hiện đang bị nhân đôi mã văn bản.
Dùng document.documentCode.

Không dùng tên Huy làm dữ liệu mẫu.
Người ký mặc định: Trần Thanh Nam.

## Placeholder chính thức

### Header

{{agency.parentName}}
{{agency.name}}
{{document.documentCode}}
{{document.issuePlaceAndDateLine}}

### Căn cứ / nội dung yêu cầu

{{legalBasis.procedureArticlesLine}}
{{crimeReport.content}}
{{crimeReport.attachedItemsDescription}}

### Thông tin tiếp nhận / xác minh

{{reception.startedAtTimeText}}
{{reception.startedAtDay}}
{{reception.startedAtMonth}}
{{reception.startedAtYear}}
{{reception.locationName}}

### Người tiếp nhận / người thực hiện

{{receiver.fullName}}
{{receiver.positionTitle}}
{{receiver.departmentName}}

### Người cung cấp tin / người liên quan nếu mẫu cần

{{informant.fullName}}
{{informant.genderLabel}}
{{informant.birthDay}}
{{informant.birthMonth}}
{{informant.birthYear}}
{{informant.placeOfBirth}}
{{informant.nationality}}
{{informant.ethnicity}}
{{informant.religion}}
{{informant.occupation}}
{{informant.identityNo}}
{{informant.identityIssuedDay}}
{{informant.identityIssuedMonth}}
{{informant.identityIssuedYear}}
{{informant.identityIssuedPlace}}
{{informant.permanentAddress}}
{{informant.temporaryAddress}}
{{informant.currentAddress}}
{{informant.phone}}
{{informant.representedOrganization}}

### Nơi nhận / chữ ký

{{recipients.investigatingAgencyLine}}
{{recipients.archiveLine}}
{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

## Required fields MVP

- agency.parentName
- agency.name
- document.documentCode
- document.issuePlaceAndDateLine
- legalBasis.procedureArticlesLine
- crimeReport.content
- receiver.fullName
- receiver.positionTitle
- signature.signMode
- signature.positionTitle
- signature.signerName

## Sample data hiện có từ payload

- document.documentCode: 05/YC-VKSKV7
- document.issuePlaceAndDateLine: TP. Hồ Chí Minh, ngày 26 tháng 5 năm 2026
- crimeReport.content: Hồ sơ demo phục vụ kiểm thử luồng tạo hồ sơ, thêm bị can, thêm tội danh và sinh biểu mẫu.
- receiver.fullName: Trần Thanh Nam
- receiver.positionTitle: Kiểm sát viên
- signature.signMode: KT. VIỆN TRƯỞNG
- signature.positionTitle: PHÓ VIỆN TRƯỞNG
- signature.signerName: Trần Thanh Nam

## Output expected

- DOCX/PDF không còn placeholder.
- Số văn bản không bị nhân đôi.
- Header cơ quan đúng.
- Nội dung yêu cầu kiểm tra, xác minh lấy từ crimeReport.content.
- Chữ ký ra Trần Thanh Nam.
- Nếu FE sửa field thì lưu form-inputs xong render phải ra đúng dữ liệu mới.
