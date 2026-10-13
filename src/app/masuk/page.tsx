import { redirect } from "next/navigation";
import { getUser, homeFor } from "@/lib/auth";
import type { Metadata } from "next";
import { openGraphFor } from "@/lib/seo";
import LoginForm from "./LoginForm";

const description =
  "Masuk ke PathFinder AI untuk melanjutkan check-in harian, roadmap masa depan, dan Ruang Bicara bersama keluarga. Mode anak dan orang tua terpisah.";

export const metadata: Metadata = {
  title: "Masuk",
  description,
  alternates: { canonical: "/masuk" },
  openGraph: openGraphFor("/masuk", "Masuk | PathFinder AI", description),
};

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  return <LoginForm demo={process.env.DEMO_MODE === "true"} demoMissing={sp.demo === "belum"} />;
}
