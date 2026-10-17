import AppShell, { type Notice } from "@/components/AppShell";
import AutoRefresh from "@/components/AutoRefresh";
import DemoBar from "@/components/DemoBar";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getFamily, getTodayCheckin, talkTopics } from "@/lib/data";

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole("child");
  const notices: Notice[] = [];
  const talk = getActiveTalk(me.id);
  if (talk?.initiator === "parent" && talk.status === "menunggu")
    notices.push({ kind: "talk", alert: true, href: "/anak/bicara", text: `Orang tuamu mengajak ngobrol: ${talkTopics(talk).join(", ")}` });
  if (talk?.initiator === "child" && talk.response)
    notices.push({ kind: "talk", alert: true, href: "/anak/bicara", text: `Orang tuamu membalas: “${talk.response}”` });
  if (!getTodayCheckin(me.id))
    notices.push({ kind: "reminder", href: "/anak/checkin", text: "Kamu belum check-in hari ini. Cukup satu menit." });
  const fam = getFamily(me.family_id);
  if (fam && fam.members.filter((m) => m.role === "parent").length === 0)
    notices.push({ kind: "family", href: "/anak/profil", text: `Bagikan kode keluarga ${fam.code} ke orang tuamu` });

  return (
    <AppShell role="child" name={me.name} subtitle={me.grade ?? "Mode Anak"} notices={notices}>
      <AutoRefresh />
      {process.env.DEMO_MODE === "true" && me.email.endsWith("@demo.id") && <DemoBar role="child" />}
      {children}
    </AppShell>
  );
}
