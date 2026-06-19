"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  type AuthUser,
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
} from "./auth-client";
import { cacheCurrentUser } from "./current-user";
import { installApiFetchDefaults } from "./api-client";
import { subscribeAuthEvents } from "./auth-events";

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: (options?: { redirectTo?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    installApiFetchDefaults();
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    "loading",
  );

  const handleUnauthenticated = useCallback(() => {
    setUser(null);
    setStatus("unauthenticated");
    cacheCurrentUser(null);

    if (typeof window === "undefined" || pathname === "/login") {
      return;
    }

    const returnUrl = encodeURIComponent(pathname ?? "/");
    router.replace(`/login?returnUrl=${returnUrl}`);
  }, [pathname, router]);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
      setStatus(me ? "authenticated" : "unauthenticated");
      cacheCurrentUser(me);
      if (!me) {
        handleUnauthenticated();
      }
    } catch {
      setUser(null);
      setStatus("unauthenticated");
      cacheCurrentUser(null);
    }
  }, [handleUnauthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeAuthEvents((event) => {
      if (event.type === "unauthorized") {
        handleUnauthenticated();
      }
    });
  }, [handleUnauthenticated]);

  const login = useCallback(async (username: string, password: string) => {
    const u = await apiLogin(username, password);
    setUser(u);
    setStatus("authenticated");
    cacheCurrentUser(u);
    return u;
  }, []);

  const logout = useCallback(
    async (options?: { redirectTo?: string }) => {
      try {
        await apiLogout();
      } finally {
        setUser(null);
        setStatus("unauthenticated");
        cacheCurrentUser(null);
        if (typeof window !== "undefined") {
          const target = options?.redirectTo ?? "/login";
          router.replace(target);
        }
      }
    },
    [router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, refresh }),
    [user, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng trong <AuthProvider>.");
  }
  return ctx;
}
