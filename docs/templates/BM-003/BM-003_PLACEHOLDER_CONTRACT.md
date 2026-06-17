# BM-003 PLACEHOLDER CONTRACT

## Template

Code: BM-003

Name:
Quyết định phân công thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm

Stage:
SOURCE_NEWS

Render scope:
CASE_LEVEL

Output strategy:
ONE_FILE_PER_CASE

Payload group chính:
sourceAssignment

## Source audit notes

Source text có các vấn đề cần xử lý khi map/format:

1. Dòng "Mẫu số 03/HS" đang bị lặp 2 lần.
2. Dòng "(Ban hành theo Thông tư số /2026/TT-VKSTC...)" đang thiếu số/ngày.
3. Có số chú thích lọt vào text: 2, 5, 6, 8.
4. Có nhiều dấu "...", ".................................................".
5. Điều 2 là nội dung optional "(nếu có)".
6. Không được để các số chú thích 2/5/6/8 còn trong output.
7. Không được dùng tên mặc định "Huy".

## Placeholder chính thức trong DOCX

### Agency

{{agency.parentName}}
{{agency.name}}

### Document

{{document.documentCode}}
{{document.issuePlaceAndDateLine}}

### Official

{{official.issuerTitle}}

### Legal basis

{{legalBasis.procedureArticlesLine}}

### Source assignment

{{sourceAssignment.article1Line}}
{{sourceAssignment.article2Line}}
{{sourceAssignment.article3Line}}

### Recipients

{{recipients.primaryLine}}
{{recipients.archiveLine}}

### Signature

{{signature.signMode}}
{{signature.positionTitle}}
{{signature.signerName}}

## Required fields

agency.parentName
agency.name
document.documentCode
document.issuePlaceAndDateLine
official.issuerTitle
legalBasis.procedureArticlesLine
sourceAssignment.article1Line
sourceAssignment.article3Line
recipients.primaryLine
recipients.archiveLine
signature.signMode
signature.positionTitle
signature.signerName

## Optional fields

sourceAssignment.article2Line

Nếu không phân công Kiểm tra viên giúp việc thì article2Line được để rỗng.
FE phải có checkbox:
- Có phân công Kiểm tra viên giúp việc
- Không có thì collapse Điều 2 hoặc để dòng phù hợp theo template sau khi thống nhất format.

## Sample payload

{
  "agency": {
    "parentName": "VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
    "name": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7",
    "bodyName": "Viện kiểm sát nhân dân khu vực 7",
    "shortName": "VKSKV7"
  },
  "document": {
    "documentCode": "03/QĐ-VKSKV7",
    "issuePlaceAndDateLine": "TP. Hồ Chí Minh, ngày 30 tháng 5 năm 2026"
  },
  "official": {
    "issuerTitle": "VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7"
  },
  "legalBasis": {
    "procedureArticlesLine": "Căn cứ các điều 41, 42, 43, 159 và 160 của Bộ luật Tố tụng hình sự;"
  },
  "sourceAssignment": {
    "article1Line": "Phân công ông/bà Nguyễn Thị Thanh Huyền; chức danh Kiểm sát viên của Viện kiểm sát nhân dân khu vực 7 thực hành quyền công tố, kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm của Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây đối với vụ việc có dấu hiệu Đánh bạc.",
    "article2Line": "Phân công ông/bà Trần Thanh Nam, Kiểm tra viên của Viện kiểm sát nhân dân khu vực 7 giúp việc cho Kiểm sát viên Nguyễn Thị Thanh Huyền.",
    "article3Line": "Ông/bà có tên nêu tại Điều 1 và Điều 2 Quyết định này thực hiện nhiệm vụ, quyền hạn và trách nhiệm theo quy định của Bộ luật Tố tụng hình sự."
  },
  "recipients": {
    "primaryLine": "Cơ quan Cảnh sát điều tra Công an phường Trung Mỹ Tây",
    "archiveLine": "Lưu: HSVV, HSKS, VP"
  },
  "signature": {
    "signMode": "KT. VIỆN TRƯỞNG",
    "positionTitle": "PHÓ VIỆN TRƯỞNG",
    "signerName": "Trần Thanh Nam"
  }
}

## Mapping rule

Ưu tiên map theo paragraph line để tránh lỗi split placeholder trong Word.

Không map inline quá nhỏ kiểu:
- chỉ tên người
- chỉ chức danh
- chỉ tên cơ quan

Với BM-003, map nguyên dòng Điều 1, Điều 2, Điều 3 bằng:
{{sourceAssignment.article1Line}}
{{sourceAssignment.article2Line}}
{{sourceAssignment.article3Line}}

FE sau này sẽ cho nhập field nhỏ:
- prosecutorName
- prosecutorTitle
- inspectorName
- inspectorTitle
- sourceProvider
- caseSummary
- hasInspectorAssistant

Backend/FE rebuild ra article1Line/article2Line/article3Line.

## Expected output

Output DOCX/PDF phải:
- Không còn placeholder {{...}}
- Không còn số chú thích 2/5/6/8 lọt trong thân văn bản
- Không còn dòng Mẫu số 03/HS bị lặp
- Có số văn bản
- Có ngày ban hành
- Có Điều 1, Điều 2, Điều 3
- Có nơi nhận
- Có chữ ký Trần Thanh Nam
- Không dùng dữ liệu tên Huy
