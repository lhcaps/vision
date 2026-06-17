\# BM-053 Placeholder Contract



\## Template



\- Template code: BM-053

\- Template name: Lệnh cấm đi khỏi nơi cư trú

\- Render scope: PERSON\_LEVEL

\- Output strategy: ONE\_FILE\_PER\_PERSON



\## Rule



DOCX template must use double curly placeholders:



{{group.fieldName}}



Do not use raw database field names directly if the display text needs formatting.

Prefer formatted lines for legal sentences and long identity/address fields.



\---



\## 1. Agency



{{agency.parentName}}

{{agency.name}}

{{agency.shortName}}

{{agency.issuePlace}}

{{agency.phone}}

{{agency.monitoringUnitName}}



Example:



VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH  

VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7  

TP. Hồ Chí Minh  

0988027788  

Ủy ban nhân dân xã Đông Thạnh, Thành phố Hồ Chí Minh



\---



\## 2. Document



{{document.documentNo}}

{{document.documentCode}}

{{document.issueDate}}

{{document.issueDay}}

{{document.issueMonth}}

{{document.issueYear}}

{{document.issueDateText}}

{{document.issuePlaceAndDateLine}}



Example:



Số: {{document.documentCode}}  

{{document.issuePlaceAndDateLine}}



Expected output:



Số: /LCCT-VKSKV7  

TP. Hồ Chí Minh, ngày 04 tháng 3 năm 2026



\---



\## 3. Case Decision



{{caseDecision.decisionNo}}

{{caseDecision.issueDate}}

{{caseDecision.issueDay}}

{{caseDecision.issueMonth}}

{{caseDecision.issueYear}}

{{caseDecision.issueDateText}}

{{caseDecision.issuedBy}}

{{caseDecision.legalBasisLine}}



Use this in template:



Căn cứ {{caseDecision.legalBasisLine}};



\---



\## 4. Accused Decision



{{accusedDecision.decisionNo}}

{{accusedDecision.issueDate}}

{{accusedDecision.issueDay}}

{{accusedDecision.issueMonth}}

{{accusedDecision.issueYear}}

{{accusedDecision.issueDateText}}

{{accusedDecision.issuedBy}}

{{accusedDecision.legalBasisLine}}



Use this in template:



Căn cứ {{accusedDecision.legalBasisLine}};



\---



\## 5. Offense



{{offense.offenseName}}

{{offense.legalArticle}}

{{offense.criminalCodeText}}

{{offense.legalBasisText}}



Expected offense.legalBasisText:



về tội “Đánh bạc” quy định tại khoản 1 Điều 321 của Bộ luật Hình sự năm 2015, sửa đổi, bổ sung năm 2025



\---



\## 6. Person



{{person.fullName}}

{{person.genderLabel}}

{{person.otherName}}

{{person.dateOfBirth}}

{{person.birthDay}}

{{person.birthMonth}}

{{person.birthYear}}

{{person.dateOfBirthText}}

{{person.placeOfBirth}}

{{person.birthInfoLine}}

{{person.nationality}}

{{person.ethnicity}}

{{person.religion}}

{{person.occupation}}

{{person.identityType}}

{{person.identityNo}}

{{person.identityIssuedDate}}

{{person.identityIssuedDay}}

{{person.identityIssuedMonth}}

{{person.identityIssuedYear}}

{{person.identityIssuedDateText}}

{{person.identityIssuedPlace}}

{{person.identityDocumentLine}}

{{person.permanentAddress}}

{{person.temporaryAddress}}

{{person.currentAddress}}

{{person.residenceAddress}}



Prefer these formatted lines in DOCX:



{{person.birthInfoLine}}  

{{person.identityDocumentLine}}



Expected person.birthInfoLine examples:



Sinh ngày: 05 tháng 01 năm 1980 tại: tỉnh Quảng Ngãi  

Sinh năm 1998 tại: tỉnh Quảng Ngãi



Expected person.identityDocumentLine:



Thẻ CCCD: 051080000314, Cấp ngày 22/12/2021, Nơi cấp: Cục Cảnh sát Quản lý hành chính về trật tự xã hội



\---



\## 7. Measure



{{measure.durationText}}

{{measure.fromDate}}

{{measure.fromDay}}

{{measure.fromMonth}}

{{measure.fromYear}}

{{measure.fromDateText}}

{{measure.toDate}}

{{measure.toDay}}

{{measure.toMonth}}

{{measure.toYear}}

{{measure.toDateText}}

{{measure.residencePlace}}

{{measure.article2Line}}



Expected measure.article2Line:



Bị can không được phép đi khỏi nơi cư trú tại xã Đông Thạnh, Thành phố Hồ Chí Minh, trong thời hạn 10 ngày kể từ ngày 05/3/2026 đến ngày 14/3/2026.



\---



\## 8. Monitoring



{{monitoring.unitName}}

{{monitoring.phone}}

{{monitoring.prosecutorName}}

{{monitoring.article3Line}}



\---



\## 9. Recipients



{{recipients.monitoringUnitLine}}

{{recipients.personLine}}

{{recipients.archiveLine}}

{{recipients.noteLine}}



Expected:



\- UBND xã Đông Thạnh, Thành phố Hồ Chí Minh;

\- Đoàn Văn Dũng;

\- Lưu: HSVA, HSKS, VP.

&#x20; (T. Huyền.05b).



\---



\## 10. Signature



{{signature.signMode}}

{{signature.positionTitle}}

{{signature.signerName}}



Expected:



KT. VIỆN TRƯỞNG  

PHÓ VIỆN TRƯỞNG  

Trần Thanh Nam



\---



\## 11. Delivery



{{delivery.deliveredAtText}}

{{delivery.receiverTitle}}



Expected:



Lệnh này đã được giao cho người bị cấm đi khỏi nơi cư trú một bản vào hồi …..giờ……phút, ngày…….tháng…….năm 2026



NGƯỜI BỊ CẤM ĐI KHỎI NƠI CƯ TRÚ



\---



\## Required sections for FE form



The BM-053 frontend form must include these groups:



agency  

document  

caseDecision  

accusedDecision  

offense  

person  

measure  

monitoring  

recipients  

signature  

delivery

