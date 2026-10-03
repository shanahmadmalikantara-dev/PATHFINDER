import { redirect } from "next/navigation";
import { getUser, homeFor } from "@/lib/auth";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Daftar" };

export default async function DaftarPage({ searchParams }: { searchParams: Promise<{ peran?: string; kode?: string }> }) {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));
  const sp = await searchParams;
  return <RegisterForm initialRole={sp.peran === "ortu" ? "parent" : "child"} initialCode={sp.kode ?? ""} />;
}
