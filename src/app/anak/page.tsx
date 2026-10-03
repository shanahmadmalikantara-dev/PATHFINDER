import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, EyeOff, Lock, MessagesSquare, Quote, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getCheckins, getStreak, getTodayCheckin, getWeekGoals, goalsPercent } from "@/lib/data";
import { QUOTES, goalCategory } from "@/lib/constants";
import { greeting, today, weekStart } from "@/lib/dates";
import { childCompanion } from "@/lib/insight";
import { ProgressBar } from "@/components/Charts";
import QuickCheckin from "./QuickCheckin";

export const metadata = { title: "Beranda" };

export default async function ChildHome() {
  const me = await requireRole("child");
  const todayCk = getTodayCheckin(me.id);
  const streak = getStreak(me.id);
  const goals = getWeekGoals(me.id);
  const pct = goalsPercent(goals);
  const done = goals.filter((g) => g.progress >= g.target).length;
  const weekCount = getCheckins(me.id, 7).filter((c) => c.date >= weekStart()).length;
  const talk = getActiveTalk(me.id);
  const quote = QUOTES[Number(today().slice(-2)) % QUOTES.length];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-coral-100 via-coral-50 to-teal-50 p-6 sm:p-8">
        <div className="absolute -top-10 right-10 size-48 rounded-full bg-white/50 blur-2xl" />
        {streak > 0 && <span className="chip bg-white text-coral-700">🔥 Streak {streak} Hari Berturut-turut!</span>}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {greeting()}, {me.name} 👋
        </h1>
        <p className="mt-2 max-w-lg text-ink/70">Siap melangkah lebih dekat ke impianmu hari ini?</p>
        <p className="mt-4 flex max-w-xl items-start gap-2 rounded-2xl bg-white/70 p-3 text-sm backdrop-blur">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-violet" />
          <span><b>PathFinder AI:</b> {childCompanion({ streak, checkinsThisWeek: weekCount, goalsPercent: pct, todayEnergy: todayCk?.energy })}</span>
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {/* Check-in */}
          <section className="card">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  Check-In Harian ✨ <span className="chip bg-coral-100 text-coral-700">Hari Ini</span>
                </h2>
                <p className="text-sm text-muted">Bagaimana tingkat energimu hari ini?</p>
              </div>
              <Link href="/anak/checkin" className="grid size-10 place-items-center rounded-full bg-sky text-coral-700" aria-label="Check-in lengkap">
                <RefreshCw size={18} />
              </Link>
            </div>
            <QuickCheckin current={todayCk?.energy} />
          </section>

          {/* Catatan pribadi */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-100 to-violet-50 p-6">
            <div className="absolute -top-16 -right-10 size-48 rounded-full bg-white/40 blur-2xl" />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-white text-violet"><Lock size={18} /></span>
                <div>
                  <h2 className="text-xl font-bold text-violet">Catatan Pribadi</h2>
                  <p className="text-xs text-violet/70">Ruang aman tanpa filter</p>
                </div>
              </div>
              <span className="chip bg-white text-violet"><ShieldCheck size={12} /> Privat & Terkunci</span>
            </div>
            <p className="relative mt-4 text-sm font-medium text-violet">
              Punya unek-unek atau hambatan hari ini? Tulis di ruang amanmu — orang tua tidak akan melihat ini.
            </p>
            <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link href="/anak/checkin#jurnal" className="btn bg-violet text-white hover:brightness-110">
                Buka Jurnal Rahasia ✍️ <ArrowRight size={16} />
              </Link>
              <span className="flex items-center gap-1.5 text-xs text-violet/80"><EyeOff size={14} /> Hanya kamu yang bisa baca</span>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {/* Target minggu ini */}
          <section className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Target Minggu Ini 🎯</h2>
              <Link href="/anak/checkin" className="text-xs font-semibold text-coral-700">Atur</Link>
            </div>
            {goals.length === 0 ? (
              <div className="rounded-2xl bg-sky p-5 text-center text-sm text-muted">
                Belum ada target minggu ini.
                <Link href="/anak/checkin" className="btn-primary mt-3 w-full">Buat Target Pertama</Link>
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-sky p-4">
                  <div className="flex items-end justify-between">
                    <span className="text-4xl font-extrabold text-coral-700">{pct}%</span>
                    <span className="text-sm font-bold text-coral-700">{done}/{goals.length} Selesai</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{pct >= 60 ? "Kamu hebat! Pertahankan 💪" : "Pelan-pelan, yang penting jalan 🌱"}</p>
                  <ProgressBar percent={pct} className="mt-3" />
                </div>
                <ul className="mt-3 space-y-2">
                  {goals.map((g) => {
                    const ok = g.progress >= g.target;
                    return (
                      <li key={g.id} className="flex items-center gap-3 rounded-2xl bg-sky/60 px-3 py-2.5">
                        {ok ? <CheckCircle2 size={20} className="shrink-0 text-teal" /> : <Circle size={20} className="shrink-0 text-line" />}
                        <span className={`flex-1 text-sm ${ok ? "text-muted line-through" : "font-medium"}`}>
                          {goalCategory(g.category).emoji} {g.title}
                        </span>
                        <span className={`chip ${ok ? "bg-teal-100 text-teal" : "bg-white text-muted"}`}>{g.progress}/{g.target}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>

          {/* Status bicara */}
          {talk && (
            <Link href="/anak/bicara" className="card flex items-center gap-3 hover:ring-2 hover:ring-coral-100">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-100 text-teal"><MessagesSquare size={18} /></span>
              <span className="flex-1 text-sm">
                <b className="block">Ruang Bicara</b>
                {talk.status === "disepakati" ? "Orang tuamu juga siap berdiskusi! 🎉" : talk.status === "ditunda" ? talk.parent_response : "Menunggu orang tuamu membalas…"}
              </span>
              <ArrowRight size={18} className="text-muted" />
            </Link>
          )}

          {/* Kutipan */}
          <section className="card">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid size-8 place-items-center rounded-full bg-coral-100 text-coral-700"><Quote size={14} /></span> Kutipan Hari Ini
            </p>
            <blockquote className="mt-4 border-l-4 border-coral pl-4 text-lg font-semibold italic">“{quote}”</blockquote>
          </section>
        </div>
      </div>
    </div>
  );
}
