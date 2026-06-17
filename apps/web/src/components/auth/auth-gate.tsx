"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Gate: nếu user chưa đăng nhập, redirect tới /login (giữ returnUrl).
 * Nếu đang loading, hiển thị fallback.
 */
export function AuthGate({
  children,
  loadingFallback,
}: {
  children: ReactNode;
  loadingFallback?: ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      const returnUrl = encodeURIComponent(pathname ?? "/");
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [status, router, pathname]);

  // Trang /login tự xử lý redirect sau khi authenticated → không gate.
  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <>
        {loadingFallback ?? (
          <div
            style={{
              display: "grid",
              placeItems: "center",
              minHeight: 240,
              color: "#64748B",
              fontSize: 14,
            }}
          >
            Đang tải phiên làm việc…
          </div>
        )}
      </>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
