\# BM-090 PLACEHOLDER CONTRACT



\## 1. Thông tin biểu mẫu



\- Template code: BM-090

\- Template name: Quyết định phê chuẩn Quyết định khởi tố bị can

\- Render scope: PERSON\_LEVEL

\- Output strategy: ONE\_FILE\_PER\_PERSON

\- Mục đích: Sinh quyết định phê chuẩn Quyết định khởi tố bị can theo hồ sơ vụ án và từng bị can/pháp nhân bị khởi tố.



\---



\## 2. Nhóm agency



Dùng cho phần đầu văn bản.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{agency.parentName}} | Viện kiểm sát cấp trên trực tiếp | VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH |

| {{agency.name}} | Viện kiểm sát ban hành | VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 |

| {{agency.shortName}} | Tên viết tắt VKS ban hành | VKSKV7 |

| {{agency.issuePlace}} | Địa danh ban hành | TP. Hồ Chí Minh |



\---



\## 3. Nhóm document



Dùng cho số, ký hiệu và ngày ban hành quyết định.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{document.documentNo}} | Số văn bản | 123 |

| {{document.symbol}} | Ký hiệu văn bản | QĐ-VKS |

| {{document.fullDocumentCode}} | Số/ký hiệu đầy đủ | 123/QĐ-VKS-VKSKV7 |

| {{document.issueDay}} | Ngày ban hành | 05 |

| {{document.issueMonth}} | Tháng ban hành | 3 |

| {{document.issueYear}} | Năm ban hành | 2026 |

| {{document.issueDateText}} | Ngày ban hành dạng pháp lý | ngày 05 tháng 3 năm 2026 |

| {{document.issuePlaceDateLine}} | Dòng địa danh, ngày tháng | TP. Hồ Chí Minh, ngày 05 tháng 3 năm 2026 |



\---



\## 4. Nhóm official



Dùng cho chức danh chủ thể ban hành.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{official.issuerTitle}} | Chức danh chủ thể ban hành | VIỆN TRƯỞNG VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 |

| {{official.issuerTitleShort}} | Chức danh rút gọn nếu cần | VIỆN TRƯỞNG |



\---



\## 5. Nhóm legalBasis



Dùng cho phần căn cứ đầu văn bản.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{legalBasis.procedureArticlesLine}} | Căn cứ BLTTHS chính | Căn cứ các điều 41, 165 và 179 của Bộ luật Tố tụng hình sự; |

| {{legalBasis.legalEntityArticleLine}} | Căn cứ Điều 433 nếu bị can là pháp nhân | Căn cứ Điều 433 của Bộ luật Tố tụng hình sự; |

| {{legalBasis.juvenileJusticeLine}} | Căn cứ Luật Tư pháp người chưa thành niên nếu có | Căn cứ Điều 2 của Luật Tư pháp người chưa thành niên; |



Ghi chú:

\- `legalBasis.legalEntityArticleLine` chỉ hiện khi đối tượng bị khởi tố là pháp nhân.

\- `legalBasis.juvenileJusticeLine` chỉ hiện khi người bị khởi tố là người chưa thành niên.

\- Nếu không áp dụng thì render chuỗi rỗng để không phá layout.



\---



\## 6. Nhóm caseDecision



Dùng cho căn cứ Quyết định khởi tố vụ án hình sự.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{caseDecision.decisionNo}} | Số quyết định khởi tố vụ án | G505/QĐ-VPCQCSĐT |

| {{caseDecision.issueDay}} | Ngày quyết định | 15 |

| {{caseDecision.issueMonth}} | Tháng quyết định | 10 |

| {{caseDecision.issueYear}} | Năm quyết định | 2025 |

| {{caseDecision.issueDateText}} | Ngày tháng dạng pháp lý | ngày 15 tháng 10 năm 2025 |

| {{caseDecision.issuedBy}} | Cơ quan/người ban hành quyết định khởi tố vụ án | Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh |

| {{caseDecision.legalBasisLine}} | Dòng căn cứ đầy đủ | Căn cứ Quyết định khởi tố vụ án hình sự số G505/QĐ-VPCQCSĐT ngày 15 tháng 10 năm 2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự; |

| {{caseDecision.changeSupplementText}} | Phần quyết định thay đổi/bổ sung nếu có | Quyết định thay đổi/bổ sung Quyết định khởi tố vụ án hình sự số... |



\---



\## 7. Nhóm accusedDecision



Dùng cho quyết định khởi tố bị can cần phê chuẩn.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{accusedDecision.decisionNo}} | Số quyết định khởi tố bị can | G813/QĐ-VPCQCSĐT |

| {{accusedDecision.issueDay}} | Ngày quyết định | 15 |

| {{accusedDecision.issueMonth}} | Tháng quyết định | 10 |

| {{accusedDecision.issueYear}} | Năm quyết định | 2025 |

| {{accusedDecision.issueDateText}} | Ngày tháng dạng pháp lý | ngày 15 tháng 10 năm 2025 |

| {{accusedDecision.issuedBy}} | Cơ quan/người ra quyết định khởi tố bị can | Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh |

