-- ============================================================
-- QUANLYVKS - MariaDB init script cho dev environment
-- Chỉ chạy khi volume trống (lần đầu container khởi động).
-- ============================================================
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Đảm bảo database chính dùng utf8mb4
ALTER DATABASE quanlyvks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
