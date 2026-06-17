# BM-001 PLACEHOLDER CONTRACT

Biểu mẫu: BM-001 — Biên bản tiếp nhận nguồn tin về tội phạm  
Render scope: CASE_LEVEL  
Output strategy: ONE_FILE_PER_CASE  
Template path:

C:\LUẬT\QUANLYVKS\storage\templates\normalized-docx\BM-001\BM-001_Bien-ban-tiep-nhan-nguon-tin-ve-toi-pham.docx

Generated document test:

- documentId: 1
- caseId: 2
- templateId: 1
- targetScope: CASE_LEVEL
- targetPersonId: NULL

---

## 1. Nguyên tắc

BM-001 là biểu mẫu CASE_LEVEL, không phụ thuộc target_person_id.

Không dùng nhầm form BM-053/BM-097.

Không sửa mất bố cục gốc DOCX.

Các placeholder phải cấy trực tiếp vào file Word, giữ nguyên:
- Quốc hiệu
- Tiêu ngữ
- căn lề
- bảng/ô nếu có
- footnote/số chú thích nếu có
- phần chữ ký
- dòng lưu

---

## 2. Nhóm placeholder

### agency

| Placeholder | Ý nghĩa |
|---|---|
| {{agency.name}} | Tên Viện kiểm sát lập biên bản |
| {{agency.issuePlace}} | Địa danh ban hành/lập biên bản |

### document

| Placeholder | Ý nghĩa |
|---|---|
| {{document.issuePlaceDateLine}} | Dòng địa danh ngày tháng: TP. Hồ Chí Minh, ngày ... tháng ... năm ... |

### reception

| Placeholder | Ý nghĩa |
|---|---|
| {{reception.startedAtTimeText}} | Giờ bắt đầu tiếp nhận |
| {{reception.startedAtDay}} | Ngày bắt đầu tiếp nhận |
| {{reception.startedAtMonth}} | Tháng bắt đầu tiếp nhận |
| {{reception.startedAtYear}} | Năm bắt đầu tiếp nhận |
| {{reception.locationName}} | Nơi tiếp nhận nguồn tin |
| {{reception.endedAtTimeText}} | Giờ kết thúc tiếp nhận |
| {{reception.endedAtDay}} | Ngày kết thúc tiếp nhận |
| {{reception.endedAtMonth}} | Tháng kết thúc tiếp nhận |
| {{reception.endedAtYear}} | Năm kết thúc tiếp nhận |

### receiver

| Placeholder | Ý nghĩa |
|---|---|
| {{receiver.fullName}} | Họ tên người tiếp nhận |
| {{receiver.positionTitle}} | Chức danh người tiếp nhận |
| {{receiver.departmentName}} | Đơn vị công tác |
| {{receiver.signerName}} | Tên ký phần NGƯỜI TIẾP NHẬN |

### informant

| Placeholder | Ý nghĩa |
|---|---|
| {{informant.fullName}} | Họ tên người cung cấp nguồn tin |
| {{informant.genderLabel}} | Giới tính |
| {{informant.otherName}} | Tên gọi khác |
| {{informant.birthDay}} | Ngày sinh |
| {{informant.birthMonth}} | Tháng sinh |
| {{informant.birthYear}} | Năm sinh |
| {{informant.placeOfBirth}} | Nơi sinh |
| {{informant.nationality}} | Quốc tịch |
| {{informant.ethnicity}} | Dân tộc |
| {{informant.religion}} | Tôn giáo |
| {{informant.occupation}} | Nghề nghiệp |
| {{informant.identityNo}} | Số CMND/CCCD/CC/Hộ chiếu |
| {{informant.identityIssuedDay}} | Ngày cấp giấy tờ |
| {{informant.identityIssuedMonth}} | Tháng cấp giấy tờ |
| {{informant.identityIssuedYear}} | Năm cấp giấy tờ |
| {{informant.identityIssuedPlace}} | Nơi cấp giấy tờ |
| {{informant.permanentAddress}} | Nơi thường trú |
| {{informant.temporaryAddress}} | Nơi tạm trú |
| {{informant.currentAddress}} | Nơi ở hiện tại |
| {{informant.phone}} | Số điện thoại |
| {{informant.representedOrganization}} | Cơ quan/tổ chức được đại diện nếu có |
| {{informant.signerName}} | Tên ký phần NGƯỜI CUNG CẤP NGUỒN TIN |

### crimeReport

| Placeholder | Ý nghĩa |
|---|---|
| {{crimeReport.content}} | Nội dung nguồn tin về tội phạm |
| {{crimeReport.attachedItemsDescription}} | Tài liệu, đồ vật giao nộp kèm theo |

### recipients

| Placeholder | Ý nghĩa |
|---|---|
| {{recipients.archiveLine}} | Dòng lưu hồ sơ |

---

## 3. Danh sách placeholder cần có trong DOCX

- {{agency.name}}
- {{document.issuePlaceDateLine}}
- {{reception.startedAtTimeText}}
- {{reception.startedAtDay}}
- {{reception.startedAtMonth}}
- {{reception.startedAtYear}}
- {{reception.locationName}}
- {{receiver.fullName}}
- {{receiver.positionTitle}}
- {{receiver.departmentName}}
- {{informant.fullName}}
- {{informant.genderLabel}}
- {{informant.otherName}}
- {{informant.birthDay}}
- {{informant.birthMonth}}
- {{informant.birthYear}}
- {{informant.placeOfBirth}}
- {{informant.nationality}}
- {{informant.ethnicity}}
- {{informant.religion}}
- {{informant.occupation}}
- {{informant.identityNo}}
- {{informant.identityIssuedDay}}
- {{informant.identityIssuedMonth}}
- {{informant.identityIssuedYear}}
- {{informant.identityIssuedPlace}}
- {{informant.permanentAddress}}
- {{informant.temporaryAddress}}
- {{informant.currentAddress}}
- {{informant.phone}}
- {{informant.representedOrganization}}
- {{crimeReport.content}}
- {{crimeReport.attachedItemsDescription}}
- {{reception.endedAtTimeText}}
- {{reception.endedAtDay}}
- {{reception.endedAtMonth}}
- {{reception.endedAtYear}}
- {{informant.signerName}}
- {{receiver.signerName}}
- {{recipients.archiveLine}}

Tổng: 40 placeholder.

---

## 4. Ghi chú nghiệp vụ

BM-001 là biên bản tiếp nhận nguồn tin, nên nhóm person của BM-053/BM-097 không được dùng trực tiếp làm bị can.

BM-001 dùng nhóm informant để biểu diễn ông/bà cung cấp nguồn tin.

Nếu backend hiện chưa có nhóm informant/reception/receiver/crimeReport thì phải patch document-renderer.service.ts.

Không render khi DOCX chưa có placeholder.

Không tạo frontend form BM-001 bằng cách copy y nguyên BM-053. BM-001 cần form riêng theo nghiệp vụ tiếp nhận nguồn tin.

