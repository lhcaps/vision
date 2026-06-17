# Failure Log

> The agent appends here whenever it (or a sub-agent) fails a task.
> The `failure-log` skill governs what to record.
> Format: most recent entry first.

<!--
## YYYY-MM-DD
**Request**: <one-line user request>
**What I tried**: <one-line summary>
**Root cause**: <one-line diagnosis>
**Skill that should have caught it**: <skill-id>
**Fix**: <what I changed in that skill, or in the bundle>
-->

## 2026-06-17
**Request**: User phàn nàn dự án "1 cái vỏ" — UI render nhưng báo "Chưa có hồ sơ" dù tính năng đã code đầy đủ.
**What I tried**: Đọc schema, seed.ts, schema.prisma, smoke test API + 7 trang web qua Playwright.
**Root cause**: `seed.ts` chính chỉ tạo agency + admin + 2 wards + 30 offenses + 4 template_groups + N templates đã implement. KHÔNG seed cases/people/assignments/evidence/generated_documents. Do đó `/cases` (0), `/document-review-queue` (0), `/templates` (chỉ có 0 document nên "Không có biểu mẫu phù hợp"). Code UI hoàn toàn đúng, không có lỗi.
**Skill that should have caught it**: `intake` không tồn tại (file `.ai/harness/project-intake.md` không được tạo), `debug` cũng không — vì request thật ra là audit thay vì fix bug.
**Fix**: Viết `apps/api/prisma/seed-demo-cases.ts` (idempotent, dữ liệu thật cho 5 vụ án trải đủ 3 giai đoạn + 10 people + 11 documents) và `tests/e2e/verify-after-seed.spec.ts` (Playwright test assert UI render đúng). Tạo `.ai/harness/project-intake.md` để intake thật cho project này, tránh quên lần sau.

