import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 adalah modul native, jadi jangan di-bundle oleh Next.js
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Service worker harus selalu versi terbaru
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
