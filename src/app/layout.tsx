import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, openGraphFor } from "@/lib/seo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "PathFinder AI — Dari Mengawasi Menuju Memahami", template: "%s | PathFinder AI" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "PathFinder AI",
    "burnout pelajar",
    "kesehatan mental remaja",
    "komunikasi orang tua dan anak",
    "parenting remaja",
    "check-in energi",
    "jurnal pribadi terenkripsi",
    "roadmap masa depan",
    "aplikasi keluarga",
  ],
  authors: [{ name: "Tim PathFinder AI" }],
  // Canonical dipasang per halaman publik (bukan di sini) agar halaman lain tidak ikut menunjuk ke "/".
  openGraph: openGraphFor("/", "PathFinder AI — Dari Mengawasi Menuju Memahami"),
  twitter: {
    card: "summary_large_image",
    title: "PathFinder AI — Dari Mengawasi Menuju Memahami",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  appleWebApp: { capable: true, title: "PathFinder", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f3f8fc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
