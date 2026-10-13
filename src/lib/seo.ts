import type { Metadata } from "next";

// Data SEO bersama untuk halaman publik.
export const SITE_URL = "https://pathfind.my.id";
export const SITE_NAME = "PathFinder AI";
export const SITE_DESCRIPTION =
  "PathFinder AI membantu pelajar mencegah burnout lewat check-in energi harian dan menjembatani komunikasi orang tua dan remaja dengan panduan yang empatik.";

export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "PathFinder AI — Dari Mengawasi Menuju Memahami",
};

/** Open Graph lengkap untuk satu halaman (Next mengganti, bukan menggabung, openGraph milik induk). */
export function openGraphFor(path: string, title: string, description = SITE_DESCRIPTION): Metadata["openGraph"] {
  return {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    url: path,
    title,
    description,
    images: [OG_IMAGE],
  };
}
