/**
 * Cache in-memory của current user — dùng cho các *-api.ts (ngoài React).
 *
 * Lý do: các file *-api.ts là non-React modules, không thể dùng useAuth().
 * AuthProvider sẽ set giá trị này mỗi khi user thay đổi.
 *
 * Cảnh báo: caller KHÔNG nên dùng giá trị này làm default fallback.
 * Nếu user null (chưa đăng nhập) → caller phải trả về '' hoặc báo lỗi.
 */

import type { AuthUser } from "./auth-client";

let cached: AuthUser | null = null;

export function cacheCurrentUser(user: AuthUser | null): void {
  cached = user;
}

export function getCachedCurrentUser(): AuthUser | null {
  return cached;
}

/**
 * Helper lấy tên user hiện tại — KHÔNG bao giờ trả về hardcode fallback.
 * Nếu chưa đăng nhập, trả về chuỗi rỗng.
 *
 * Caller phải validate rằng tên không rỗng trước khi gửi lên API.
 */
export function getCurrentUserName(): string {
  return cached?.fullName ?? "";
}

export function getCurrentUserAgencyName(): string {
  return cached?.agencyName ?? "";
}

export function getCurrentUserAgencyCode(): string {
  return cached?.agencyCode ?? "";
}

export function getCurrentUserPositionTitle(): string {
  return cached?.positionTitle ?? "";
}
