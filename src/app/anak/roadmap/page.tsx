import Link from "next/link";
import { ArrowRight, Bot, CalendarDays, Flag, Hourglass, Lock, MessageSquare, Trophy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getMilestones, milestoneStats } from "@/lib/data";
import { shortDate } from "@/lib/dates";
import { ProgressRing } from "@/components/Charts";
import type { Milestone } from "@/lib/db";
import { AddMilestoneButton, MilestoneMenu } from "./MilestoneActions";

export const metadata = { title: "Roadmap" };

const ICONS = ["📖", "🎓", "📍", "🧑‍🤝‍🧑", "🏅", "💡", "🚀", "🌟"];

export default async function RoadmapPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const me = await requireRole("child");
  const tab = (await searchParams).tab === "jangka_panjang" ? "jangka_panjang" : "tahun_ini";
  const all = getMilestones(me.id);
  const list = all.filter((m) => m.horizon === tab);
  const stats = milestoneStats(me.id);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-coral to-coral-100 p-6 text-white sm:p-8">
        <div className="absolute -right-10 -bottom-16 size-64 rounded-full bg-violet-100/40 blur-3xl" />
        <span className="chip bg-white/90 text-coral-700">✨ PETUALANGANMU DIMULAI DI SINI</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-coral-700 sm:text-4xl">Roadmap Masa Depanmu 🗺️</h1>
        <p className="mt-2 max-w-lg font-medium text-coral-700/80">Setiap langkah kecil membawamu lebih dekat ke impian. Nikmati prosesnya!</p>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {[["tahun_ini", "Tahun Ini", CalendarDays], ["jangka_panjang", "Jangka Panjang", Flag]].map(([v, l, Icon]) => {
          const I = Icon as React.ElementType;
          return (
            <Link key={v as string} href={`/anak/roadmap?tab=${v}`} className={`chip px-4 py-2.5 text-sm ${tab === v ? "bg-coral text-white shadow" : "bg-white text-ink"}`}>
              <I size={16} /> {l as string}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="relative space-y-5">
          {list.length > 0 && <div className="absolute top-6 bottom-20 left-6 hidden w-0.5 border-l-2 border-dashed border-coral/30 sm:block" />}
          {list.length === 0 && (
            <div className="card text-center text-muted">
              <p className="text-4xl">🧭</p>
              <p className="mt-2 font-semibold text-ink">Belum ada milestone di sini</p>
              <p className="text-sm">Mulai dari mimpi terbesarmu, lalu pecah jadi langkah-langkah kecil.</p>
            </div>
          )}
          {list.map((m, i) => <MilestoneRow key={m.id} m={m} icon={ICONS[i % ICONS.length]} />)}
          <div className="sm:pl-16"><AddMilestoneButton horizon={tab} /></div>
        </div>

        <aside className="space-y-4">
          <div className="card text-center">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Progres Peta</span>
              <span className="chip bg-teal-100 text-teal">Level {stats.level} 🌱</span>
            </div>
            <div className="my-4">
              <ProgressRing percent={stats.percent} size={140} stroke={14}>
                <span><b className="text-4xl">{stats.percent}%</b><br /><span className="text-xs text-muted">Selesai</span></span>
              </ProgressRing>
            </div>
            <p className="text-sm"><b>{stats.done} dari {stats.total} pos peta</b> berhasil diselesaikan!</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-sky p-3"><b className="text-xl text-coral-700">{stats.xp}</b><br /><span className="text-xs text-muted">Total XP</span></div>
              <div className="rounded-2xl bg-sky p-3"><b className="text-xl text-teal">{stats.total - stats.done} Pos</b><br /><span className="text-xs text-muted">Langkah Menanti</span></div>
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-2xl bg-violet-50 p-4 text-xs text-violet">
            <Lock size={14} className="mt-0.5 shrink-0" /> Orang tua hanya melihat milestone bertanda <b>Agenda Bersama</b> dan jumlah progresmu. Sisanya tetap pribadi.
          </p>
          <Link href="/anak/bicara/kopilot?mode=rencana" className="card flex items-center gap-3 hover:ring-2 hover:ring-coral-100">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-coral text-white"><Bot size={20} /></span>
            <span className="flex-1 text-sm"><b className="block">Butuh Bantuan Rencana?</b><span className="text-muted">Tanya PathFinder AI untuk tips belajar.</span></span>
            <ArrowRight size={18} className="text-coral-700" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function MilestoneRow({ m, icon }: { m: Milestone; icon: string }) {
  const current = m.status === "berjalan";
  const done = m.status === "selesai";
  return (
    <div className="flex gap-4">
      <div className={`relative z-[1] hidden size-12 shrink-0 place-items-center rounded-full text-2xl shadow-md sm:grid ${current ? "bg-coral" : done ? "bg-white" : "bg-sky"}`}>
        {current ? "📍" : icon}
        {done && <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-teal text-[10px] text-white">✓</span>}
      </div>
      <div className={`card flex-1 ${current ? "ring-2 ring-coral/50" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {current && <span className="chip bg-coral-700 text-white">Posisi Kamu Sekarang 📍</span>}
            {done && <span className="chip bg-teal-50 text-teal">Selesai {m.done_at ? shortDate(m.done_at) : ""} 🎉</span>}
            {!done && !current && <span className="chip bg-sky text-muted">🗓️ Rencana</span>}
            <span className="chip bg-violet-50 text-violet">★ {m.xp} XP</span>
            {m.shared ? <span className="chip bg-teal-100 text-teal">🔗 Agenda Bersama</span> : <span className="chip bg-white text-muted ring-1 ring-line"><Lock size={10} /> Pribadi</span>}
          </div>
          <MilestoneMenu m={m} />
        </div>
        <h3 className={`mt-3 font-bold ${current ? "text-xl" : "text-lg"} ${done ? "text-ink/70" : ""}`}>
          {m.horizon === "jangka_panjang" && <Trophy size={18} className="mr-1 inline text-amber" />}{m.title}
        </h3>
        {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
        {m.target_date && <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted"><Hourglass size={13} /> Target: {m.target_date}</p>}
        {m.shared === 1 && !done && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-sky px-3 py-2 text-xs text-muted"><MessageSquare size={14} /> Rekomendasi topik obrolan sudah disiapkan untuk orang tua</p>
        )}
      </div>
    </div>
  );
}
