import AppShell, { type Notice } from "@/components/AppShell";
import AutoRefresh from "@/components/AutoRefresh";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getFamily, getTodayCheckin } from "@/lib/data";

export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const me = await requireRole("child");
  const notices: Notice[] = [];
  const talk = getActiveTalk(me.id);
  if (talk?.parent_response) notices.push({ text: `💬 Orang tuamu membalas: “${talk.parent_response}”`, href: "/anak/bicara" });
  if (!getTodayCheckin(me.id)) notices.push({ text: "⏱️ Kamu belum check-in hari ini. Cuma 1 menit kok!", href: "/anak/checkin" });
  const fam = getFamily(me.family_id);
  if (fam && fam.members.filter((m) => m.role === "parent").length === 0)
    notices.push({ text: `🔗 Bagikan kode keluarga ${fam.code} ke orang tuamu`, href: "/anak/profil" });

  return (
    <AppShell role="child" name={me.name} subtitle={me.grade ?? "Mode Anak"} notices={notices}>
      <AutoRefresh />
      {children}
    </AppShell>
  );
}
