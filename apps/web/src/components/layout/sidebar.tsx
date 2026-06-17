"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function IconShell({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-700 group-[.is-active]:bg-blue-100 group-[.is-active]:text-blue-700">
      {children}
    </span>
  );
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const menuItems: MenuItem[] = [
  {
    href: "/",
    label: "Tổng quan",
    icon: (
      <SvgIcon>
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M6.5 10.5V19h11v-8.5" />
        <path d="M10 19v-5h4v5" />
      </SvgIcon>
    ),
  },
  {
    href: "/cases",
    label: "Hồ sơ vụ án",
    icon: (
      <SvgIcon>
        <path d="M7 4h7l3 3v13H7z" />
        <path d="M14 4v4h4" />
        <path d="M9.5 12h5" />
        <path d="M9.5 16h5" />
      </SvgIcon>
    ),
  },
  {
    href: "/documents",
    label: "Tạo biểu mẫu",
    icon: (
      <SvgIcon>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </SvgIcon>
    ),
  },
  {
    href: "/templates",
    label: "Duyệt biểu mẫu",
    icon: (
      <SvgIcon>
        <path d="m5 13 4 4L19 7" />
      </SvgIcon>
    ),
  },
  {
    href: "/imports",
    label: "Import dữ liệu",
    icon: (
      <SvgIcon>
        <path d="M12 4v11" />
        <path d="m7.5 9 4.5-5 4.5 5" />
        <path d="M5 19h14" />
      </SvgIcon>
    ),
  },
  {
    href: "/reports",
    label: "Báo cáo",
    icon: (
      <SvgIcon>
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
      </SvgIcon>
    ),
  },
  {
    href: "/settings",
    label: "Cấu hình",
    icon: (
      <SvgIcon>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.05a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.05A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.05a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.05A1.7 1.7 0 0 0 19.4 15Z" />
      </SvgIcon>
    ),
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName = user?.fullName ?? "Chưa đăng nhập";
  const subtitle = user?.agencyName ?? user?.positionTitle ?? user?.role ?? "";
  const initials = getInitials(displayName) || "QL";

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-5">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0B1F3A] text-lg font-black text-white shadow-sm">
          ⚖
        </div>

        <div>
          <div className="text-[15px] font-black tracking-[-0.02em] text-slate-950">
            QUANLYVKS
          </div>
          <div className="mt-0.5 text-[12px] font-medium text-slate-500">
            Quản lý hồ sơ vụ án
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 pt-5 text-[12px] font-black uppercase tracking-[0.08em] text-slate-500">
        Nghiệp vụ
      </div>

      <nav className="grid gap-2 px-3">
        {menuItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex min-h-[52px] items-center gap-3 rounded-[18px] px-3.5 text-[15px] font-bold tracking-[-0.01em] transition-all duration-200",
                "hover:-translate-y-0.5 hover:bg-blue-50 hover:text-blue-800 hover:shadow-[0_10px_24px_rgba(30,64,175,0.10)]",
                active
                  ? "is-active bg-slate-100 text-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                  : "text-slate-700",
              ].join(" ")}
            >
              <IconShell>{item.icon}</IconShell>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-[18px] bg-slate-50 p-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-[13px] font-black text-blue-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-black text-slate-950">
              {displayName}
            </div>
            {subtitle ? (
              <div className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
                {subtitle}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Đăng xuất"
            title="Đăng xuất"
            onClick={() => {
              void logout();
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-white hover:text-rose-600"
          >
            <SvgIcon>
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H4" />
              <path d="M12 20h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-6" />
            </SvgIcon>
          </button>
        </div>
      </div>
    </aside>
  );
}
