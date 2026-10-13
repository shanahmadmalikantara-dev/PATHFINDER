import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Mesin pencari boleh membaca halaman publik saja.
// Dashboard (/anak, /ortu) wajib login, dan /api/ hanya untuk aplikasi.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/anak", "/ortu", "/offline"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
