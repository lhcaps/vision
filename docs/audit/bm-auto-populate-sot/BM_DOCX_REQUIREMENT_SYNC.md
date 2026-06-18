# BM DOCX Requirement Sync Audit

Generated: 2026-06-18T10:33:05.721Z

## Summary

- Requirement DOCX: docs/Yêu cầu đối với dự án QUANLYNOIBOVKS.docx
- Requirement paragraphs: 88
- Requirement first margin: {"topTwips":1440,"rightTwips":1440,"bottomTwips":1440,"leftTwips":1440,"topCm":2.54,"rightCm":2.54,"bottomCm":2.54,"leftCm":2.54,"topIn":1,"rightIn":1,"bottomIn":1,"leftIn":1}
- Requirement keyword hits: {"bieu mau":true,"can le":false,"du lieu":true,"docx":false,"dong bo":true,"mau van ban":false,"pdf":false,"tu dong":false,"tt 03":false,"vks":true}
- Corpus rows: 213
- Corpus findings: 0
- Form component files: 130/213
- Generic template panel wrappers: 83/213
- Normalized DOCX OK: 213/213
- Normalized DOCX with explicit margin: 213/213
- Render SUMMARY.md OK: 213/213
- Render summary.json OK: 213/213

## Requirement Excerpts

- Số: Mỗi biểu mẫu một lệnh số khác nhau ( QĐ-VKSKV7, LBTG-VKSKV7,...) tùy theo biểu mẫu.
- Phần mẫu số: thì mỗi biểu mẫu chỉ khác số ở trên thôi, còn lại dòng (Ban hành...) thì auto là (Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026) -> sz: 8
- Những biểu mẫu mà có Điều 1, Điều 2,... hoặc chỉ có 1, 2,... thôi cũng phải cho nó in đậm.
- Những dòng dữ liệu phía sau sz 11.
- Biểu mẫu nào dài quá 2 trang phải có đánh số trang:
- Đây là biểu mẫu được format hoàn chỉnh, có thể tham khảo:
- Đối với API: Thì mỗi biểu mẫu phải được điền sẵn dữ liệu mẫu, tuy nhiên không được patch cứng dữ liệu ( tránh khi Save hay render vẫn hiện dữ liệu cũ ).
- Form tạo biểu mẫu:
- Từng biểu mẫu đều có từng fields và chức năng khác nhau, ví dụ với BM39:
- Thiết kế từng ô nhập đúng logic với từng biểu mẫu, ví dụ như Tên bị can, Tội danh, Ngày sinh,...
- Đây là mẫu FE mẫu có thể tham khảo, đã được thiết kế đúng theo từng ô nhập, chức năng chính, date dropdown, đồng bộ được dữ liệu khi nhập những dữ liệu nội dung chính,... và cuối cùng là bảng preview để người dùng có thể xem được trước nội dung khi in.
- Tại trang tạo biểu mẫu chính này: QUANLYVKS, phải có phần tìm kiếm dữ liệu đầu vào mà từ đó hệ thống có thể lọc ra được các fields chứa các nội dung đó, gợi ý cho những biểu mẫu liên quan để người dùng có thể sử dụng.
- Phần Thông tư 03...: file tổng hợp hơn 200 biểu mẫu của người dùng.
- 01 đến 09: mỗi biểu mẫu được xếp theo từng giai đoạn.
- Tại trang đó tạo thêm phần Select option: Nói dễ hiểu là người dùng di chuột vào phần lọc theo giai đoạn -> hệ thống xuất ra 9 giai đoạn -> chọn 1 giai đoạn bất kì -> hiển thị ra toàn bộ biểu mẫu theo giai đoạn đó.
- Nó sẽ dựa vào những dữ liệu mà mình nhập cho từng biểu mẫu -> tạo ra bảng báo cáo theo Tuần, theo Tháng với 3 mục nhập chính: Thời gian, Phường, Tội danh,...
- Ý kiến update là: Khi thiết kế FE thì phải lấy dữ liệu chi tiết của 3 mục trên, lưu vào DB hoặc gì đó tùy hứng, thì lúc thống kê ra nó sẽ dễ dàng hơn -> Xuất ra được bao nhiêu Vụ án khi mà chọn theo fields đó.

## Margin Signatures

