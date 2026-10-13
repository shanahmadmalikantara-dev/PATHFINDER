import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Hanya halaman publik (tanpa login).
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/mulai", priority: 0.8 },
    { path: "/daftar", priority: 0.6 },
    { path: "/masuk", priority: 0.5 },
  ];
  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
