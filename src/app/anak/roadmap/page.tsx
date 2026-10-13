import Link from "next/link";
import {
  ArrowRight, BookOpen, Bot, CalendarDays, CalendarRange, Check, Compass, Flag, GraduationCap, Hourglass, Lightbulb, Link2, Lock, type LucideIcon,
  MapPin, Medal, MessageSquare, Rocket, Sparkles, Star, Trophy, Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getMilestones, milestoneStats } from "@/lib/data";
import { shortDate } from "@/lib/dates";
import { ProgressRing } from "@/components/Charts";
import type { Milestone } from "@/lib/db";
import { AddMilestoneButton, MilestoneMenu, TaskList } from "./MilestoneActions";

export const metadata = { title: "Roadmap" };

const ICONS: LucideIcon[] = [BookOpen, GraduationCap, Users, Medal, Lightbulb, Rocket, Star];
const PRIORITY: Record<number, [string, string]> = {
  1: ["Prioritas utama", "bg-coral-700 text-white"],
  2: ["Penting", "bg-violet-50 text-violet"],
  3: ["Pelengkap", "bg-white text-muted ring-1 ring-line"],
};

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
        <span className="chip bg-white/90 text-coral-700"><Compass size={12} /> Petualanganmu dimulai di sini</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-coral-700 sm:text-4xl">Roadmap Masa Depanmu</h1>
        <p className="mt-2 max-w-lg font-medium text-coral-700/80">Setiap langkah kecil membawamu lebih dekat ke impian. Nikmati prosesnya!</p>
      </section>

      <Link href="/anak/roadmap/rancang" className="group flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line transition hover:ring-2 hover:ring-coral/50 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-coral to-violet text-white"><Sparkles size={26} /></span>
        <span className="flex-1">
          <b className="block text-lg">Rancang dengan PathFinder AI</b>
          <span className="text-sm text-muted">Tulis impianmu (misalnya “pengen kuliah di MIT”). PathFinder menyusun jalur pilihan, lomba yang bisa diikuti, dan langkah mingguan, lalu kamu yang memilih.</span>
        </span>
        <span className="btn-primary shrink-0 px-5 py-3">Mulai Rancang <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
      </Link>

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
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-coral-50 text-coral-700"><Compass size={28} /></span>
              <p className="mt-2 font-semibold text-ink">Belum ada milestone di sini</p>
              <p className="text-sm">Mulai dari mimpi terbesarmu, lalu pecah jadi langkah-langkah kecil, atau biarkan PathFinder AI membantumu merancangnya.</p>
            </div>
          )}
          {list.map((m, i) => <MilestoneRow key={m.id} m={m} icon={ICONS[i % ICONS.length]} />)}
          <div className="sm:pl-16"><AddMilestoneButton horizon={tab} /></div>
        </div>

        <aside className="space-y-4">
          <div className="card text-center">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Progres Peta</span>
              <span className="chip bg-teal-100 text-teal">Level {stats.level}</span>
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
            <span className="flex-1 text-sm"><b className="block">Konsultasi dengan Kopilot</b><span className="text-muted">Tanya strategi belajar atau bahas rencanamu.</span></span>
            <ArrowRight size={18} className="text-coral-700" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function MilestoneRow({ m, icon: Icon }: { m: Milestone; icon: LucideIcon }) {
  const current = m.status === "berjalan";
  const done = m.status === "selesai";
  return (
    <div className="flex gap-4">
      <div className={`relative z-[1] hidden size-12 shrink-0 place-items-center rounded-full shadow-md sm:grid ${current ? "bg-coral text-white" : done ? "bg-white text-teal" : "bg-sky text-coral-700"}`}>
        {current ? <MapPin size={22} /> : <Icon size={20} />}
        {done && <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-teal text-white"><Check size={12} /></span>}
      </div>
      <div className={`card flex-1 ${current ? "ring-2 ring-coral/50" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {current && <span className="chip bg-coral-700 text-white"><MapPin size={11} /> Posisi kamu sekarang</span>}
            {done && <span className="chip bg-teal-50 text-teal"><Check size={11} /> Selesai {m.done_at ? shortDate(m.done_at) : ""}</span>}
            {!done && !current && <span className="chip bg-sky text-muted">Rencana</span>}
            {!done && m.dream && <span className={`chip ${PRIORITY[m.priority]?.[1] ?? PRIORITY[2][1]}`}>{PRIORITY[m.priority]?.[0] ?? "Penting"}</span>}
            <span className="chip bg-violet-50 text-violet"><Star size={11} /> {m.xp} XP</span>
            {m.shared ? <span className="chip bg-teal-100 text-teal"><Link2 size={11} /> Agenda Bersama</span> : <span className="chip bg-white text-muted ring-1 ring-line"><Lock size={10} /> Pribadi</span>}
          </div>
          <MilestoneMenu m={m} />
        </div>
        <h2 className={`mt-3 font-bold ${current ? "text-xl" : "text-lg"} ${done ? "text-ink/70" : ""}`}>
          {m.horizon === "jangka_panjang" && <Trophy size={18} className="mr-1 inline text-amber" />}{m.title}
        </h2>
        {m.dream && <p className="mt-1 text-xs font-semibold text-coral-700">Untuk impian: {m.dream}</p>}
        {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
        {m.period ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted"><CalendarRange size={13} /> Periode: {m.period}</p>
        ) : m.target_date ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted"><Hourglass size={13} /> Target: {m.target_date}</p>
        ) : null}
        {m.tasks && <TaskList id={m.id} tasks={m.tasks} />}
        {m.shared === 1 && !done && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-sky px-3 py-2 text-xs text-muted"><MessageSquare size={14} /> Rekomendasi topik obrolan sudah disiapkan untuk orang tua</p>
        )}
      </div>
    </div>
  );
}
