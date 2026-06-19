# Form Corpus Reconciliation

Sinh lúc: 2026-06-19T11:01:36.113Z

## Counts

- Inventory records: **216**
- Form documents: **214**
- Reference documents: **2**
- Unique template codes: **213**
- Duplicate template codes: **1**
- Draft contracts: **214**
- Locked contracts: **3**
- Runtime-eligible contracts: **3**
- Reference docs excluded: **2**

## Canonical Form Corpus Answer

| Metric | Value |
|--------|-------|
| Total source files scanned | 216 |
| Form documents (runtime-eligible) | 214 |
| Reference documents (excluded) | 2 |
| Unique BM codes (BM-001..BM-213) | 213 |
| Duplicate BM codes (e.g. BM-139) | 1 |

**Conclusion**: The corpus is **213 distinct BM forms** (BM-001..BM-213), plus 1 duplicate variant (BM-139).
The "215" figure includes the 2 reference documents (Thông tư 03 + Danh mục), which are NOT form runtime targets.

## Duplicate codes

| Code | Count | Files |
|------|-------|-------|
| BM-139 | 2 | 139-Kiến nghị khắc phục vi phạm trong hoạt động khởi tố, điều tra.doc; 139-Kiến nghị khắc phục, xử lý vi phạm trong hoạt động tiếp nhận, giải quyết nguồn tin, khởi tố, điều tra, truy tố.doc |

## Reference documents

Reference docs are **excluded from form runtime**. Each has `sourceId` prefixed with `REF__`.

| SourceId | File |
|----------|------|
| REF__danh-muc-bieu-mau-kem-theo-thong-tu-03__ce60c04f053a | Danh muc bieu mau kem theo Thong tu 03.doc |
| REF__thong-tu-so-03-2026-vkstc__9e8198e81988 | Thong tu so 03-2026-VKSTC.docx |

## Locked status by BM

Locked contracts take precedence over draft contracts with the same template code.

