/**
 * Auth client — đăng nhập / lấy user hiện tại / đăng xuất qua session cookie.
 *
 * Tất cả các `*` options khác (signer name, agency, ...) sẽ đọc từ đây.
 * Không có hardcode fallback trong production — nếu chưa đăng nhập, trả về ''.
 */

import { absoluteApiUrl } from "./api-client";

export type UserRole = "ADMIN" | "OFFICIAL" | "VIEWER";

export interface AuthUser {
  id: string;
  username: string | null;
  fullName: string;
  positionTitle: string | null;
  rankTitle: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  agencyId: string | null;
  agencyName: string | null;
  agencyCode: string | null;
  isActive: boolean;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  let res: Response;
  try {
    res = await fetch(absoluteApiUrl("/auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
  } catch {
    throw new Error(
      "Không kết nối được API đăng nhập. Kiểm tra server API ở cổng 3001 rồi thử lại.",
    );
  }
  if (!res.ok) {
    const text = await res.text();
    let msg = "Đăng nhập thất bại.";
    try {
      const json = JSON.parse(text) as { message?: string };
      if (typeof json.message === "string") msg = json.message;
    } catch {
      // ignore
    }
    throw new Error(`${msg} [HTTP ${res.status}]`);
  }
  const data = (await res.json()) as { user: AuthUser };
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch(absoluteApiUrl("/auth/logout"), {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch(absoluteApiUrl("/auth/me"), {
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as AuthUser | null;
  return data ?? null;
}

export async function fetchOfficials(): Promise<
  Array<{ id: string; fullName: string; positionTitle: string | null; agencyName: string | null }>
> {
  const res = await fetch(absoluteApiUrl("/auth/users"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as Array<{
    id: string;
    fullName: string;
    positionTitle: string | null;
    agencyName: string | null;
  }>;
}

export async function fetchCurrentAgency(): Promise<{
  id: string;
  name: string;
  code: string | null;
  parentName: string | null;
} | null> {
  const res = await fetch(absoluteApiUrl("/auth/agency"), {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    id: string;
    name: string;
    code: string | null;
    parentName: string | null;
  } | null;
}
