# Form Runtime Readiness Report

Sinh lúc: 2026-06-19T10:37:36.988Z

## Summary

- Total forms: **213**
- Locked (runtime-eligible): **3**
- Draft (needs review): **210**
- Total generic `.field#` slots across drafts: **1189**
- Unknown source field count: **1454**
- Review-required slots: **1727**

## Runtime Eligibility

| Status | Count | Notes |
|--------|-------|-------|
| **Locked** (production-ready) | 3 | BM-001, BM-002, BM-003 |
| **Draft** (needs human review) | 210 | Not eligible for production create/save/render |
| **Reference docs** | 2 | Excluded from form runtime |

## Forms by Stage

| Stage | Label | Locked | Draft | Total |
|-------|-------|--------|-------|-------|
| 01 | Tiếp nhận và giải quyết nguồn tin | 3 | 27 | 30 |
| 02 | Biện pháp ngăn chặn, cưỡng chế | 0 | 39 | 39 |
| 03 | Người tham gia tố tụng | 0 | 15 | 15 |
| 04 | Giai đoạn điều tra | 0 | 56 | 56 |
| 05 | Giai đoạn truy tố | 0 | 28 | 28 |
| 06 | Vật chứng | 0 | 5 | 5 |
| 07 | Biện pháp điều tra đặc biệt | 0 | 5 | 5 |
| 08 | Thủ tục đặc biệt | 0 | 6 | 6 |
| 09 | Người chưa thành niên | 0 | 29 | 29 |

## Top 20 Forms with Highest Generic Field Count

These forms need the most field mapping work before they can be locked.

| # | Template Code | Title | Generic Fields | Stage |
|---|--------------|-------|----------------|-------|
| 1 | BM-004 | QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin | 44 | 01 |
| 2 | BM-167 | Thông báo về việc trả hồ sơ, ban hành cáo trạng | 27 | 05 |
| 3 | BM-068 | QĐ huỷ bỏ biện pháp phong toả tài khoản | 17 | 02 |
| 4 | BM-184 | Đề nghị áp dụng biện pháp bảo vệ | 14 | 08 |
| 5 | BM-062 | Lệnh kê biên tài sản | 13 | 02 |
| 6 | BM-063 | Biên bản kê biên tài sản | 13 | 02 |
| 7 | BM-209 | Quyết định áp dụng biện pháp giám sát bởi người đại diện | 13 | 09 |
| 8 | BM-009 | QĐ gia hạn thời hạn giải quyết nguồn tin về tội phạm | 12 | 01 |
| 9 | BM-158 | Danh sách đề nghị triệu tập đến phiên tòa | 12 | 05 |
| 10 | BM-191 | Quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng | 12 | 09 |
| 11 | BM-196 | Quyết định mở phiên họp xem xét, áp dụng biện pháp xử lý chuyển hướng tại cộng đồng - Copy | 12 | 09 |
| 12 | BM-156 | Cáo trạng | 11 | 05 |
| 13 | BM-190 | Đề nghị Tòa án xem xét, quyết định áp dụng biện pháp giáo dục tại trường giáo dưỡng | 11 | 09 |
| 14 | BM-192 | Quyết định không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng | 11 | 09 |
| 15 | BM-203 | Thông báo về hoạt động tố tụng | 11 | 09 |
| 16 | BM-060 | QĐ áp giải bị can | 10 | 02 |
| 17 | BM-096 | Yêu cầu ra QĐ khởi tố bị can | 10 | 04 |
| 18 | BM-097 | QĐ khởi tố bị can | 10 | 04 |
| 19 | BM-135 | BB hỏi cung bị can | 10 | 04 |
| 20 | BM-136 | BB đối chất | 10 | 04 |

## Recommended Next Review Batch

Forms with **fewest generic fields** are the easiest to lock next.
Priority order (by ascending generic field count):

| # | Template Code | Title | Generic Fields | Stage |
|---|--------------|-------|----------------|-------|
| 1 | BM-049 | QĐ phê chuẩn QĐ về việc đặt tiền để bảo đảm | 1 | 02 |
| 2 | BM-089 | QĐ huỷ bỏ QĐ tách vụ án hình sự | 1 | 04 |
| 3 | BM-122 | QĐ không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm | 1 | 04 |
| 4 | BM-123 | QĐ thực nghiệm điều tra | 1 | 04 |
| 5 | BM-143 | Quyết định tách vụ án hình sự trong giai đoạn truy tố | 1 | 05 |
| 6 | BM-157 | Bản kê vật chứng kèm theo Cáo trạng | 1 | 05 |
| 7 | BM-165 | Thông báo về việc vụ án có bị can bị tạm giam | 1 | 05 |
| 8 | BM-197 | BB phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng | 1 | 09 |
| 9 | BM-010 | QĐ tạm đình chỉ giải quyết nguồn tin về tội phạm | 2 | 01 |
| 10 | BM-015 | KH trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm | 2 | 01 |

## Batch Unlock Path

To go from **3 locked** → **213 locked** (full corpus):

1. **Easy batch** (~10 forms): Most fields already named, just verification needed.
2. **Medium batch** (~50 forms): Some `.field#` patterns, moderate mapping work.
3. **Hard batch** (~150 forms): Complex forms with many generic fields, domain knowledge required.

Current progress: **3/213** forms locked (**1.4%**).