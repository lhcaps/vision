import type { NextConfig } from "next";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Cho phép /api/* (client-side) proxy về backend khi cần.
  // Khi BACKEND_ORIGIN chưa set, request /api/* sẽ trả 404 (client dùng
  // NEXT_PUBLIC_API_BASE_URL để gọi thẳng backend — đơn giản hơn cho dev).
  async rewrites() {
    if (!BACKEND_ORIGIN) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
  // API responses nên qua Next.js (không cache) cho development.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Prisma cần native modules; transpilePackages không cần nhưng set để future-proof.
  transpilePackages: [],
};

export default nextConfig;
