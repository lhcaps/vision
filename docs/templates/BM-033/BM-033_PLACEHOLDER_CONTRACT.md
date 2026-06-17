# BM-033 PLACEHOLDER CONTRACT

## 1. Template

Code: BM-033

Name:
Quyết định phê chuẩn Quyết định gia hạn tạm giữ

Render scope:
PERSON_LEVEL

Output strategy:
ONE_FILE_PER_PERSON

Test document:
document_id = 57

Test case:
case_id = 2
case_code = VKS-2026-0001

Target person:
target_person_id = 2
target_person_name = Đoàn Văn Dũng

## 2. Business meaning

BM-033 dùng để phê chuẩn Quyết định gia hạn tạm giữ.

Mẫu cần render các nhóm dữ liệu chính:

- agency
- document
- official
- case
- person
- offense
- custody
- legalBasis
- recipients
- signature

## 3. Source text mapping

### Header

Line 011-017:

VIỆN KIỂM SÁT
…
.................................................
Số: …/QĐ-VKS…-

Suggested placeholders:

{{agency.parentNameUpper}}
{{agency.nameUpper}}
{{document.documentCode}}

### Issue date/place

Line 021:

…, ngày … tháng … năm 20...

Suggested placeholder:

{{document.issuePlaceAndDateLine}}

Expected output example:

TP. Hồ Chí Minh, ngày 25 tháng 5 năm 2026

### Title

Line 022-025:

QUYẾT ĐỊNH
PHÊ CHUẨN QUYẾT ĐỊNH GIA HẠN TẠM GIỮ
Lần thứ …

Suggested placeholder:

{{custody.extensionAttemptText}}

Expected output example:

Lần thứ nhất

### Issuing authority

Line 026-028:

VIỆN TRƯỞNG VIỆN KIỂM SÁT
2
…

Suggested placeholder:

{{official.issuingAuthorityLine}}

Expected output example:

VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7

### Legal basis

Line 029:

Căn cứ các điều 41, 118 và 165 của Bộ luật Tố tụng hình sự;

Suggested placeholder:

{{legalBasis.procedureArticlesLine}}

Line 030-031:

Căn cứ Điều 135 và Điều 137 của Luật Tư pháp người chưa thành niên;

Suggested placeholder:

{{legalBasis.juvenileJusticeLine}}

Note:
Nếu không áp dụng người chưa thành niên thì vẫn có thể giữ dòng này theo mẫu hoặc cho FE toggle sau.

### Detention decision basis

Line 032-041:

Căn cứ Quyết định tạm giữ số … ngày … tháng … năm …
và Quyết định gia hạn tạm giữ lần thứ … số … ngày … tháng … năm … của … (nếu có);

Suggested placeholders:

{{custody.detentionDecisionLine}}
{{custody.previousExtensionDecisionLine}}

Expected output example:

Căn cứ Quyết định tạm giữ số 12/QĐ-CSĐT ngày 20 tháng 5 năm 2026
và Quyết định gia hạn tạm giữ lần thứ nhất số 13/QĐ-CSĐT ngày 23 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;

### Proposal/request basis

Line 042-047:

Xét hồ sơ đề nghị phê chuẩn Quyết định gia hạn tạm giữ lần thứ …
số … ngày … tháng … năm … của ... đối với …;

Suggested placeholders:

{{custody.approvalProposalLine}}
{{custody.approvalProposalAgencyLine}}
{{person.fullName}}

Expected output example:

Xét hồ sơ đề nghị phê chuẩn Quyết định gia hạn tạm giữ lần thứ nhất số 14/QĐ-CSĐT ngày 24 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Đoàn Văn Dũng;

### Reason

Line 048-050:

Nhận thấy …..,

Suggested placeholder:

{{custody.approvalReasonLine}}

Expected output example:

Nhận thấy việc gia hạn tạm giữ là có căn cứ, đúng thẩm quyền và cần thiết cho việc xác minh, điều tra vụ án,

### Article 1

Line 052-058:

Điều 1. Phê chuẩn Quyết định gia hạn tạm giữ lần thứ …
số … ngày … tháng … năm … của … đối với ....

Suggested placeholder:

{{custody.approvalArticle1Line}}

Expected output example:

Phê chuẩn Quyết định gia hạn tạm giữ lần thứ nhất số 14/QĐ-CSĐT ngày 24 tháng 5 năm 2026 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Đoàn Văn Dũng.

### Article 2

Line 059-062:

Điều 2. Yêu cầu … thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.

Suggested placeholder:

{{custody.executionRequestLine}}

Expected output example:

Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh thực hiện Quyết định này theo đúng quy định của Bộ luật Tố tụng hình sự./.

### Recipients

Line 063-070:

Nơi nhận:
- …;
- …;
- Lưu: HSVV/VA, HSKS, VP.

Suggested placeholders:

{{recipients.executionAgencyLine}}
{{recipients.personLine}}
{{recipients.archiveLine}}

Expected output example:

- Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh;
- Đoàn Văn Dũng;
- Lưu: HSVV/VA, HSKS, VP.

### Signature

Line 071-075:

…………………………
(Ký, ghi rõ họ tên, đóng dấu)

Suggested placeholders:

{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

Expected output example:

KT. VIỆN TRƯỞNG
PHÓ VIỆN TRƯỞNG

Trần Thanh Nam

## 4. Placeholder list v1

{{agency.parentNameUpper}}
{{agency.nameUpper}}
{{document.documentCode}}
{{document.issuePlaceAndDateLine}}
{{official.issuingAuthorityLine}}
{{custody.extensionAttemptText}}
{{legalBasis.procedureArticlesLine}}
{{legalBasis.juvenileJusticeLine}}
{{custody.detentionDecisionLine}}
{{custody.previousExtensionDecisionLine}}
{{custody.approvalProposalLine}}
{{custody.approvalProposalAgencyLine}}
{{person.fullName}}
{{custody.approvalReasonLine}}
{{custody.approvalArticle1Line}}
{{custody.executionRequestLine}}
{{recipients.executionAgencyLine}}
{{recipients.personLine}}
{{recipients.archiveLine}}
{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

## 5. Required fields for FE

document.documentCode
document.issueDate
document.issuePlace

custody.extensionAttemptText
custody.detentionDecisionCode
custody.detentionDecisionDate
custody.previousExtensionDecisionCode
custody.previousExtensionDecisionDate
custody.previousExtensionDecisionAgencyName
custody.approvalProposalCode
custody.approvalProposalDate
custody.approvalProposalAgencyName
custody.approvalReasonLine

recipients.executionAgencyName
recipients.personName
recipients.archiveLine

signature.signMode
signature.positionTitle
signature.signerName

## 6. Rules

1. Không giữ lại các số chú thích 2, 6, 7, 8, 9, 10 trong output.
2. Không dùng tên Huy làm dữ liệu mẫu.
3. Người ký mặc định: Trần Thanh Nam.
4. signMode mặc định: KT. VIỆN TRƯỞNG.
5. positionTitle mặc định: PHÓ VIỆN TRƯỞNG.
6. Chỉ map placeholder sau khi kiểm render-payload.
7. Nếu render-payload thiếu custody/legalBasis/recipients thì patch backend trước.
8. Không sửa file trong storage/generated.
9. Sau khi map phải verify placeholder.
10. Sau khi render phải check DOCX không còn {{...}}.
