"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function safeReturnUrl(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function LoginContent() {
  const { user, status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnUrl = useMemo(
    () => safeReturnUrl(searchParams.get("returnUrl")),
    [searchParams],
  );
  const canSubmit = username.trim().length > 0 && password.length > 0;

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(returnUrl);
    }
  }, [status, user, router, returnUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace(returnUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không đăng nhập được. Kiểm tra lại tài khoản và mật khẩu.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_480px]">
        <section className="hidden flex-col justify-between bg-slate-950 px-10 py-10 text-white lg:flex">
          <div>
            <div className="inline-flex h-11 items-center rounded-md border border-white/15 px-3 text-sm font-black tracking-[0.18em]">
              QUANLYVKS
            </div>
            <div className="mt-20 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">
                Hệ thống nội bộ
              </p>
              <h1 className="mt-5 text-5xl font-black leading-tight">
                Quản lý hồ sơ và biểu mẫu theo phiên đăng nhập thật.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                Tài khoản xác định cơ quan, người ký, người tạo hồ sơ và các biểu
                mẫu đã đăng. Không dùng dữ liệu mẫu trong luồng nghiệp vụ.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <StatusTile label="Auth" value="Session cookie" />
            <StatusTile label="Seed" value="admin" />
            <StatusTile label="API" value="api/v1" />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                QUANLYVKS
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Đăng nhập
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sử dụng tài khoản được cấp để vào đúng dữ liệu của cơ quan và
                người dùng hiện tại.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Tên đăng nhập
                </span>
                <input
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Mật khẩu
                </span>
                <div className="mt-2 flex h-11 rounded-md border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className="min-w-0 flex-1 rounded-md bg-transparent px-3 text-sm font-semibold text-slate-950 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="border-l border-slate-200 px-3 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || submitting || status === "loading"}
              className="mt-6 h-11 w-full rounded-md bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
              Phiên làm việc được lưu bằng cookie HttpOnly. Hãy đăng xuất khi dùng
              chung máy.
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-black text-white">{value}</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
