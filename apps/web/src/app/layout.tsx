import type { Metadata } from "next";

import { AuthProvider } from "@/lib/auth-context";
import { AuthGate } from "@/components/auth/auth-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "QUANLYVKS",
  description: "Hệ thống quản lý hồ sơ và biểu mẫu Viện kiểm sát",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body style={{ margin: 0 }}>
        <AuthProvider>
          <AuthGate>
            {children}
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
