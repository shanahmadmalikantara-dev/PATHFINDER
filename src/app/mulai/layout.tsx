import type { Metadata } from "next";
import { openGraphFor } from "@/lib/seo";

// /mulai adalah client component, jadi metadata-nya dipasang lewat layout ini.
const title = "Mulai Perjalanan Keluarga";
const description =
  "Kenali cara kerja PathFinder AI: pilih Mode Anak atau Mode Orang Tua, lihat batas privasinya, lalu buat akun gratis untuk mulai tumbuh bersama.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/mulai" },
  openGraph: openGraphFor("/mulai", `${title} | PathFinder AI`, description),
};

export default function MulaiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