| Template Code | Title | Status | Slots | Fields | Generic Fields |
|---------------|-------|--------|-------|--------|----------------|
| BM-001 | Biên bản tiếp nhận nguồn tin về tội phạm | **locked** | 28 | 28 | 0 |
| BM-002 | Phiếu chuyển nguồn tin về tội phạm | **locked** | 32 | 29 | 0 |
| BM-003 | QĐ phân công THQCT, KS việc tiếp nhận, giải quyết nguồn tin về tội phạm | **locked** | 10 | 10 | 0 |
| BM-004 | QĐ thay đổi người THQCT, KS việc giải quyết nguồn tin | **draft** | 50 | 46 | 44 |
| BM-005 | Yêu cầu kiểm tra, xác minh nguồn tin về tội phạm | **draft** | 3 | 3 | 3 |
| BM-006 | Yêu cầu tiếp nhận, kiểm tra, xác minh, ra QĐ giải quyết nguồn tin về tội phạm | **draft** | 3 | 3 | 3 |
| BM-007 | Yêu cầu cung cấp tài liệu để kiểm sát việc giải quyết nguồn tin về tội phạm | **draft** | 8 | 8 | 8 |
| BM-008 | Yêu cầu chuyển nguồn tin về tội phạm | **draft** | 4 | 4 | 4 |
| BM-009 | QĐ gia hạn thời hạn giải quyết nguồn tin về tội phạm | **draft** | 12 | 12 | 12 |
| BM-010 | QĐ tạm đình chỉ giải quyết nguồn tin về tội phạm | **draft** | 2 | 2 | 2 |
| BM-011 | QĐ huỷ bỏ QĐ tạm đình chỉ việc giải quyết nguồn tin về tội phạm | **draft** | 4 | 4 | 4 |
| BM-012 | QĐ phục hồi giải quyết nguồn tin | **draft** | 4 | 4 | 4 |
| BM-013 | QĐ giải quyết tranh chấp về thẩm quyền giải quyết nguồn tin | **draft** | 5 | 5 | 5 |
| BM-014 | QĐ trực tiếp kiểm sát tiếp nhận, giải quyết nguồn tin về tội phạm | **draft** | 5 | 5 | 5 |
| BM-015 | KH trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm | **draft** | 2 | 2 | 2 |
| BM-016 | KL trực tiếp kiểm sát việc tiếp nhận, giải quyết nguồn tin về tội phạm | **draft** | 2 | 2 | 2 |
| BM-017 | Yêu cầu khởi tố vụ án hình sự | **draft** | 3 | 3 | 3 |
| BM-018 | Yêu cầu ra QĐ thay đổi QĐ khởi tố vụ án hình sự | **draft** | 3 | 3 | 3 |
| BM-019 | Yêu cầu ra QĐ bổ sung QĐ khởi tố vụ án hình sự | **draft** | 5 | 5 | 5 |
| BM-020 | Yêu cầu ra QĐ hủy bỏ QĐ khởi tố, QĐ không khởi tố | **draft** | 3 | 3 | 3 |
| BM-021 | QĐ không khởi tố vụ án hình sự | **draft** | 3 | 3 | 3 |
| BM-022 | QĐ huỷ bỏ QĐ không khởi tố vụ án hình sự | **draft** | 4 | 4 | 4 |
| BM-023 | QĐ khởi tố vụ án hình sự | **draft** | 6 | 6 | 6 |
| BM-024 | QĐ thay đổi QĐ khởi tố vụ án hình sự | **draft** | 6 | 6 | 6 |
| BM-025 | QĐ bổ sung QĐ khởi tố vụ án hình sự | **draft** | 2 | 2 | 2 |
| BM-026 | QĐ huỷ bỏ QĐ khởi tố vụ án hình sự | **draft** | 4 | 4 | 4 |
| BM-027 | Thông báo về việc huỷ bỏ QĐ khởi tố vụ án hình sự | **draft** | 2 | 2 | 2 |
| BM-028 | QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố vụ án hình sự | **draft** | 5 | 5 | 5 |
| BM-029 | QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố vụ án hình sự | **draft** | 3 | 3 | 3 |
| BM-030 | Thông báo kết quả giải quyết nguồn tin về tội phạm | **draft** | 3 | 3 | 3 |
| BM-031 | QĐ phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp | **draft** | 4 | 4 | 4 |
| BM-032 | QĐ không phê chuẩn Lệnh bắt người bị giữ trong trường hợp khẩn cấp | **draft** | 3 | 3 | 3 |
| BM-033 | QĐ phê chuẩn QĐ gia hạn tạm giữ | **draft** | 4 | 4 | 4 |
| BM-034 | QĐ không phê chuẩn QĐ gia hạn tạm giữ | **draft** | 3 | 3 | 3 |
| BM-035 | QĐ huỷ bỏ QĐ tạm giữ, quyết định gia hạn tạm giữ | **draft** | 4 | 4 | 4 |
| BM-036 | QĐ trả tự do cho người bị tạm giữ | **draft** | 17 | 13 | 9 |
| BM-037 | QĐ phê chuẩn Lệnh bắt bị can để tạm giam | **draft** | 4 | 4 | 4 |
| BM-038 | QĐ không phê chuẩn Lệnh bắt bị can để tạm giam | **draft** | 5 | 5 | 5 |
| BM-039 | Lệnh bắt bị can bị tạm giam | **draft** | 14 | 10 | 6 |
| BM-040 | QĐ phê chuẩn Lệnh tạm giam | **draft** | 5 | 5 | 5 |
| BM-041 | QĐ không phê chuẩn Lệnh tạm giam | **draft** | 3 | 3 | 3 |
| BM-042 | QĐ gia hạn tạm giam | **draft** | 4 | 4 | 4 |
| BM-043 | QĐ huỷ bỏ biện pháp tạm giam | **draft** | 4 | 4 | 4 |
| BM-044 | QĐ thay thế biện pháp tạm giam | **draft** | 2 | 2 | 2 |
| BM-045 | QĐ phê chuẩn QĐ về việc bảo lĩnh | **draft** | 3 | 3 | 3 |
| BM-046 | QĐ không phê chuẩn QĐ về việc bảo lĩnh | **draft** | 3 | 3 | 3 |
| BM-047 | QĐ về việc bảo lĩnh | **draft** | 13 | 9 | 5 |
| BM-048 | QĐ huỷ bỏ biện pháp bảo lĩnh | **draft** | 12 | 8 | 4 |
| BM-049 | QĐ phê chuẩn QĐ về việc đặt tiền để bảo đảm | **draft** | 1 | 1 | 1 |
| BM-050 | QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm | **draft** | 2 | 2 | 2 |
| BM-051 | QĐ về việc đặt tiền để bảo đảm | **draft** | 3 | 3 | 3 |
| BM-052 | QĐ huỷ bỏ biện pháp đặt tiền để bảo đảm | **draft** | 13 | 9 | 5 |
| BM-053 | Lệnh cấm đi khỏi nơi cư trú | **draft** | 16 | 12 | 8 |
| BM-054 | Thông báo về việc áp dụng biện pháp cấm đi khỏi nơi cư trú | **draft** | 13 | 9 | 5 |
| BM-055 | QĐ huỷ bỏ biện pháp cấm đi khỏi nơi cư trú | **draft** | 13 | 9 | 5 |
| BM-056 | QĐ tạm hoãn xuất cảnh | **draft** | 14 | 10 | 6 |
| BM-057 | QĐ huỷ bỏ biện pháp tạm hoãn xuất cảnh | **draft** | 15 | 11 | 7 |
| BM-058 | Lệnh tạm giam | **draft** | 16 | 12 | 8 |
| BM-059 | QĐ gia hạn thời hạn tạm giam để truy tố 1 | **draft** | 16 | 12 | 8 |
| BM-060 | QĐ áp giải bị can | **draft** | 20 | 15 | 10 |
| BM-061 | QĐ dẫn giải | **draft** | 12 | 8 | 4 |
| BM-062 | Lệnh kê biên tài sản | **draft** | 21 | 17 | 13 |
| BM-063 | Biên bản kê biên tài sản | **draft** | 21 | 17 | 13 |
| BM-064 | QĐ huỷ bỏ biện pháp kê biên tài sản | **draft** | 4 | 4 | 4 |
| BM-065 | BB về việc thi hành Quyết định hủy bỏ Lệnh kê biên tài sản | **draft** | 15 | 11 | 7 |
| BM-066 | Lệnh phong toả tài khoản | **draft** | 17 | 13 | 9 |
| BM-067 | Biên bản phong tỏa tài khoản | **draft** | 13 | 9 | 5 |
| BM-068 | QĐ huỷ bỏ biện pháp phong toả tài khoản | **draft** | 25 | 21 | 17 |
| BM-069 | BB về việc hủy bỏ biện pháp phong tỏa tài khoản | **draft** | 17 | 13 | 9 |
| BM-070 | QĐ phân công PVT THQCT, KS việc giải quyết VAHS | **draft** | 4 | 4 | 4 |
| BM-071 | QĐ phân công KSV, KTV THQCT, KS việc giải quyết VAHS | **draft** | 3 | 3 | 3 |
| BM-072 | QĐ thay đổi VT, PVT, KSV, KTV THQCT, KS việc giải quyết vụ án hình sự | **draft** | 5 | 5 | 5 |
| BM-073 | Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra | **draft** | 4 | 4 | 4 |
| BM-074 | Yêu cầu cử người phiên dịch, người dịch thuật | **draft** | 5 | 5 | 5 |
| BM-075 | Đề nghị thay đổi người phiên dịch, người dịch thuật | **draft** | 6 | 6 | 6 |
| BM-076 | QĐ thay đổi người phiên dịch, người dịch thuật | **draft** | 5 | 5 | 5 |
| BM-077 | Yêu cầu, đề nghị cử người bào chữa | **draft** | 3 | 3 | 3 |
| BM-078 | Thông báo người bào chữa | **draft** | 11 | 7 | 3 |
| BM-079 | Thông báo huỷ bỏ việc đăng ký bào chữa | **draft** | 2 | 2 | 2 |
| BM-080 | Thông báo từ chối việc đăng ký bào chữa | **draft** | 13 | 9 | 5 |
| BM-081 | QĐ thời điểm người bào chữa tham gia tố tụng | **draft** | 3 | 3 | 3 |
| BM-082 | Thông báo về thời gian, địa điểm tiến hành tố tụng cho người bào chữa | **draft** | 4 | 4 | 4 |
| BM-083 | Yêu cầu thay đổi người giám định, người định giá tài sản | **draft** | 4 | 4 | 4 |
| BM-084 | QĐ thay đổi người giám định, người định giá tài sản | **draft** | 2 | 2 | 2 |
| BM-085 | QĐ chuyển vụ án hình sự để điều tra theo thẩm quyền | **draft** | 6 | 6 | 6 |
| BM-086 | QĐ chuyển việc thực hiện thẩm quyền thực hành quyền công tố, kiểm sát giải quyết nguồn tin, khởi tố điều tra | **draft** | 3 | 3 | 3 |
| BM-087 | Yêu cầu điều tra | **draft** | 5 | 5 | 5 |
| BM-088 | QĐ huỷ bỏ QĐ nhập vụ án hình sự | **draft** | 2 | 2 | 2 |
| BM-089 | QĐ huỷ bỏ QĐ tách vụ án hình sự | **draft** | 1 | 1 | 1 |
| BM-090 | QĐ phê chuẩn QĐ khởi tố bị can | **draft** | 3 | 3 | 3 |
| BM-091 | QĐ phê chuẩn QĐ thay đổi QĐ khởi tố bị can | **draft** | 4 | 4 | 4 |
| BM-092 | QĐ phê chuẩn QĐ bổ sung QĐ khởi tố bị can | **draft** | 4 | 4 | 4 |
| BM-093 | QĐ huỷ bỏ QĐ thay đổi QĐ khởi tố bị can | **draft** | 4 | 4 | 4 |
| BM-094 | QĐ huỷ bỏ QĐ bổ sung QĐ khởi tố bị can | **draft** | 5 | 5 | 5 |
| BM-095 | QĐ huỷ bỏ QĐ huỷ bỏ QĐ khởi tố bị can | **draft** | 4 | 4 | 4 |
| BM-096 | Yêu cầu ra QĐ khởi tố bị can | **draft** | 18 | 14 | 10 |
| BM-097 | QĐ khởi tố bị can | **draft** | 18 | 14 | 10 |
| BM-098 | Yêu cầu ra QĐ thay đổi quyết định khởi tố bị can | **draft** | 3 | 3 | 3 |
| BM-099 | QĐ thay đổi QĐ khởi tố bị can | **draft** | 2 | 2 | 2 |
| BM-100 | Yêu cầu ra QĐ bổ sung QĐ khởi tố bị can | **draft** | 2 | 2 | 2 |
| BM-101 | QĐ bổ sung QĐ khởi tố bị can | **draft** | 5 | 5 | 5 |
| BM-102 | QĐ huỷ bỏ QĐ khởi tố bị can | **draft** | 5 | 5 | 5 |
| BM-103 | Đề nghị gia hạn thời hạn điều tra | **draft** | 3 | 3 | 3 |
| BM-104 | quyết định gia hạn thời hạn điều tra VAHS | **draft** | 2 | 2 | 2 |
| BM-105 | QĐ không gia hạn thời hạn điều tra VAHS | **draft** | 5 | 5 | 5 |
| BM-106 | Yêu cầu truy nã bị can | **draft** | 12 | 8 | 4 |
| BM-107 | QĐ huỷ bỏ QĐ tạm đình chỉ điều tra VAHS | **draft** | 4 | 4 | 4 |
| BM-108 | QĐ huỷ bỏ QĐ tạm đình chỉ điều tra bị can | **draft** | 6 | 6 | 6 |
| BM-109 | QĐ huỷ bỏ QĐ tạm đình chỉ điều tra VAHS đối với bị can | **draft** | 6 | 6 | 6 |
| BM-110 | QĐ huỷ bỏ QĐ đình chỉ điều tra VAHS | **draft** | 4 | 4 | 4 |
| BM-111 | QĐ huỷ bỏ QĐ đình chỉ điều tra bị can | **draft** | 5 | 5 | 5 |
| BM-112 | QĐ huỷ bỏ QĐ đình chỉ điều tra VAHS đối với bị can | **draft** | 6 | 6 | 6 |
| BM-113 | Yêu cầu phục hồi điều tra VAHS | **draft** | 7 | 7 | 7 |
| BM-114 | Yêu cầu phục hồi điều tra bị can | **draft** | 7 | 7 | 7 |
| BM-115 | Yêu cầu phục hồi điều tra VAHS đối với bị can | **draft** | 7 | 7 | 7 |
| BM-116 | QĐ phục hồi điều tra vụ án hình sự | **draft** | 4 | 4 | 4 |
| BM-117 | QĐ phục hồi điều tra bị can | **draft** | 16 | 12 | 8 |
| BM-118 | QĐ phục hồi điều tra VA đối với bị can | **draft** | 16 | 12 | 8 |
| BM-119 | QĐ phê chuẩn Lệnh khám xét | **draft** | 4 | 4 | 4 |
| BM-120 | QĐ không phê chuẩn Lệnh khám xét | **draft** | 2 | 2 | 2 |
| BM-121 | QĐ phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm | **draft** | 2 | 2 | 2 |
| BM-122 | QĐ không phê chuẩn Lệnh thu giữ thư tín, điện tín, bưu kiện, bưu phẩm | **draft** | 1 | 1 | 1 |
| BM-123 | QĐ thực nghiệm điều tra | **draft** | 1 | 1 | 1 |
| BM-124 | Biên bản thực nghiệm điều tra | **draft** | 2 | 2 | 2 |
| BM-125 | Thông báo về việc không chấp nhận đề nghị trưng cầu giám định, định giá tài sản | **draft** | 6 | 6 | 6 |
| BM-126 | QĐ trưng cầu giám định | **draft** | 3 | 3 | 3 |
| BM-127 | Yêu cầu định giá tài sản | **draft** | 4 | 4 | 4 |
| BM-128 | Thông báo nội dung kết luận giám định, định giá tài sản | **draft** | 7 | 7 | 7 |
| BM-129 | QĐ trưng cầu giám định bổ sung | **draft** | 2 | 2 | 2 |
| BM-130 | QĐ trưng cầu giám định lại | **draft** | 4 | 4 | 4 |
| BM-131 | Yêu cầu định giá lại tài sản | **draft** | 5 | 5 | 5 |
| BM-132 | QĐ định giá lại tài sản trong trường hợp đặc biệt | **draft** | 3 | 3 | 3 |
| BM-133 | QĐ giám định lại trong trường hợp đặc biệt | **draft** | 5 | 5 | 5 |
| BM-134 | BB ghi lời khai | **draft** | 16 | 12 | 8 |
| BM-135 | BB hỏi cung bị can | **draft** | 18 | 14 | 10 |
| BM-136 | BB đối chất | **draft** | 26 | 14 | 10 |
| BM-137 | Biên bản xác minh-làm việc | **draft** | 17 | 13 | 9 |
| BM-138 | Yêu cầu cung cấp tài liệu liên quan đến hành vi, QĐ tố tụng có vi phạm pháp luật trong điều tra | **draft** | 8 | 8 | 8 |
| BM-139 | Kiến nghị khắc phục vi phạm trong hoạt động khởi tố, điều tra | **draft** | 5 | 5 | 5 |
| BM-140 | Kiến nghị áp dụng biện pháp phòng ngừa tội phạm và vi phạm pháp luật | **draft** | 6 | 6 | 6 |
| BM-141 | QĐ chuyển vụ án để truy tố | **draft** | 4 | 4 | 4 |
| BM-142 | Quyết định nhập vụ án hình sự trong giai đoạn truy tố | **draft** | 3 | 3 | 3 |
| BM-143 | Quyết định tách vụ án hình sự trong giai đoạn truy tố | **draft** | 1 | 1 | 1 |
| BM-144 | QĐ gia hạn thời hạn QĐ việc truy tố | **draft** | 4 | 4 | 4 |
| BM-145 | QĐ trả hồ sơ vụ án để điều tra bổ sung | **draft** | 10 | 10 | 10 |
| BM-146 | QĐ tạm đình chỉ vụ án | **draft** | 9 | 9 | 9 |
| BM-147 | QĐ huỷ bỏ QĐ tạm đình chỉ vụ án | **draft** | 4 | 4 | 4 |
| BM-148 | QĐ tạm đình chỉ vụ án đối với bị can | **draft** | 14 | 10 | 6 |
| BM-149 | QĐ huỷ bỏ QĐ tạm đình chỉ vụ án đối với bị can | **draft** | 6 | 6 | 6 |
| BM-150 | QĐ đình chỉ vụ án | **draft** | 3 | 3 | 3 |
| BM-151 | QĐ huỷ bỏ QĐ đình chỉ vụ án | **draft** | 3 | 3 | 3 |
| BM-152 | QĐ đình chỉ vụ án đối với bị can | **draft** | 16 | 12 | 8 |
| BM-153 | QĐ huỷ bỏ QĐ đình chỉ vụ án đối với bị can | **draft** | 5 | 5 | 5 |
| BM-154 | QĐ phục hồi vụ án | **draft** | 7 | 7 | 7 |
| BM-155 | QĐ phục hồi vụ án đối với bị can | **draft** | 18 | 14 | 10 |
| BM-156 | Cáo trạng | **draft** | 11 | 11 | 11 |
| BM-157 | Bản kê vật chứng kèm theo Cáo trạng | **draft** | 1 | 1 | 1 |
| BM-158 | Danh sách đề nghị triệu tập đến phiên tòa | **draft** | 14 | 13 | 12 |
| BM-159 | QĐ phân công VKS cấp dưới THQCT, KS xét xử VAHS | **draft** | 6 | 6 | 6 |
| BM-160 | Biên bản niêm yết công khai văn bản tố tụng | **draft** | 2 | 2 | 2 |
| BM-161 | Phiếu yêu cầu trích xuất | **draft** | 16 | 12 | 8 |
| BM-162 | Giấy mời | **draft** | 5 | 5 | 5 |
| BM-163 | Giấy triệu tập | **draft** | 5 | 5 | 5 |
| BM-164 | BB giao nhận Cáo trạng, QĐ truy tố theo thủ tục rút gọn, QĐ tạm đình chỉ vụ án, đình chỉ vụ án | **draft** | 15 | 11 | 7 |
| BM-165 | Thông báo về việc vụ án có bị can bị tạm giam | **draft** | 1 | 1 | 1 |
| BM-166 | QĐ trả hồ sơ vụ án để điều tra lại | **draft** | 4 | 4 | 4 |
| BM-167 | Thông báo về việc trả hồ sơ, ban hành cáo trạng | **draft** | 33 | 29 | 27 |
| BM-168 | BB giao nhận hồ sơ vụ án, vụ việc | **draft** | 3 | 3 | 3 |
| BM-169 | QĐ xử lý vật chứng | **draft** | 6 | 6 | 6 |
| BM-170 | QĐ huỷ bỏ QĐ xử lý vật chứng | **draft** | 3 | 3 | 3 |
| BM-171 | QĐ trả lại tài sản | **draft** | 14 | 10 | 6 |
| BM-172 | QĐ huỷ bỏ QĐ trả lại tài sản | **draft** | 13 | 9 | 5 |
| BM-173 | QĐ chuyển vật chứng | **draft** | 6 | 6 | 6 |
| BM-174 | Yêu cầu áp dụng biện pháp điều tra tố tụng đặc biệt | **draft** | 17 | 13 | 9 |
| BM-175 | QĐ phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt | **draft** | 4 | 4 | 4 |
| BM-176 | QĐ không phê chuẩn QĐ áp dụng biện pháp điều tra tố tụng đặc biệt | **draft** | 8 | 8 | 8 |
| BM-177 | QĐ gia hạn thời hạn áp dụng biện pháp điều tra tố tụng đặc biệt | **draft** | 3 | 3 | 3 |
| BM-178 | QĐ huỷ bỏ QĐ áp dụng biện pháp điều tra tố tụng đặc biệt | **draft** | 4 | 4 | 4 |
| BM-179 | QĐ áp dụng biện pháp chữa bệnh | **draft** | 14 | 10 | 6 |
| BM-180 | QĐ đình chỉ thi hành biện pháp bắt buộc chữa bệnh | **draft** | 16 | 12 | 8 |
| BM-181 | QĐ áp dụng thủ tục rút gọn | **draft** | 5 | 5 | 5 |
| BM-182 | QĐ huỷ bỏ QĐ áp dụng thủ tục rút gọn 1 | **draft** | 3 | 3 | 3 |
| BM-183 | QĐ truy tố theo thủ tục rút gọn | **draft** | 8 | 8 | 8 |
| BM-184 | Đề nghị áp dụng biện pháp bảo vệ | **draft** | 22 | 18 | 14 |
| BM-185 | Yêu cầu lập Báo cáo điều tra xã hội bổ sung | **draft** | 2 | 2 | 2 |
| BM-186 | Thông báo áp dụng thủ tục xử lý chuyển hướng | **draft** | 17 | 13 | 9 |
| BM-187 | Yêu cầu NLCTXH xây dựng kế hoạch XLCH hoặc kế hoạch XLCH bổ sung | **draft** | 15 | 11 | 7 |
| BM-188 | Đề nghị Tòa án giải quyết vấn đề bồi thường thiệt hại | **draft** | 16 | 12 | 8 |
| BM-189 | Yêu cầu CQĐT đề nghị TA xem xét áp dụng biện pháp giáo dục tại trường giáo dưỡng | **draft** | 16 | 12 | 8 |
| BM-190 | Đề nghị Tòa án xem xét, quyết định áp dụng biện pháp giáo dục tại trường giáo dưỡng | **draft** | 17 | 15 | 11 |
| BM-191 | Quyết định áp dụng biện pháp xử lý chuyển hướng tại cộng đồng | **draft** | 20 | 16 | 12 |
| BM-192 | Quyết định không áp dụng biện pháp xử lý chuyển hướng tại cộng đồng | **draft** | 19 | 15 | 11 |
| BM-193 | Quyết định thay đổi biện pháp xử lý chuyển hướng tại cộng đồng | **draft** | 18 | 14 | 10 |
| BM-194 | Quyết định hủy bỏ quyết định áp dụng biện pháp xử lý chuyển hướng | **draft** | 2 | 2 | 2 |
| BM-195 | Quyết định hủy bỏ quyết định không áp dụng biện pháp xử lý chuyển hướng | **draft** | 2 | 2 | 2 |
| BM-196 | Quyết định mở phiên họp xem xét, áp dụng biện pháp xử lý chuyển hướng tại cộng đồng - Copy | **draft** | 20 | 16 | 12 |
| BM-197 | BB phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng | **draft** | 1 | 1 | 1 |
| BM-198 | Quyết định hoãn phiên họp xem xét, quyết định áp dụng BPXLCH tại cộng đồng - Copy - Copy | **draft** | 4 | 4 | 4 |
| BM-199 | Kiến nghị về quyết định áp dụng BPXLCH của Tòa án - Copy | **draft** | 16 | 12 | 8 |
| BM-200 | Thông báo tiếp nhận khiếu nại, kiến nghị cân nhắc tính cần thiết | **draft** | 2 | 2 | 2 |
| BM-201 | Quyết định giải quyết khiếu nại, kiến nghị | **draft** | 16 | 12 | 8 |
| BM-202 | Quyết định đình chỉ việc giải quyết khiếu nại, kiến nghị | **draft** | 4 | 4 | 4 |
| BM-203 | Thông báo về hoạt động tố tụng | **draft** | 19 | 15 | 11 |
| BM-204 | QĐ việc tham gia tố tụng của người đại diện, tổ chức | **draft** | 13 | 9 | 5 |
| BM-205 | Thông báo áp dụng biện pháp ngăn chặn đối với NCTN | **draft** | 15 | 11 | 7 |
| BM-206 | Quyết định áp dụng biện pháp giám sát điện tử đối với NCTN - Copy | **draft** | 16 | 12 | 8 |
| BM-207 | Quyết định phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN | **draft** | 17 | 13 | 9 |
| BM-208 | Quyết định không phê chuẩn quyết định áp dụng biện pháp giám sát điện tử đối với NCTN | **draft** | 17 | 13 | 9 |
| BM-209 | Quyết định áp dụng biện pháp giám sát bởi người đại diện | **draft** | 17 | 16 | 13 |
| BM-210 | Quyết định thay đổi người đại diện | **draft** | 16 | 12 | 8 |
| BM-211 | Thông báo về việc thụ lý vụ án | **draft** | 18 | 14 | 10 |
| BM-212 | Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho người chưa thành niên | **draft** | 14 | 10 | 6 |
| BM-213 | Yêu cầu áp dụng các biện pháp kỹ thuật để bảo vệ NCTN | **draft** | 14 | 10 | 6 |

