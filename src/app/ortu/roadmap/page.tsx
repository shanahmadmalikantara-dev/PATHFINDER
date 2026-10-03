import Link from "next/link";
import { Lock, MessageSquare, Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getChildForParent, getMilestones, milestoneStats } from "@/lib/data";
import { ProgressRing } from "@/components/Charts";

export const metadata = { title: "Roadmap Anak" };

export default async function ParentRoadmap({ searchParams }: { searchParams: Promise<{ anak?: string }> }) {
  const me = await requireRole("parent");
  const { child, children } = getChildForParent(me, (await searchParams).anak);
  if (!child) return <p className="card text-center text-muted">Belum ada anak yang terhubung.</p>;
  const stats = milestoneStats(child.id);
  const shared = getMilestones(child.id, { sharedOnly: true });
  const privateCount = stats.total - shared.length;

  return (
    <div className="space-y-6">
      <header>
        <span className="chip bg-teal-100 text-teal">🗺️ Peta Perjalanan</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Roadmap {child.name}</h1>
        <p className="mt-1 max-w-2xl text-muted">Anda melihat progres umum dan milestone yang {child.name} pilih untuk dibagikan sebagai <b>Agenda Bersama</b>.</p>
      </header>
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <Link key={c.id} href={`/ortu/roadmap?anak=${c.id}`} className={`chip px-4 py-2 text-sm ${c.id === child.id ? "bg-teal text-white" : "bg-white"}`}>{c.name}</Link>
          ))}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="card h-fit text-center">
          <div className="flex justify-between"><span className="eyebrow">Progres Peta</span><span className="chip bg-teal-100 text-teal">Level {stats.level}</span></div>
          <div className="my-4"><ProgressRing percent={stats.percent} size={140} stroke={14}><span><b className="text-4xl">{stats.percent}%</b><br /><span className="text-xs text-muted">Selesai</span></span></ProgressRing></div>
          <p className="text-sm"><b>{stats.done} dari {stats.total}</b> milestone tercapai</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-sky p-3"><b className="text-xl text-teal">{stats.xp}</b><br /><span className="text-xs text-muted">Total XP</span></div>
            <div className="rounded-2xl bg-violet-50 p-3"><b className="text-xl text-violet">{privateCount}</b><br /><span className="text-xs text-muted">Pribadi 🔒</span></div>
          </div>
          <p className="mt-4 rounded-2xl bg-teal-50 p-3 text-left text-xs text-teal">💡 Apresiasi usahanya menapaki setiap langkah, bukan hanya pencapaian akhirnya.</p>
        </aside>
        <div className="space-y-4">
          {shared.length === 0 ? (
            <div className="card text-center text-muted">
              <p className="text-4xl">🔒</p>
              <p className="mt-2 font-semibold text-ink">Belum ada Agenda Bersama</p>
              <p className="text-sm">{child.name} belum membagikan milestone. Ini wajar — rencana pribadi butuh ruang untuk tumbuh.</p>
            </div>
          ) : (
            shared.map((m) => (
              <div key={m.id} className="card">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`chip ${m.status === "selesai" ? "bg-teal-50 text-teal" : m.status === "berjalan" ? "bg-coral-100 text-coral-700" : "bg-sky text-muted"}`}>
                    {m.status === "selesai" ? "Selesai 🎉" : m.status === "berjalan" ? "Sedang Berjalan 📍" : "Rencana 🗓️"}
                  </span>
                  <span className="chip bg-teal-100 text-teal">🔗 Agenda Bersama</span>
                  {m.target_date && <span className="chip bg-white text-muted ring-1 ring-line">⏳ {m.target_date}</span>}
                </div>
                <p className="mt-3 text-lg font-bold">{m.horizon === "jangka_panjang" && <Trophy size={18} className="mr-1 inline text-amber" />}{m.title}</p>
                {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
                {m.status !== "selesai" && (
                  <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sky p-3 text-sm"><MessageSquare size={16} className="mt-0.5 shrink-0 text-teal" /> Topik obrolan: “Ibu/Ayah lihat kamu punya rencana <b>{m.title}</b>. Ada yang bisa kami bantu siapkan?”</p>
                )}
              </div>
            ))
          )}
          {privateCount > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-violet-50 p-4 text-sm text-violet"><Lock size={16} /> {privateCount} milestone lainnya bersifat pribadi dan hanya terlihat oleh {child.name}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
