# Slot Coverage Summary

Sinh lúc: 2026-06-19T01:19:41.654Z

## Phạm vi verify

- ✅ **Structural verification**: schema hợp lệ, slotId duy nhất, renderBinding trỏ tới slot tồn tại, namespace trong field-taxonomy, source trong source-taxonomy, transform trong transform-taxonomy.
- ❌ **Semantic / legal verification**: KHÔNG thuộc phạm vi pipeline này. Reviewer phải đọc DOCX đối chiếu.
- ❌ **Locked contract count**: Hiện tại = 0. Nghĩa là **không có contract nào pass strict semantic review**.
- ⚠️ **Unknown sources**: 100% canonicalField đang `source=unknown` (chờ reviewer quyết định từng field thuộc nguồn nào).
- ⚠️ **Review-required**: 100% slot+field+binding đang `reviewRequired=true` (chờ reviewer xác nhận).

> Kết luận: Mọi số liệu dưới đây mô tả **structure của draft contract**, không phải sự đúng đắn về pháp lý/nghiệp vụ.

> **Không có contract locked.** Kết quả này chỉ xác nhận cấu trúc draft, không xác nhận đúng với DOCX về mặt nghiệp vụ/pháp lý. Không dùng để khẳng định contract đã pass verification.

## Tổng quan

- Tổng contract (form, KHÔNG tính reference docs): **214**
- Tổng docxSlots: **2102**
- Tổng renderBindings: **2102**
- Tổng canonicalFields có source=unknown: **1624**
- Tổng reviewRequired (slot+field+binding): **5828**
- Tổng slot thiếu binding: **0**
- Contract locked: **0** | draft: **214**
- Tổng issues (strict structural): **0**
- Tổng warnings (best-effort structural): **0**
- Locked contract invalid: **0** (sẽ thoát non-zero)

## Per BM

