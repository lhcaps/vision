\# BM-097 PLACEHOLDER CONTRACT



\## 1. Thông tin biểu mẫu



\- Template code: BM-097

\- Template no: 97

\- Template name: Quyết định khởi tố bị can

\- Render scope: PERSON\_LEVEL

\- Output strategy: ONE\_FILE\_PER\_PERSON

\- Mục đích: Sinh Quyết định khởi tố bị can theo từng bị can trong một hồ sơ vụ án.



\---



\## 2. Nhóm agency



| Placeholder | Ý nghĩa |

|---|---|

| {{agency.parentName}} | Viện kiểm sát cấp trên trực tiếp |

| {{agency.name}} | Viện kiểm sát ban hành |

| {{agency.shortName}} | Tên viết tắt VKS ban hành |

| {{agency.issuePlace}} | Địa danh ban hành |



\---



\## 3. Nhóm document



| Placeholder | Ý nghĩa |

|---|---|

| {{document.documentNo}} | Số văn bản |

| {{document.documentCode}} | Ký hiệu văn bản |

| {{document.fullDocumentCode}} | Số/ký hiệu đầy đủ |

| {{document.issuePlaceDateLine}} | Dòng địa danh, ngày tháng |

| {{document.issueDay}} | Ngày ban hành |

| {{document.issueMonth}} | Tháng ban hành |

| {{document.issueYear}} | Năm ban hành |



\---



\## 4. Nhóm official



| Placeholder | Ý nghĩa |

|---|---|

| {{official.issuerTitle}} | Chức danh chủ thể ban hành quyết định |

| {{official.fullName}} | Họ tên cán bộ/người ký nếu cần |

| {{official.positionTitle}} | Chức vụ người ký nếu cần |



\---



\## 5. Nhóm legalBasis



| Placeholder | Ý nghĩa |

|---|---|

| {{legalBasis.procedureArticlesLine}} | Căn cứ các điều 41, 165 và 179 BLTTHS |

| {{legalBasis.juvenileJusticeLine}} | Căn cứ Luật Tư pháp người chưa thành niên, nếu áp dụng |



\---



\## 6. Nhóm caseDecision



| Placeholder | Ý nghĩa |

|---|---|

| {{caseDecision.decisionNo}} | Số Quyết định khởi tố vụ án |

| {{caseDecision.issueDateText}} | Ngày quyết định khởi tố vụ án |

| {{caseDecision.issuedBy}} | Cơ quan/người ra Quyết định khởi tố vụ án |

| {{caseDecision.legalBasisLine}} | Dòng căn cứ Quyết định khởi tố vụ án đầy đủ |



\---



\## 7. Nhóm person



| Placeholder | Ý nghĩa |

|---|---|

| {{person.fullName}} | Họ tên bị can |

| {{person.genderLabel}} | Giới tính |

| {{person.otherName}} | Tên gọi khác |

| {{person.birthInfoLine}} | Dòng ngày sinh/nơi sinh |

| {{person.nationality}} | Quốc tịch |

| {{person.ethnicity}} | Dân tộc |

| {{person.religion}} | Tôn giáo |

| {{person.occupation}} | Nghề nghiệp |

| {{person.identityDocumentLine}} | Dòng giấy tờ tùy thân |

| {{person.permanentAddress}} | Nơi thường trú |

| {{person.temporaryAddress}} | Nơi tạm trú |

| {{person.currentAddress}} | Nơi ở hiện tại |

| {{person.criminalRecordLine}} | Tiền án, tiền sự |



\---



\## 8. Nhóm offense



| Placeholder | Ý nghĩa |

|---|---|

| {{offense.offenseName}} | Tội danh |

| {{offense.legalArticle}} | Điều khoản |

| {{offense.criminalCodeText}} | Bộ luật Hình sự |

| {{offense.legalBasisText}} | Cụm tội danh đầy đủ |

| {{offense.actDescriptionLine}} | Dòng hành vi phạm tội |



\---



\## 9. Nhóm accusedDecision



| Placeholder | Ý nghĩa |

|---|---|

| {{accusedDecision.article1Line}} | Nội dung Điều 1: khởi tố bị can |

| {{accusedDecision.article2Line}} | Nội dung Điều 2: yêu cầu điều tra |

| {{accusedDecision.sufficientGroundsLine}} | Dòng “xét thấy có đủ căn cứ xác định...” |



\---



\## 10. Nhóm investigation



| Placeholder | Ý nghĩa |

|---|---|

| {{investigation.investigationUnitName}} | Cơ quan/người có thẩm quyền điều tra |

| {{investigation.article2Line}} | Dòng yêu cầu điều tra |



\---



\## 11. Nhóm recipients



| Placeholder | Ý nghĩa |

|---|---|

| {{recipients.personLine}} | Dòng nơi nhận cho bị can |

| {{recipients.investigationUnitLine}} | Dòng nơi nhận cho cơ quan điều tra |

| {{recipients.archiveLine}} | Dòng lưu hồ sơ |

| {{recipients.noteLine}} | Ghi chú nội bộ nếu có |



\---



\## 12. Nhóm signature



| Placeholder | Ý nghĩa |

|---|---|

| {{signature.signMode}} | Hình thức ký |

| {{signature.positionTitle}} | Chức vụ người ký |

| {{signature.signerName}} | Họ tên người ký |



\---



\## 13. Placeholder bắt buộc trong DOCX BM-097



```txt

{{agency.parentName}}

{{agency.name}}

{{document.fullDocumentCode}}

{{document.issuePlaceDateLine}}

{{official.issuerTitle}}

{{legalBasis.procedureArticlesLine}}

{{caseDecision.legalBasisLine}}

{{accusedDecision.sufficientGroundsLine}}

{{person.fullName}}

{{person.genderLabel}}

{{person.otherName}}

{{person.birthInfoLine}}

{{person.nationality}}

{{person.ethnicity}}

{{person.religion}}

{{person.occupation}}

{{person.identityDocumentLine}}

{{person.permanentAddress}}

{{person.temporaryAddress}}

{{person.currentAddress}}

{{person.criminalRecordLine}}

{{offense.actDescriptionLine}}

{{accusedDecision.article1Line}}

{{accusedDecision.article2Line}}

{{recipients.personLine}}

{{recipients.investigationUnitLine}}

{{recipients.archiveLine}}

{{signature.signMode}}

{{signature.positionTitle}}

{{signature.signerName}}

