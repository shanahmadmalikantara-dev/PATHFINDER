import AppShell, { type Notice } from "@/components/AppShell";
import AutoRefresh from "@/components/AutoRefresh";
import DemoBar from "@/components/DemoBar";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getChildren, getFamily, talkTopics } from "@/lib/data";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole("parent");
  const notices: Notice[] = [];
  for (const c of getChildren(me.family_id)) {
    const t = getActiveTalk(c.id);
    if (t?.initiator === "child" && t.status === "menunggu")
      notices.push({ kind: "talk", alert: true, href: "/ortu/bicara", text: `${c.name} siap berdiskusi: ${talkTopics(t).join(", ")}` });
    if (t?.initiator === "parent" && t.response)
      notices.push({ kind: "talk", alert: true, href: "/ortu/bicara", text: `${c.name} membalas: “${t.response}”` });
  }
  const fam = getFamily(me.family_id);
  if (fam && !fam.members.some((m) => m.role === "child"))
    notices.push({ kind: "family", href: "/ortu/profil", text: `Bagikan kode keluarga ${fam.code} ke anak Anda` });

  return (
    <AppShell role="parent" name={me.name} subtitle={me.relation ? `${me.relation} • Orang Tua` : "Orang Tua"} notices={notices}>
      <AutoRefresh />
      {process.env.DEMO_MODE === "true" && me.email.endsWith("@demo.id") && <DemoBar role="parent" />}
      {children}
    </AppShell>
  );
}
