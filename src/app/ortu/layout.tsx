import AppShell, { type Notice } from "@/components/AppShell";
import AutoRefresh from "@/components/AutoRefresh";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getChildren, getFamily } from "@/lib/data";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole("parent");
  const notices: Notice[] = [];
  for (const c of getChildren(me.family_id)) {
    const t = getActiveTalk(c.id);
    if (t?.status === "menunggu") notices.push({ text: `✨ ${c.name} siap berdiskusi: ${(JSON.parse(t.topics) as string[]).join(", ")}`, href: "/ortu/bicara" });
  }
  const fam = getFamily(me.family_id);
  if (fam && !fam.members.some((m) => m.role === "child"))
    notices.push({ text: `🔗 Bagikan kode keluarga ${fam.code} ke anak Anda`, href: "/ortu/profil" });

  return (
    <AppShell role="parent" name={me.name} subtitle={me.relation ? `${me.relation} • Orang Tua` : "Orang Tua"} notices={notices}>
      <AutoRefresh />
      {children}
    </AppShell>
  );
}
