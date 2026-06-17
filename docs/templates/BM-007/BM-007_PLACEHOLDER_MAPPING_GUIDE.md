# BM-007 PLACEHOLDER MAPPING GUIDE

## Template

BM-007 - Yêu cầu cung cấp tài liệu để kiểm sát việc giải quyết nguồn tin về tội phạm

## Việc cần làm trước

1. Xóa một block Mẫu số 07/HS bị lặp. Chỉ giữ 1 block.
2. Sửa phần mẫu số thành:
   Mẫu số 07/HS
   (Ban hành theo Thông tư số 03/2026/TT-VKSTC
   ngày 09/02/2026)
3. Xóa số chú thích rác standalone: 2, 5, 7.
4. Giữ dòng:
   CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
   Độc lập - Tự do - Hạnh phúc

## Placeholder contract

Header:
- {{agency.parentName}}
- {{agency.name}}
- {{document.documentCode}}
- {{document.issuePlaceAndDateLine}}

Issuer/legal:
- {{official.issuerTitle}}
- {{legalBasis.procedureArticlesLine}}

Main content:
- {{sourceMaterialRequest.reasonLine}}
- {{sourceMaterialRequest.article1Line}}
- {{sourceMaterialRequest.documentItem1Line}}
- {{sourceMaterialRequest.documentItem2Line}}
- {{sourceMaterialRequest.documentItem3Line}}
- {{sourceMaterialRequest.additionalDocumentItemsLine}}
- {{sourceMaterialRequest.deadlineLine}}

Recipients/signature:
- {{recipients.primaryLine}}
- {{recipients.archiveLine}}
- {{signature.positionTitle}}
- {{signature.signerName}}

## Mapping chi tiết theo nội dung gốc

Dòng cơ quan:
VIỆN KIỂM SÁT
…
=>
{{agency.parentName}}
{{agency.name}}

Dòng số:
Số: …/YC-VKS…-
=>
Số: {{document.documentCode}}

Dòng ngày:
…, ngày … tháng … năm 20…
=>
{{document.issuePlaceAndDateLine}}

Dòng chủ thể:
VIỆN KIỂM SÁT …
=>
{{official.issuerTitle}}

Dòng căn cứ:
Căn cứ các điều 41, 42 và 160 của Bộ luật Tố tụng hình sự;
=>
{{legalBasis.procedureArticlesLine}}

Đoạn:
Để kiểm sát việc giải quyết nguồn tin về tội phạm ... đối với vụ việc ..., được cơ quan, người có thẩm quyền ... tiếp nhận ngày ... tháng ... năm ...,
=>
{{sourceMaterialRequest.reasonLine}}

Mục 1:
Cơ quan, người có thẩm quyền ... cung cấp cho Viện kiểm sát ... các tài liệu liên quan đến việc giải quyết nguồn tin về tội phạm, cụ thể như sau:
=>
{{sourceMaterialRequest.article1Line}}

Các dòng a/b/c:
a) ...
b) ...
c) ...
...
=>
a) {{sourceMaterialRequest.documentItem1Line}}
b) {{sourceMaterialRequest.documentItem2Line}}
c) {{sourceMaterialRequest.documentItem3Line}}
{{sourceMaterialRequest.additionalDocumentItemsLine}}

Mục 2:
Thời hạn cung cấp tài liệu là: ... ngày, kể từ ngày cơ quan, người có thẩm quyền ... nhận được Yêu cầu này./.
=>
{{sourceMaterialRequest.deadlineLine}}

Nơi nhận:
- ...;
- Lưu: HSVV, HSKS, VP
=>
- {{recipients.primaryLine}};
- {{recipients.archiveLine}}

Chữ ký:
KIỂM SÁT VIÊN
(Ký, ghi rõ họ tên, đóng dấu)
=>
{{signature.positionTitle}}
{{signature.signerName}}
