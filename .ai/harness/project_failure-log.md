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
**Request**: Audit brutal report: document-renderer.service.ts rỗng, Docker entrypoint dist/main.js sai path, Swagger không có guard production.
**What I tried**: Verified actual file contents and build output.
**Root cause**: (1) document-renderer.service.ts có 33,599 dòng — audit báo rỗng là nhầm. (2) Dockerfile CMD và docker-compose.prod.yml command cùng dùng dist/main.js trong khi tsconfig outDir=dist + rootDir=. tạo output dist/src/main.js. (3) SwaggerModule.setup() không có production guard.
**Skill that should have caught it**: audit — cần verify bằng build thực thay vì chỉ grep.
**Fix**: (1) Xác nhận service không rỗng, không cần restore. (2) Sửa Dockerfile CMD thành dist/src/main.js, docker-compose.prod.yml command thành apps/api/dist/src/main.js. (3) Thêm production guard cho Swagger (chỉ bật khi NODE_ENV != production hoặc SWAGGER_ENABLED=true). (4) Thêm production fail-fast cho AUTH_COOKIE_SECURE, SEED_ADMIN_PASSWORD, API_CORS_ORIGIN. (5) Hoist port declaration trước Swagger log. Build+lint+test đều pass.
