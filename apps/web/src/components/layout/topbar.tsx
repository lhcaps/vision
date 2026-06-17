"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { CSSProperties, KeyboardEvent } from "react";

const styles: Record<string, CSSProperties> = {
  topbar: {
    height: 64,
    background: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  search: {
    width: 440,
    height: 38,
    border: "1px solid #CBD5E1",
    borderRadius: 12,
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    color: "#0F172A",
    background: "#F8FAFC",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  primaryButton: {
    height: 40,
    border: 0,
    borderRadius: 12,
    background: "#173E86",
    color: "#FFFFFF",
    padding: "0 16px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  dropdownWrap: {
    position: "relative",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    minWidth: 220,
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
    padding: 6,
    zIndex: 20,
  },
  dropdownItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 8,
    border: 0,
    background: "transparent",
    color: "#0F172A",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
};

const QUICK_CREATE_OPTIONS = [
  { label: "Tạo hồ sơ vụ án", href: "/cases" },
  { label: "Import dữ liệu", href: "/imports" },
  { label: "Chọn biểu mẫu", href: "/documents" },
] as const;

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCreateOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!createOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createOpen]);

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const value = event.currentTarget.value.trim();
    if (!value) return;
    router.push(`/cases?q=${encodeURIComponent(value)}`);
  }

  return (
    <header style={styles.topbar}>
      <div style={styles.searchWrap}>
        <input
          style={styles.search}
          placeholder="Tìm hồ sơ, biểu mẫu, bị can..."
          onKeyDown={onSearchKeyDown}
          aria-label="Tìm kiếm nhanh"
        />
      </div>

      <div style={styles.actions}>
        <div ref={wrapRef} style={styles.dropdownWrap}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={() => setCreateOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={createOpen}
          >
            ＋ Tạo mới
          </button>
          {createOpen ? (
            <div role="menu" style={styles.dropdown}>
              {QUICK_CREATE_OPTIONS.map((option) => (
                <button
                  key={option.href}
                  type="button"
                  role="menuitem"
                  style={styles.dropdownItem}
                  onClick={() => {
                    setCreateOpen(false);
                    router.push(option.href);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
