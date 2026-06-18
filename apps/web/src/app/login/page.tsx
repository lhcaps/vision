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
    <main className="min-h-screen overflow-hidden bg-[#070b1a] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden px-12 py-10 text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.28),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(14,165,233,0.18),transparent_30%)]" />
          <div className="absolute inset-0 bg-linear-to-br from-slate-950 via-slate-950 to-blue-950/70" />

          <div className="relative z-10">
            <div className="inline-flex h-10 items-center rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-black tracking-[0.22em] shadow-2xl shadow-blue-950/30 backdrop-blur">
              QUANLYVKS
            </div>

            <div className="mt-24 max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
                Hệ thống nội bộ
              </p>
              <h1 className="mt-5 text-5xl font-black leading-[1.04] tracking-tight xl:text-6xl">
                Quản lý hồ sơ, biểu mẫu và phiên làm việc nghiệp vụ.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                Đăng nhập bằng tài khoản được cấp để xác định đúng cơ quan,
                người ký, người tạo hồ sơ và dữ liệu biểu mẫu.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid max-w-3xl grid-cols-3 gap-3">
            <StatusTile label="Auth" value="Session cookie" />
            <StatusTile label="Mode" value="Internal" />
            <StatusTile label="API" value="api/v1" />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[460px] rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10"
          >
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">
                QUANLYVKS
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Đăng nhập
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dùng tài khoản nội bộ để truy cập đúng dữ liệu của đơn vị.
              </p>
            </div>

            <div className="space-y-5">
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
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Mật khẩu
                </span>
                <div className="mt-2 flex h-12 rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 text-sm font-semibold text-slate-950 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-r-2xl border-l border-slate-200 px-4 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-white"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || submitting || status === "loading"}
              className="mt-6 h-12 w-full rounded-2xl bg-blue-700 px-4 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              Phiên làm việc được lưu bằng cookie HttpOnly. Hãy đăng xuất khi dùng chung máy.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 p-4 shadow-xl shadow-black/20 backdrop-blur">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
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