| {{accusedDecision.requestLine}} | Dòng xét hồ sơ đề nghị phê chuẩn | Xét hồ sơ đề nghị phê chuẩn Quyết định khởi tố bị can số G813/QĐ-VPCQCSĐT ngày 15 tháng 10 năm 2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Đoàn Văn Dũng về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự; |

| {{accusedDecision.approvalArticle1Line}} | Nội dung Điều 1 | Phê chuẩn Quyết định khởi tố bị can số G813/QĐ-VPCQCSĐT ngày 15 tháng 10 năm 2025 của Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh đối với Đoàn Văn Dũng về tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự. |

| {{accusedDecision.investigationRequestLine}} | Nội dung Điều 2 | Yêu cầu Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh tiến hành điều tra theo quy định của Bộ luật Tố tụng hình sự. |



\---



\## 8. Nhóm person



Dùng cho người hoặc pháp nhân bị khởi tố.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{person.fullName}} | Họ tên người bị khởi tố | Đoàn Văn Dũng |

| {{person.displayName}} | Tên hiển thị trong văn bản | Đoàn Văn Dũng |

| {{person.genderLabel}} | Giới tính | Nam |

| {{person.birthInfoLine}} | Thông tin sinh nếu cần | sinh năm 1980 |

| {{person.identityDocumentLine}} | Dòng CCCD/CMND nếu cần | Thẻ CCCD số 051080000314 do... |

| {{person.addressLine}} | Địa chỉ nếu cần | số 13/4A, Ấp 107, xã Đông Thạnh, Thành phố Hồ Chí Minh |

| {{person.entityTypeLabel}} | Cá nhân/pháp nhân | cá nhân |

| {{person.accusedTargetText}} | Cụm “đối với...” | Đoàn Văn Dũng |



\---



\## 9. Nhóm legalEntity



Dùng khi bị can là pháp nhân.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{legalEntity.isLegalEntity}} | Có phải pháp nhân không | false |

| {{legalEntity.name}} | Tên pháp nhân | Công ty TNHH ABC |

| {{legalEntity.registrationNo}} | Mã số doanh nghiệp | 0312345678 |

| {{legalEntity.representativeName}} | Người đại diện | Nguyễn Văn B |

| {{legalEntity.representativePosition}} | Chức vụ người đại diện | Giám đốc |



\---



\## 10. Nhóm offense



Dùng cho tội danh và điều luật.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{offense.offenseName}} | Tội danh | Đánh bạc |

| {{offense.legalArticle}} | Điều khoản | khoản 1 Điều 321 |

| {{offense.criminalCodeText}} | Bộ luật | Bộ luật Hình sự |

| {{offense.legalBasisText}} | Dòng tội danh đầy đủ | tội Đánh bạc quy định tại khoản 1 Điều 321 của Bộ luật Hình sự |



\---



\## 11. Nhóm approval



Dùng cho nội dung nhận định và phê chuẩn.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{approval.assessmentLine}} | Dòng nhận thấy | Nhận thấy việc khởi tố bị can đối với Đoàn Văn Dũng là có căn cứ, |

| {{approval.article1Prefix}} | Mở đầu Điều 1 | Phê chuẩn Quyết định khởi tố bị can |

| {{approval.article2Prefix}} | Mở đầu Điều 2 | Yêu cầu |



\---



\## 12. Nhóm recipients



Dùng cho nơi nhận.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{recipients.investigationUnitLine}} | Dòng gửi cơ quan điều tra | - Cơ quan Cảnh sát điều tra Công an Thành phố Hồ Chí Minh; |

| {{recipients.personLine}} | Dòng gửi bị can/pháp nhân | - Đoàn Văn Dũng; |

| {{recipients.archiveLine}} | Dòng lưu | - Lưu: HSVA, HSKS, VP. |

| {{recipients.noteLine}} | Ký hiệu lưu nội bộ nếu có | T. Huyền.05b |



\---



\## 13. Nhóm signature



Dùng cho chữ ký.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{signature.signMode}} | Hình thức ký | KT. VIỆN TRƯỞNG |

| {{signature.positionTitle}} | Chức vụ người ký | PHÓ VIỆN TRƯỞNG |

| {{signature.signerName}} | Họ tên người ký | Trần Thanh Nam |

| {{signature.signerBlockTitle}} | Block chức danh hoàn chỉnh | KT. VIỆN TRƯỞNG\\nPHÓ VIỆN TRƯỞNG |



\---



\## 14. Nhóm template



Dùng metadata biểu mẫu.



| Placeholder | Ý nghĩa | Ví dụ |

|---|---|---|

| {{template.code}} | Mã biểu mẫu | BM-090 |

| {{template.formNo}} | Mẫu số | Mẫu số 90/HS |

| {{template.circularText}} | Thông tư ban hành | Ban hành theo Thông tư số .../2026/TT-VKSTC |



\---



\## 15. Placeholder bắt buộc nên có trong DOCX normalized



\### Phần đầu



```txt

{{agency.parentName}}

{{agency.name}}

Số: {{document.fullDocumentCode}}

{{document.issuePlaceDateLine}}

