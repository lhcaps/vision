# Project Intake — QUANLYVKS

> Filled during audit on 2026-06-17. Update khi dự án đổi hình dạng (stack mới, deploy mới, team mới).

## 1. Identity

- **Project name**: QUANLYVKS (QUANLYNOIBOVKS) — Hệ thống quản lý hồ sơ vụ án VKS
- **One-line description**: Hệ thống quản lý hồ sơ vụ án và tự động hoá biểu mẫu (theo Thông tư 03/2026-VKSTC) cho Viện Kiểm sát nhân dân.
- **Domain**: fullstack web (backend + frontend + DB)
- **Owner**: study project (`d:\Study\Project\QLLaw-main`), chưa có team thật
- **Repo URL**: local
- **Maturity**: prototype (đã có code chạy, đang mở rộng template & data)

## 2. Stack

- **Language(s)**: TypeScript (Node 20+)
- **Framework(s)**:
  - Backend: NestJS 11 (controllers, services, Prisma adapter mariadb)
  - Frontend: Next.js 16.2.5 (App Router, React 19.2.4)
  - ORM: Prisma 6.19.3 + `@prisma/adapter-mariadb` + `mariadb` driver
- **Build / package manager**: pnpm workspace (`pnpm-workspace.yaml`), Node >= 20, pnpm >= 10
- **Test runner**:
  - Backend: Jest (`pnpm --filter api test`)
  - E2E: Playwright (`tests/e2e/*.spec.ts`, `playwright.config.ts`, baseURL `http://localhost:3000`)
- **Linter / formatter**: ESLint 9 + Prettier 3, `pnpm --filter web lint` / `pnpm --filter api lint`. **Lưu ý: repo có nợ kỹ thuật lint cũ (nhiều `react-hooks/set-state-in-effect`, `no-unsafe-assignment`, `no-base-to-string`, spec files bị tsconfig project service báo "not found"). KHÔNG chặn build hay test; KHÔNG được sửa hàng loạt trong cùng 1 task — fix theo từng cụm có lý do.**
- **CI**: chưa có
- **Deploy target**: dev local (MariaDB 11 docker, port 3307). Có `docker-compose.prod.yml` & `Start-QUANLYVKS.ps1` cho Windows.

## 3. Operating model

- **Who edits this repo**: 1 người dùng (study) + AI agent
- **Review process**: user đọc Summary/Reports của agent cuối mỗi turn
- **Release cadence**: ad-hoc
- **On-call / pager**: không

## 4. Conventions the agent must follow

- **Workspace rules**: đọc `.harness/manifest.yaml` + `.ai/harness/project_failure-log.md` (3 entry gần nhất) trước mỗi task
- **CLI dependency-free**: KHÔNG thêm `js-yaml`, `chalk`, `commander` vào CLI. Custom YAML parser `cli/lib/yaml.mjs` — nếu cần feature, extend parser đó.
- **Coding style**: xem `.cursor/rules/10-coding-style.mdc` (tên intent, narrow types, errors-are-values, comments explain why, no narrating comments).
- **Safety**: `.cursor/rules/20-safety.mdc` — không commit secret, không `rm -rf`, không bypass hooks, không hardcode credential ngoài `.env`.
- **Tooling**: `.cursor/rules/30-tooling.mdc` — 1 commit = 1 logical change, lint+test trước commit, ripgrep ưu tiên hơn find/grep, không tắt lint rule inline.
- **Code style enforcement**: docstrings ngắn cho public, prefer modules & free functions, no `any` (dùng `unknown` + narrow).

## 5. Constraints

- **Compliance**: n/a (offline dev)
- **Performance budgets**: n/a
- **Browser / device support**: dev trên Chromium (Playwright), Tailwind 4
- **Forbidden dependencies**: js-yaml/chalk/commander trong CLI; ngược lại thêm dependency mới phải hỏi user trước
- **DB**: MariaDB 11 docker. Migrations ở `apps/api/prisma/migrations/`. SQL init ở `database/`.

## 6. AI usage

- **What AI is used for here**:
  - Generate form components (130+ BM-XXX-form-inputs.tsx theo Thông tư 03/2026-VKSTC)
  - Generate Prisma schema từ MySQL gốc (`prisma:pull`)
  - Generate biểu mẫu chọn (`template-selector-workspace.tsx` — scoring 217 templates)
  - Seed data nghiệp vụ (offenses, agencies, wards, templates)
- **What AI must NOT do here**:
  - Không được tạo thêm biểu mẫu pháp lý mới nếu user chưa chỉ định mã BM
  - Không sửa mass các lỗi lint có sẵn (xem §2 Linter)
  - Không thay đổi `apps/api/prisma/schema.prisma` khi chưa hỏi (regenerate = data loss risk)
- **Eval set location**: `tests/e2e/*.spec.ts` (smoke, screenshot, verify-after-seed)

## 7. Open questions

- User muốn "triển khai 10 BM cần thiết" nhưng chưa chỉ định 10 mã nào. Đề xuất (xem prompt cũ): BM-023, BM-090, BM-097, BM-058, BM-059, BM-053, BM-054, BM-156, BM-070, BM-071.
- File `.env` chứa `MARIADB_PASSWORD=change-me` (an toàn cho dev). Cần đổi trước khi deploy thật.
- Folder `docs/` chứa file `.docx` ~1.95 MB không liên quan (`Yêu cầu dự án QUANLYNOIBOVKS.docx`) — nên move ra khỏi repo.

## 8. Known data fixtures (sau audit 2026-06-17)

- **Admin**: username `admin`, password `admin123`, full_name `Admin`, role `ADMIN`, agency `VKS-DEFAULT`.
- **Templates**: 126 BM codes đã seed (auto-detect từ `bm-XXX-form-inputs.tsx` + `vks-template-catalog.ts`).
- **Wards**: 2 (Phường Bến Nghé Q1, Phường Nguyễn Cư Trinh Q1).
- **Offenses**: 30 tội danh BLHS 2015.
- **Cases demo**: 5 vụ án (`VKS-2026-0001..0005`) — seed bằng `apps/api/prisma/seed-demo-cases.ts` (idempotent). Có people, assignments, evidence, generated_documents (BM-001, BM-023, BM-053, BM-058, BM-090, BM-097, BM-156).
- **Storage path**: `./storage` (theo `STORAGE_ROOT` trong `.env`).