## Forms by stage

### Stage 00 — Không xác định

**Locked** (runtime-eligible): BM-001, BM-002, BM-003
**Draft** (needs human review): BM-001, BM-002, BM-003, BM-004, BM-005, BM-006, BM-007, BM-008, BM-009

### Stage 01 — TIẾP NHẬN VÀ GIẢI QUYẾT NGUỒN TIN

**Draft** (needs human review): BM-010, BM-011, BM-012, BM-013, BM-014, BM-015, BM-016, BM-017, BM-018, BM-019

### Stage 02 — BIỆN PHÁP NGĂN CHẶN, CƯỠNG CHẾ

**Draft** (needs human review): BM-020, BM-021, BM-022, BM-023, BM-024, BM-025, BM-026, BM-027, BM-028, BM-029

### Stage 03 — NGƯỜI THAM GIA TỐ TỤNG

**Draft** (needs human review): BM-030, BM-031, BM-032, BM-033, BM-034, BM-035, BM-036, BM-037, BM-038, BM-039

### Stage 04 — GIAI ĐOẠN ĐIỀU TRA

**Draft** (needs human review): BM-040, BM-041, BM-042, BM-043, BM-044, BM-045, BM-046, BM-047, BM-048, BM-049

### Stage 05 — GIAI ĐOẠN TRUY TỐ

