# Infra (Docker compose cho dev)

- `docker-compose.dev.yml` — Dev only: chỉ chạy MariaDB (port 3307).
  API và Web chạy local bằng `pnpm dev` để tận dụng hot-reload.
- `database/001_init_utf8mb4.sql` — Init script cho container MariaDB
  (đảm bảo utf8mb4 charset, collation).

## Lệnh nhanh

```bash
pnpm db:up      # khởi động MariaDB
pnpm db:down    # dừng + xoá container (giữ volume)
pnpm db:logs    # xem log
```

Lần đầu chạy, init script sẽ tự động chạy khi volume trống.
Nếu muốn reset hoàn toàn: `docker volume rm quanlyvks-dev_mariadb_data`.