- T0.25/R2/B2/L3: 2
- T0.5/R1.52/B0.51/L2.03: 2
- T0.5/R2/B2/L3: 1
- T0.75/R1.52/B0.51/L2.03: 1
- T0.75/R2/B2/L3: 2
- T0/R1.52/B0.51/L2.03: 1
- T1.5/R1.5/B1/L3: 1
- T1.52/R1.52/B0.51/L2.03: 148
- T1.67/R2/B2/L3: 1
- T1/R1.52/B0.51/L2.03: 1
- T1/R2/B2/L3: 4
- T2.27/R1.5/B2/L2.5: 1
- T2.54/R2.54/B2.54/L2.54: 1
- T2/R1.5/B1.5/L3: 2
- T2/R1.5/B2/L3: 6
- T2/R1.52/B0.51/L2.03: 1
- T2/R2/B2/L3: 38

## Per-form Matrix

| BM | Source | Panel | Prefill | Context | Normalized DOCX | DOCX PH | Margin | Render MD | Risks |
|---|---|---|---|---:|---|---:|---|---:|---|
| BM-001 | DOC | specific | backend_plus_manual_control | yes | ok | 39 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-002 | DOC | specific | backend_plus_manual_control | yes | ok | 33 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal |
| BM-003 | DOC | specific | backend_plus_manual_control | yes | ok | 14 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-004 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-005 | DOC | specific | backend_plus_manual_control | yes | ok | 17 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-006 | DOC | specific | backend_plus_manual_control | yes | ok | 17 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-007 | DOC | specific | backend_plus_manual_control | yes | ok | 17 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-008 | DOC | specific | backend_plus_manual_control | yes | ok | 17 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal |
| BM-009 | DOC | specific | backend_plus_manual_control | yes | ok | 16 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-010 | DOC | specific | backend_plus_manual_control | yes | ok | 16 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-011 | DOC | specific | backend_plus_manual_control | yes | ok | 15 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-012 | DOC | specific | backend_plus_manual_control | yes | ok | 15 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal |
| BM-013 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-014 | DOC | specific | backend_plus_manual_control | yes | ok | 19 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-015 | DOC | specific | backend_plus_manual_control | yes | ok | 28 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-016 | DOC | specific | backend_plus_manual_control | yes | ok | 30 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-017 | DOC | specific | backend_plus_manual_control | yes | ok | 14 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-018 | DOC | specific | backend_plus_manual_control | yes | ok | 18 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-019 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T0.25/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-020 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-021 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-022 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T0.5/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-023 | DOC | specific | backend_plus_manual_control | yes | ok | 19 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-024 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-025 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-026 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T0.25/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-027 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-028 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-029 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T0.75/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-030 | DOC | specific | backend_plus_manual_control | yes | ok | 14 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-031 | DOC | specific | backend_plus_manual_control | yes | ok | 15 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-032 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-033 | DOC | specific | backend_plus_manual_control | yes | ok | 21 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-034 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-035 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-036 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-037 | DOC | specific | backend_plus_manual_control | yes | ok | 19 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-038 | DOC | specific | backend_plus_manual_control | yes | ok | 20 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-039 | DOC | specific | backend_plus_manual_control | yes | ok | 41 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-040 | DOC | specific | backend_plus_manual_control | yes | ok | 20 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-041 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-042 | DOC | specific | backend_plus_manual_control | yes | ok | 23 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-043 | DOC | specific | backend_plus_manual_control | yes | ok | 19 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-044 | DOC | specific | backend_plus_manual_control | yes | ok | 20 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-045 | DOC | specific | backend_plus_manual_control | no | ok | 20 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-046 | DOC | specific | backend_plus_manual_control | no | ok | 20 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-047 | DOC | specific | backend_plus_manual_control | no | ok | 34 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-048 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-049 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-050 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-051 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-052 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-053 | DOC | specific | backend_plus_manual_control | yes | ok | 35 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-054 | DOC | specific | backend_plus_manual_control | no | ok | 29 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-055 | DOC | specific | backend_plus_manual_control | no | ok | 33 | T0/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-056 | DOC | specific | backend_plus_manual_control | no | ok | 28 | T2/R2/B2/L3 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-057 | DOC | specific | backend_plus_manual_control | no | ok | 29 | T2/R2/B2/L3 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-058 | DOC | specific | backend_plus_manual_control | no | ok | 36 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-059 | DOC | specific | backend_plus_manual_control | no | ok | 39 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-060 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-061 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T0.75/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-062 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-063 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-064 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-065 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R1.5/B1.5/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-066 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-067 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R1.5/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-068 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-069 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R1.5/B1.5/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-070 | DOC | specific | backend_plus_manual_control | yes | ok | 19 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-071 | DOC | specific | backend_plus_manual_control | yes | ok | 20 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-072 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-073 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-074 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-075 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-076 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-077 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-078 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-079 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-080 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-081 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-082 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-083 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-084 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-085 | DOC | specific | backend_plus_manual_control | no | ok | 19 | T1/R2/B2/L3 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-086 | DOC | specific | backend_plus_manual_control | no | ok | 18 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-087 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-088 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1/R2/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-089 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1/R2/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-090 | DOC | specific | backend_plus_manual_control | yes | ok | 18 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-091 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-092 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-093 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-094 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-095 | DOC | specific | backend_payload_on_open | no | ok | 0 | T0.75/R2/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-096 | DOC | specific | backend_payload_on_open | no | ok | 0 | T2/R2/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-097 | DOC | specific | backend_plus_manual_control | yes | ok | 32 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-098 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-099 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-100 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-101 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-102 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.67/R2/B2/L3 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-103 | DOC | specific | backend_plus_manual_control | no | ok | 22 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-104 | DOC | specific | backend_plus_manual_control | no | ok | 18 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-105 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-106 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-107 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-108 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-109 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-110 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-111 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-112 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-113 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-114 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-115 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-116 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-117 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-118 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-119 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-120 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-121 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-122 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-123 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context |
| BM-124 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T2/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context |
| BM-125 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-126 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-127 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-128 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-129 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-130 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-131 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-132 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-133 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-134 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-135 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-136 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-137 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T2/R1.5/B2/L3 | yes | form does not consume CasePayload context |
| BM-138 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-139 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context |
| BM-140 | DOC | specific | backend_plus_manual_control | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context |
| BM-141 | DOC | specific | backend_plus_manual_control | yes | ok | 19 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-142 | DOC | specific | backend_payload_on_open | no | ok | 0 | T2/R1.5/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-143 | DOC | specific | backend_payload_on_open | no | ok | 0 | T2/R1.5/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-144 | DOC | specific | backend_plus_manual_control | yes | ok | 17 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-145 | DOC | specific | backend_plus_manual_control | no | ok | 21 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-146 | DOC | specific | backend_plus_manual_control | no | ok | 18 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-147 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-148 | DOC | specific | backend_plus_manual_control | yes | ok | 30 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-149 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-150 | DOC | specific | backend_plus_manual_control | no | ok | 22 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-151 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-152 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-153 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-154 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-155 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-156 | DOC | specific | backend_plus_manual_control | yes | ok | 41 | T2/R2/B2/L3 | yes | hardcoded person/official sample signal |
| BM-157 | DOC | specific | backend_payload_on_open | no | ok | 0 | T2/R1.5/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-158 | DOCX | specific | backend_payload_on_open | no | ok | 0 | T2.54/R2.54/B2.54/L2.54 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-159 | DOC | specific | backend_plus_manual_control | no | ok | 15 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-160 | DOC | specific | backend_payload_on_open | no | ok | 0 | T2/R1.5/B2/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-161 | DOC | specific | backend_payload_on_open | no | ok | 0 | T1.5/R1.5/B1/L3 | yes | form does not consume CasePayload context; no explicit default/sample action; hardcoded person/official sample signal |
| BM-162 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T0.5/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-163 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T0.5/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-164 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-165 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-166 | DOC | specific | backend_plus_manual_control | yes | ok | 14 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-167 | DOCX | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2.27/R1.5/B2/L2.5 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-168 | DOC | specific | backend_plus_manual_control | no | ok | 14 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-169 | DOC | specific | backend_plus_manual_control | yes | ok | 20 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-170 | DOC | specific | backend_plus_manual_control | no | ok | 17 | T1.52/R1.52/B0.51/L2.03 | yes | form does not consume CasePayload context; hardcoded person/official sample signal |
| BM-171 | DOC | specific | backend_plus_manual_control | yes | ok | 34 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-172 | DOC | specific | backend_plus_manual_control | yes | ok | 34 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-173 | DOC | specific | backend_plus_manual_control | yes | ok | 16 | T1.52/R1.52/B0.51/L2.03 | yes | hardcoded person/official sample signal |
| BM-174 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-175 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-176 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-177 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-178 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-179 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-180 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-181 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-182 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-183 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-184 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-185 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-186 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-187 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-188 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-189 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-190 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-191 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-192 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-193 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-194 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-195 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T2/R2/B2/L3 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-196 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-197 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-198 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-199 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-200 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-201 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-202 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-203 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-204 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-205 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-206 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-207 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-208 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-209 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-210 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-211 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-212 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
| BM-213 | DOC | generic-wrapper | backend_plus_manual_control | yes | ok | 0 | T1.52/R1.52/B0.51/L2.03 | yes | no explicit default/sample action; hardcoded person/official sample signal; generic panel, not a bespoke BM field map |
