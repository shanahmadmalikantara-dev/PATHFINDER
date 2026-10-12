import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// ID versi = commit git. Dipakai Next.js untuk mendeteksi "version skew":
// kalau browser masih memegang halaman dari versi lama, navigasi berikutnya
// otomatis jadi reload penuh, bukan error "Application error".
// (Harus stabil antara `next build` dan `next start`, jadi tanpa timestamp.)
const buildId = (() => {
  try {
    return "pf-" + execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "pf-local";
  }
})();

const nextConfig: NextConfig = {
  // better-sqlite3 adalah modul native, jadi jangan di-bundle oleh Next.js
  serverExternalPackages: ["better-sqlite3"],
  poweredByHeader: false,
  generateBuildId: async () => buildId,
  deploymentId: buildId,
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
