import { Bot, Eye, Lock, ShieldCheck, Sprout } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getCheckins, getStreak, getTodayCheckin, getWeekGoals, goalsPercent } from "@/lib/data";
import { weekLabel, weekStart } from "@/lib/dates";
import { childCompanion } from "@/lib/insight";
import { ProgressRing } from "@/components/Charts";
import FullCheckin from "./FullCheckin";
import Goals from "./Goals";
import Journal from "./Journal";

export const metadata = { title: "Check-In & Jurnal" };

export default async function CheckinPage() {
  const me = await requireRole("child");
  const goals = getWeekGoals(me.id);
  const pct = goalsPercent(goals);
  const done = goals.filter((g) => g.progress >= g.target).length;
  const streak = getStreak(me.id);
  const todayCk = getTodayCheckin(me.id);
  const weekCount = getCheckins(me.id, 7).filter((c) => c.date >= weekStart()).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-coral-100 text-coral-700">● SIKLUS MINGGU INI • {weekLabel(weekStart()).toUpperCase()}</span>
            <span className="chip bg-violet-50 text-violet"><ShieldCheck size={12} /> Mode Anak Aktif</span>
          </div>
          <p className="eyebrow mt-3 text-muted">Refleksi & Manajemen Waktu</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Check-In & Jurnal Pribadi 🎯</h1>
          <p className="mt-2 max-w-xl text-muted">Langkah kecil yang konsisten akan membawamu ke tujuan besar, seimbang dengan ruang refleksi tanpa beban.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-sm">
          <span className="grid size-10 place-items-center rounded-full bg-coral-100 text-xl">🔥</span>
          <span className="text-sm leading-tight"><span className="eyebrow text-muted">Konsistensi</span><br /><b className="text-lg">Streak: {streak} Hari</b></span>
        </div>
      </header>

      <section className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-coral text-white"><Bot size={26} /></span>
        <div className="flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold">PathFinder AI Companion <span className="chip bg-teal-100 text-teal">● Aktif</span></p>
          <p className="mt-1 text-ink/80 italic">“{childCompanion({ streak, checkinsThisWeek: weekCount, goalsPercent: pct, todayEnergy: todayCk?.energy })}”</p>
        </div>
        {goals.length > 0 && (
          <div className="flex items-center gap-4 rounded-2xl bg-sky px-5 py-3">
            <span className="text-sm leading-tight text-muted">Ringkasan Sasaran<br /><b className="text-lg text-coral-700">{done} / {goals.length} Sasaran</b></span>
            <ProgressRing percent={pct} size={56} stroke={6} track="#fff"><span className="text-xs font-bold">{pct}%</span></ProgressRing>
          </div>
        )}
      </section>

      <FullCheckin energy={todayCk?.energy} mood={todayCk?.mood} />

      <Goals goals={goals} />

      <p className="flex items-start gap-3 rounded-2xl bg-sky p-4 text-sm">
        <Eye size={18} className="mt-0.5 shrink-0 text-violet" />
        <span><b>Zona Pribadi:</b> Hanya statistik akumulatif mingguan yang disinkronkan ke dasbor orang tua. Jurnal di bawah ini tetap privat milikmu.</span>
      </p>

      <div className="relative py-2 text-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <span className="relative chip bg-white px-4 py-2 text-teal shadow-sm"><Sprout size={14} /> Ruang Refleksi & Pelepasan Beban Remaja <Lock size={12} /></span>
      </div>

      <section id="jurnal" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet"><ShieldCheck size={22} /></span>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Jurnal & Hambatan Pribadi 🔐</h2>
              <p className="text-sm text-muted">Tuliskan unek-unekmu, rasa lelah, atau tantangan tanpa takut dinilai siapa pun.</p>
            </div>
          </div>
          <span className="chip bg-violet-50 text-violet">● Enkripsi Penuh • Hanya di HP-mu</span>
        </div>
        <p className="rounded-2xl bg-coral-50 p-4 text-sm text-coral-700">
          🌿 <b>Ruang Aman Tanpa Beban</b> — Tulisanmu dienkripsi dan disimpan <b>hanya di perangkat ini</b>, tidak pernah dikirim ke server. Orang tua hanya melihat level energi dari check-in, tidak pernah isi tulisanmu.
        </p>
        <Journal userId={me.id} />
      </section>
    </div>
  );
}