| SourceId | BM | Status | Slots | Bound | Unknown source | Review required | Missing binding | Issues | Warnings |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| BM-001__f4c2aa3682d3 | BM-001 | draft | 31 | 31 | 24 | 86 | 0 | 0 | 0 |
| BM-002__f78301178da7 | BM-002 | draft | 24 | 24 | 17 | 65 | 0 | 0 | 0 |
| BM-003__bb64990bc49b | BM-003 | draft | 8 | 8 | 8 | 24 | 0 | 0 | 0 |
| BM-004__2775520fd22c | BM-004 | draft | 7 | 7 | 7 | 21 | 0 | 0 | 0 |
| BM-005__4cf240724a90 | BM-005 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-006__87ff96f9a866 | BM-006 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-007__549970d471d1 | BM-007 | draft | 8 | 8 | 8 | 24 | 0 | 0 | 0 |
| BM-008__87981f1c5cf8 | BM-008 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-009__ad542fd7bc45 | BM-009 | draft | 12 | 12 | 12 | 36 | 0 | 0 | 0 |
| BM-010__3814cd2b4bcf | BM-010 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-011__26e6e688d223 | BM-011 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-012__7733d5ac8e86 | BM-012 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-013__9a1f7d37fec9 | BM-013 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-014__ff318bb91779 | BM-014 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-015__08f17df338d2 | BM-015 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-016__565ec1fc2103 | BM-016 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-017__6b3cad999c61 | BM-017 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-018__fe8c39468552 | BM-018 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-019__3c2858f47dad | BM-019 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-020__0f61c04c750d | BM-020 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-021__772319486f41 | BM-021 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-022__13d342bdfc56 | BM-022 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-023__78e4f3906e4c | BM-023 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-024__575a6d8e9173 | BM-024 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-025__5dcf0eb7f481 | BM-025 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-026__6e339663e320 | BM-026 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-027__7c207d24faee | BM-027 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-028__e895e0889340 | BM-028 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-029__0bf65fba614a | BM-029 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-030__0cfa7ae4b177 | BM-030 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-031__ec3276d1eebe | BM-031 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-032__cce50086cd38 | BM-032 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-033__51058a699877 | BM-033 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-034__e02f842b6038 | BM-034 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-035__be0035952622 | BM-035 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-036__6f4466480a94 | BM-036 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-037__1fa31d43251e | BM-037 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-038__7a37ca9c9d8e | BM-038 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-039__733f9ddd4783 | BM-039 | draft | 20 | 20 | 13 | 53 | 0 | 0 | 0 |
| BM-040__aab092911088 | BM-040 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-041__9a027eeceb3a | BM-041 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-042__a4da3c74d437 | BM-042 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-043__8eab35cfeedb | BM-043 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-044__8552b13c78ff | BM-044 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-045__13efe0d94756 | BM-045 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-046__501a15f0fbb7 | BM-046 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-047__ec7dc3448f91 | BM-047 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-048__724a5a8b3421 | BM-048 | draft | 18 | 18 | 11 | 47 | 0 | 0 | 0 |
| BM-049__798e9b21ce2e | BM-049 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-050__2d31c941887e | BM-050 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-051__594c6c63b397 | BM-051 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-052__9919ecdb3971 | BM-052 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-053__0a5a43238f28 | BM-053 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-054__71a4c9ac7e0e | BM-054 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-055__b1819db1f92b | BM-055 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-056__eea9a3391f5f | BM-056 | draft | 20 | 20 | 13 | 53 | 0 | 0 | 0 |
| BM-057__9053c61ee677 | BM-057 | draft | 21 | 21 | 14 | 56 | 0 | 0 | 0 |
| BM-058__6de8f0022bff | BM-058 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-059__4cdec41fdb1d | BM-059 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-060__55a252b4f98f | BM-060 | draft | 26 | 26 | 17 | 69 | 0 | 0 | 0 |
| BM-061__ec44550246e9 | BM-061 | draft | 18 | 18 | 11 | 47 | 0 | 0 | 0 |
| BM-062__110961a781fa | BM-062 | draft | 27 | 27 | 20 | 74 | 0 | 0 | 0 |
| BM-063__54b73110a34f | BM-063 | draft | 27 | 27 | 20 | 74 | 0 | 0 | 0 |
| BM-064__4d8cebc3515b | BM-064 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-065__4a64c8d7e96c | BM-065 | draft | 21 | 21 | 14 | 56 | 0 | 0 | 0 |
| BM-066__e3bc56081554 | BM-066 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-067__0f7607122f29 | BM-067 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-068__6c1275cc752e | BM-068 | draft | 31 | 31 | 24 | 86 | 0 | 0 | 0 |
| BM-069__3a67d1a2e298 | BM-069 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-070__e63499f6fc20 | BM-070 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-071__cacf3f480888 | BM-071 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-072__fadb53cde2cb | BM-072 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-073__e412fccad227 | BM-073 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-074__e7b3ef2ccb68 | BM-074 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-075__dc493cfb5fd3 | BM-075 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-076__cd44ed3c7e5d | BM-076 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-077__99d7843f9f9e | BM-077 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-078__6845bd7e6cb1 | BM-078 | draft | 17 | 17 | 10 | 44 | 0 | 0 | 0 |
| BM-079__80698c347564 | BM-079 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-080__a7aa64d4b889 | BM-080 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-081__232b8c1d66ae | BM-081 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-082__44cc2b043383 | BM-082 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-083__71218955a7c2 | BM-083 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-084__c21e2b7fa5cc | BM-084 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-085__ae0054d1db43 | BM-085 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-086__df834c030dc6 | BM-086 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-087__80e8edb6b8b2 | BM-087 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-088__d9d213d94690 | BM-088 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-089__9d0d4280c6a1 | BM-089 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-090__1c7858168558 | BM-090 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-091__18a41431ecae | BM-091 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-092__f8ca4bc8033d | BM-092 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-093__7273ce5a66b8 | BM-093 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-094__12ad016b36d2 | BM-094 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-095__83c3c1ef212f | BM-095 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-096__a50a08efa62f | BM-096 | draft | 24 | 24 | 17 | 65 | 0 | 0 | 0 |
| BM-097__17f981bf5afd | BM-097 | draft | 24 | 24 | 17 | 65 | 0 | 0 | 0 |
| BM-098__949d75027001 | BM-098 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-099__ce4aa505a071 | BM-099 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-100__a359d20c8fed | BM-100 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-101__2fe2187f4777 | BM-101 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-102__88bde5060df8 | BM-102 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-103__665eb32a5626 | BM-103 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-104__6d6f5903cad3 | BM-104 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-105__c83181e6b64b | BM-105 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-106__7f44c9dd261a | BM-106 | draft | 18 | 18 | 11 | 47 | 0 | 0 | 0 |
| BM-107__9b3379af7cfe | BM-107 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-108__baea4e0f603e | BM-108 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-109__0fe502079a3e | BM-109 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-110__a1f991fed29c | BM-110 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-111__33851c577165 | BM-111 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-112__109c846bbe17 | BM-112 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-113__2651c6185250 | BM-113 | draft | 7 | 7 | 7 | 21 | 0 | 0 | 0 |
| BM-114__84cec283ce1b | BM-114 | draft | 7 | 7 | 7 | 21 | 0 | 0 | 0 |
| BM-115__94659bf76001 | BM-115 | draft | 7 | 7 | 7 | 21 | 0 | 0 | 0 |
| BM-116__23c45f530ed1 | BM-116 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-117__c9531f5e460e | BM-117 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-118__7d13f5eae86d | BM-118 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-119__bb054433cbac | BM-119 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-120__e702d429a0f3 | BM-120 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-121__a7983088c6ec | BM-121 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-122__c6efcf63e36a | BM-122 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-123__8aa275f0ac70 | BM-123 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-124__1fca98cb2e90 | BM-124 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-125__77ec214513fb | BM-125 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-126__2d8c3d38368b | BM-126 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-127__582febaeadf0 | BM-127 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-128__8eab646ee06f | BM-128 | draft | 7 | 7 | 7 | 21 | 0 | 0 | 0 |
| BM-129__7fb66a442c28 | BM-129 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-130__9a859e843d48 | BM-130 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-131__91726e55d979 | BM-131 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-132__670b47f0b235 | BM-132 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-133__1f7f12f1a249 | BM-133 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-134__7c1e123c01b0 | BM-134 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-135__79b31ad7511e | BM-135 | draft | 24 | 24 | 17 | 65 | 0 | 0 | 0 |
| BM-136__f7c2e28ddd12 | BM-136 | draft | 38 | 38 | 23 | 99 | 0 | 0 | 0 |
| BM-137__d2c569c61fb7 | BM-137 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-138__bf31a1f547b0 | BM-138 | draft | 8 | 8 | 8 | 24 | 0 | 0 | 0 |
| BM-139__23306e6022bd | BM-139 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-139__9795f14f931c | BM-139 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-140__13e1ade15acd | BM-140 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-141__abc5fb5fb096 | BM-141 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-142__02d373abb354 | BM-142 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-143__7ad54f65b3a0 | BM-143 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-144__720233712d47 | BM-144 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-145__fc22267f4a63 | BM-145 | draft | 10 | 10 | 10 | 30 | 0 | 0 | 0 |
| BM-146__59e5d7e21119 | BM-146 | draft | 9 | 9 | 9 | 27 | 0 | 0 | 0 |
| BM-147__7bf9bc811cad | BM-147 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-148__d4d27bb90141 | BM-148 | draft | 20 | 20 | 13 | 53 | 0 | 0 | 0 |
| BM-149__3990ac4442f1 | BM-149 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-150__d19a8665087c | BM-150 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-151__d3ead7c40b56 | BM-151 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-152__d28f03a3f72b | BM-152 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-153__829ed04c824a | BM-153 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-154__618d13a959ca | BM-154 | draft | 7 | 7 | 7 | 21 | 0 | 0 | 0 |
| BM-155__d89766f2092a | BM-155 | draft | 24 | 24 | 17 | 65 | 0 | 0 | 0 |
| BM-156__ef438a40e567 | BM-156 | draft | 11 | 11 | 11 | 33 | 0 | 0 | 0 |
| BM-157__a5c6971a69d2 | BM-157 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-158__7a98055a3e9c | BM-158 | draft | 2 | 2 | 1 | 5 | 0 | 0 | 0 |
| BM-159__d95eb7bda8e3 | BM-159 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-160__2f8e7c014448 | BM-160 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-161__5c910ef4adf5 | BM-161 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-162__6e7e16348066 | BM-162 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-163__61941122b9e4 | BM-163 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-164__04fa37dd8384 | BM-164 | draft | 21 | 21 | 14 | 56 | 0 | 0 | 0 |
| BM-165__d391dc4d1ffb | BM-165 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-166__d0762a0ffb28 | BM-166 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-167__70817b325370 | BM-167 | draft | 5 | 5 | 1 | 11 | 0 | 0 | 0 |
| BM-168__3369df5870b2 | BM-168 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-169__b737aefc0c16 | BM-169 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-170__c8f50b0e9f5b | BM-170 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-171__46b9a8be4e01 | BM-171 | draft | 20 | 20 | 13 | 53 | 0 | 0 | 0 |
| BM-172__e3a3eb687d2f | BM-172 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-173__2e06ac25958d | BM-173 | draft | 6 | 6 | 6 | 18 | 0 | 0 | 0 |
| BM-174__f8e45c638bb6 | BM-174 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-175__6d3f2b46283d | BM-175 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-176__8f1b057e17a7 | BM-176 | draft | 8 | 8 | 8 | 24 | 0 | 0 | 0 |
| BM-177__05be0ed97398 | BM-177 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-178__7f2719dcacc7 | BM-178 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-179__186c49575a2e | BM-179 | draft | 20 | 20 | 13 | 53 | 0 | 0 | 0 |
| BM-180__d608f62a685a | BM-180 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-181__ec1d8701fc13 | BM-181 | draft | 5 | 5 | 5 | 15 | 0 | 0 | 0 |
| BM-182__95dc6d1f57ab | BM-182 | draft | 3 | 3 | 3 | 9 | 0 | 0 | 0 |
| BM-183__294fc847169f | BM-183 | draft | 8 | 8 | 8 | 24 | 0 | 0 | 0 |
| BM-184__fb1c01087fa5 | BM-184 | draft | 28 | 28 | 21 | 77 | 0 | 0 | 0 |
| BM-185__69c976088827 | BM-185 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-186__84cb2023273b | BM-186 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-187__e47644149068 | BM-187 | draft | 21 | 21 | 14 | 56 | 0 | 0 | 0 |
| BM-188__cb14348d184c | BM-188 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-189__70da8df0a0da | BM-189 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-190__36fb96ee1a73 | BM-190 | draft | 20 | 20 | 15 | 55 | 0 | 0 | 0 |
| BM-191__11335dc18806 | BM-191 | draft | 26 | 26 | 19 | 71 | 0 | 0 | 0 |
| BM-192__42db503bed2a | BM-192 | draft | 25 | 25 | 18 | 68 | 0 | 0 | 0 |
| BM-193__e24862458ecb | BM-193 | draft | 24 | 24 | 17 | 65 | 0 | 0 | 0 |
| BM-194__946009a4f0e0 | BM-194 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-195__0b409423eb38 | BM-195 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-196__0c6aec084a26 | BM-196 | draft | 26 | 26 | 19 | 71 | 0 | 0 | 0 |
| BM-197__37dda9913570 | BM-197 | draft | 1 | 1 | 1 | 3 | 0 | 0 | 0 |
| BM-198__269efb9590af | BM-198 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-199__e4724bd967ad | BM-199 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-200__d340f628394e | BM-200 | draft | 2 | 2 | 2 | 6 | 0 | 0 | 0 |
| BM-201__2d0aab05928d | BM-201 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-202__0c74f6ae9727 | BM-202 | draft | 4 | 4 | 4 | 12 | 0 | 0 | 0 |
| BM-203__7572e687ae0f | BM-203 | draft | 25 | 25 | 18 | 68 | 0 | 0 | 0 |
| BM-204__f334b93daabe | BM-204 | draft | 19 | 19 | 12 | 50 | 0 | 0 | 0 |
| BM-205__e6427663d551 | BM-205 | draft | 21 | 21 | 14 | 56 | 0 | 0 | 0 |
| BM-206__83dd8f078d92 | BM-206 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-207__34a77bfcbd63 | BM-207 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-208__93ee4a40d673 | BM-208 | draft | 23 | 23 | 16 | 62 | 0 | 0 | 0 |
| BM-209__2547ef797798 | BM-209 | draft | 20 | 20 | 17 | 57 | 0 | 0 | 0 |
| BM-210__7266a312afb8 | BM-210 | draft | 22 | 22 | 15 | 59 | 0 | 0 | 0 |
| BM-211__ff91d4c3b4e0 | BM-211 | draft | 24 | 24 | 17 | 65 | 0 | 0 | 0 |
| BM-212__b1bab1e5a854 | BM-212 | draft | 20 | 20 | 13 | 53 | 0 | 0 | 0 |
| BM-213__33383be18132 | BM-213 | draft | 20 | 20 | 13 | 53 | 0 | 0 | 0 |

## Per-BM coverage files