**Draft** (needs human review): BM-050, BM-051, BM-052, BM-053, BM-054, BM-055, BM-056, BM-057, BM-058, BM-059

### Stage 06 — VẬT CHỨNG

**Draft** (needs human review): BM-060, BM-061, BM-062, BM-063, BM-064, BM-065, BM-066, BM-067, BM-068, BM-069

### Stage 07 — BIỆN PHÁP ĐIỀU TRA ĐẶC BIỆT

**Draft** (needs human review): BM-070, BM-071, BM-072, BM-073, BM-074, BM-075, BM-076, BM-077, BM-078, BM-079

### Stage 08 — THỦ TỤC ĐẶC BIỆT

**Draft** (needs human review): BM-080, BM-081, BM-082, BM-083, BM-084, BM-085, BM-086, BM-087, BM-088, BM-089

### Stage 09 — NGƯỜI CHƯA THÀNH NIÊN

**Draft** (needs human review): BM-090, BM-091, BM-092, BM-093, BM-094, BM-095, BM-096, BM-097, BM-098, BM-099

### Stage 10 — Không xác định

**Draft** (needs human review): BM-100, BM-101, BM-102, BM-103, BM-104, BM-105, BM-106, BM-107, BM-108, BM-109

### Stage 11 — Không xác định

