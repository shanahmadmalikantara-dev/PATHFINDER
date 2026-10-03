import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "PathFinder AI", template: "%s · PathFinder AI" },
  description: "Ruang tumbuh bersama untuk remaja dan orang tua — Dari Mengawasi Menuju Memahami.",
  applicationName: "PathFinder AI",
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
