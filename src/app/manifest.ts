import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PathFinder AI",
    short_name: "PathFinder",
    description: "Ruang tumbuh bersama remaja & orang tua — Dari Mengawasi Menuju Memahami.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f8fc",
    theme_color: "#f3f8fc",
    lang: "id",
    categories: ["education", "lifestyle", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Check-In Harian", url: "/anak/checkin", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Ruang Bicara", url: "/anak/bicara", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