**Draft** (needs human review): BM-110, BM-111, BM-112, BM-113, BM-114, BM-115, BM-116, BM-117, BM-118, BM-119

### Stage 12 — Không xác định

**Draft** (needs human review): BM-120, BM-121, BM-122, BM-123, BM-124, BM-125, BM-126, BM-127, BM-128, BM-129

### Stage 13 — Không xác định

**Draft** (needs human review): BM-130, BM-131, BM-132, BM-133, BM-134, BM-135, BM-136, BM-137, BM-138, BM-139, BM-139

### Stage 14 — Không xác định

**Draft** (needs human review): BM-140, BM-141, BM-142, BM-143, BM-144, BM-145, BM-146, BM-147, BM-148, BM-149

### Stage 15 — Không xác định

**Draft** (needs human review): BM-150, BM-151, BM-152, BM-153, BM-154, BM-155, BM-156, BM-157, BM-158, BM-159

### Stage 16 — Không xác định

**Draft** (needs human review): BM-160, BM-161, BM-162, BM-163, BM-164, BM-165, BM-166, BM-167, BM-168, BM-169

### Stage 17 — Không xác định

**Draft** (needs human review): BM-170, BM-171, BM-172, BM-173, BM-174, BM-175, BM-176, BM-177, BM-178, BM-179

### Stage 18 — Không xác định

**Draft** (needs human review): BM-180, BM-181, BM-182, BM-183, BM-184, BM-185, BM-186, BM-187, BM-188, BM-189

### Stage 19 — Không xác định

**Draft** (needs human review): BM-190, BM-191, BM-192, BM-193, BM-194, BM-195, BM-196, BM-197, BM-198, BM-199

### Stage 20 — Không xác định

**Draft** (needs human review): BM-200, BM-201, BM-202, BM-203, BM-204, BM-205, BM-206, BM-207, BM-208, BM-209

### Stage 21 — Không xác định

**Draft** (needs human review): BM-210, BM-211, BM-212, BM-213
