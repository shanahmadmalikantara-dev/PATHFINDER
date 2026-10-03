import { redirect } from "next/navigation";
import { getUser, homeFor } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Masuk" };

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  return <LoginForm demo={process.env.DEMO_MODE === "true"} demoMissing={sp.demo === "belum"} />;
}
