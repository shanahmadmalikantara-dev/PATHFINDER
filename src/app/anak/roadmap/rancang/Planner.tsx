"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft, ArrowRight, Bot, CalendarRange, Check, CheckCircle2, Compass, Flag, ListChecks, Loader2, Lock, MessageSquare,
  RefreshCw, Repeat, Route, Sparkles, Target, Trophy, Users,
} from "lucide-react";
import { applyPlan, planDream } from "@/actions/planner";
import { HOURS_OPTIONS } from "@/lib/constants";
import type { Plan, PlanPath } from "@/lib/planner";
import { CATEGORY_VISUAL, IconBadge } from "@/components/icons";

const EXAMPLES = ["Pengen kuliah di MIT", "Masuk Kedokteran UI", "Jadi programmer & bikin aplikasi sendiri", "Punya bisnis sendiri sebelum lulus kuliah"];
const EFFORT = {
  ringan: { label: "Ringan", cls: "bg-teal-100 text-teal" },
  sedang: { label: "Sedang", cls: "bg-amber/20 text-[#8a5a00]" },
  intens: { label: "Intens", cls: "bg-coral-100 text-coral-700" },
} as const;
const PRIORITY = { 1: "Prioritas utama", 2: "Penting", 3: "Pelengkap" } as const;

export default function Planner({ name, grade, ai }: { name: string; grade: string | null; ai: boolean }) {
  const router = useRouter();
  const [dream, setDream] = useState("");
  const [hours, setHours] = useState(HOURS_OPTIONS[1]);
  const [strengths, setStrengths] = useState("");
  const [constraints, setConstraints] = useState("");
  const [feedback, setFeedback] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [pathId, setPathId] = useState<string>("");
  const [steps, setSteps] = useState<Set<number>>(new Set());
  const [habits, setHabits] = useState<Set<number>>(new Set());
  const [shared, setShared] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const [thinking, startThinking] = useTransition();
  const [saving, startSaving] = useTransition();

  const path = plan?.paths.find((p) => p.id === pathId);

  const choosePath = (p: PlanPath) => {
    setPathId(p.id);
    setSteps(new Set(p.steps.map((_, i) => i)));
    setHabits(new Set(p.habits.map((_, i) => i)));
  };

  const ask = (withFeedback = false) =>
    startThinking(async () => {
      setErr("");
      try {
        const r = await planDream({ dream, hours, strengths, constraints, feedback: withFeedback ? feedback : undefined });
        if (r.error || !r.plan) return setErr(r.error ?? "Gagal menyusun rencana. Coba lagi ya.");
        setPlan(r.plan);
        setFeedback("");
        choosePath(r.plan.paths[0]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setErr("Koneksi terputus. Coba lagi sebentar lagi ya.");
      }
    });

  const save = () =>
    startSaving(async () => {
      if (!plan || !path) return;
      setErr("");
      try {
        const r = await applyPlan({
          dream: plan.dream,
          steps: path.steps.filter((_, i) => steps.has(i)),
          habits: path.habits.filter((_, i) => habits.has(i)),
          shared,
        });
        if (r.error) return setErr(r.error);
        setDone(r.ok ?? "Tersimpan.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        router.refresh();
      } catch {
        setErr("Gagal menyimpan. Coba lagi ya.");
      }
    });

  const toggle = (set: Set<number>, fn: (s: Set<number>) => void, i: number) => {
    const n = new Set(set);
    if (n.has(i)) n.delete(i);
    else n.add(i);
    fn(n);
  };

  // ------------------------------------------------------------ selesai
  if (done) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-6 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-teal-50 text-teal"><CheckCircle2 size={34} /></span>
        <h1 className="text-2xl font-extrabold">Rencanamu sudah jadi</h1>
        <p className="text-muted">{done}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/anak/roadmap" className="btn-primary px-6 py-3"><Route size={18} /> Lihat Roadmap</Link>
          <Link href="/anak/checkin" className="btn-ghost px-6 py-3"><Target size={18} /> Target Minggu Ini</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/anak/roadmap" className="grid size-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Kembali"><ArrowLeft size={18} /></Link>
        <div className="leading-tight">
          <p className="eyebrow text-coral-700">Rancang dengan PathFinder AI</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{plan ? plan.dream : "Dari impian ke langkah nyata"}</h1>
        </div>
      </div>

      {/* ------------------------------------------------- langkah 1: impian */}
      {!plan && (
        <section className="card space-y-5 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-coral text-white"><Compass size={22} /></span>
            <p className="text-muted">
              Hai {name}, tulis impianmu sesederhana apa pun. PathFinder akan mencari tahu apa saja yang dibutuhkan, menyiapkan beberapa jalur pilihan,
              lalu kamu yang memutuskan mana yang mau diambil.
            </p>
          </div>
          <div>
            <label className="label">Impianmu</label>
            <textarea value={dream} onChange={(e) => setDream(e.target.value)} maxLength={160} rows={2} className="input resize-none text-lg" placeholder="Contoh: pengen kuliah di MIT" />
            <div className="mt-2 flex flex-wrap gap-2">
              {EXAMPLES.map((x) => (
                <button key={x} type="button" onClick={() => setDream(x)} className="chip bg-sky px-3 py-1.5 text-xs text-ink/75 hover:bg-coral-50">{x}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Waktu luang per minggu untuk mengejar impian ini</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HOURS_OPTIONS.map((h) => (
                <button key={h} type="button" onClick={() => setHours(h)} className={`rounded-2xl py-2.5 text-sm font-semibold ${hours === h ? "bg-coral text-white" : "bg-sky"}`}>{h}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Kekuatan / minatmu (opsional)</label>
              <input value={strengths} onChange={(e) => setStrengths(e.target.value)} maxLength={200} className="input" placeholder="Contoh: suka Matematika, bisa ngoding dasar" />
            </div>
            <div>
              <label className="label">Kendala (opsional)</label>
              <input value={constraints} onChange={(e) => setConstraints(e.target.value)} maxLength={200} className="input" placeholder="Contoh: bahasa Inggris masih lemah" />
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-2xl bg-violet-50 p-3 text-xs text-violet">
            <Lock size={14} className="mt-0.5 shrink-0" />
            PathFinder juga memakai {grade ? `kelasmu (${grade}), ` : ""}energi check-in, target minggu ini, dan roadmap-mu supaya rencananya pas. Jurnal pribadimu tidak pernah dipakai.
          </p>
          {err && <p className="text-sm font-medium text-coral-700">{err}</p>}
          <button onClick={() => ask()} disabled={thinking || dream.trim().length < 4} className="btn-primary w-full py-3.5">
            {thinking ? <><Loader2 size={18} className="animate-spin" /> PathFinder sedang menyusun rencana…</> : <><Sparkles size={18} /> Susun Rencanaku</>}
          </button>
          {thinking && <p className="text-center text-xs text-muted">Biasanya butuh 10–30 detik. Jangan tutup halaman ini ya.</p>}
        </section>
      )}

      {/* ------------------------------------------------- langkah 2: hasil */}
      {plan && (
        <>
          <section className="card space-y-4 bg-gradient-to-br from-coral-50 to-white sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="chip bg-white text-coral-700"><Bot size={12} /> Analisis PathFinder</span>
              <span className="text-xs text-muted">{plan.source === "gemini" ? "Disusun oleh Gemini AI" : "Disusun oleh mesin perencana PathFinder"}</span>
            </div>
            <p className="text-lg leading-relaxed">{plan.analysis}</p>
            {plan.needs.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-bold"><ListChecks size={16} className="text-coral-700" /> Yang kamu butuhkan</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {plan.needs.map((n) => (
                    <li key={n} className="flex items-start gap-2 rounded-2xl bg-white p-3 text-sm shadow-sm"><Check size={15} className="mt-0.5 shrink-0 text-teal" /> {n}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Route size={20} className="text-coral-700" /> Pilih jalur yang paling cocok</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {plan.paths.map((p) => {
                const on = p.id === pathId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => choosePath(p)}
                    className={`card text-left transition ${on ? "ring-2 ring-coral" : "opacity-80 hover:opacity-100"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`chip ${EFFORT[p.effort].cls}`}>Usaha {EFFORT[p.effort].label}</span>
                      {on && <span className="grid size-6 place-items-center rounded-full bg-coral text-white"><Check size={14} /></span>}
                    </div>
                    <p className="mt-3 text-lg font-bold">{p.name}</p>
                    {p.fit && <p className="mt-1 text-xs font-semibold text-coral-700">{p.fit}</p>}
                    <p className="mt-2 text-sm text-muted">{p.summary}</p>
                    <p className="mt-3 text-xs text-muted">{p.steps.length} milestone · {p.habits.length} kebiasaan</p>
                  </button>
                );
              })}
            </div>
          </section>

          {path && (
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <section className="card space-y-4">
                <div>
                  <p className="flex items-center gap-2 font-bold"><Flag size={18} className="text-coral-700" /> Milestone berurutan</p>
                  <p className="mt-0.5 text-xs text-muted">Hapus centang yang tidak mau diambil.</p>
                </div>
                <ol className="space-y-3">
                  {path.steps.map((s, i) => {
                    const on = steps.has(i);
                    return (
                      <li key={i}>
                        <label className={`flex cursor-pointer gap-3 rounded-2xl p-4 ring-1 transition ${on ? "bg-white ring-coral/40" : "bg-sky/60 ring-line opacity-60"}`}>
                          <input type="checkbox" checked={on} onChange={() => toggle(steps, setSteps, i)} className="mt-1 size-4 shrink-0 accent-[var(--color-coral)]" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="grid size-6 place-items-center rounded-full bg-coral-100 text-xs font-bold text-coral-700">{i + 1}</span>
                              {s.period && <span className="chip bg-sky text-muted"><CalendarRange size={11} /> {s.period}</span>}
                              <span className={`chip ${s.priority === 1 ? "bg-coral-700 text-white" : s.priority === 2 ? "bg-violet-50 text-violet" : "bg-white text-muted ring-1 ring-line"}`}>{PRIORITY[s.priority]}</span>
                              {s.horizon === "jangka_panjang" && <span className="chip bg-amber/20 text-[#8a5a00]"><Trophy size={11} /> Jangka panjang</span>}
                            </span>
                            <b className="mt-2 block">{s.title}</b>
                            {s.detail && <span className="mt-0.5 block text-sm text-muted">{s.detail}</span>}
                            {s.tasks.length > 0 && (
                              <span className="mt-2 block space-y-1">
                                {s.tasks.map((t) => (
                                  <span key={t} className="flex items-start gap-2 text-sm"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" />{t}</span>
                                ))}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <div className="space-y-5">
                <section className="card space-y-3">
                  <p className="flex items-center gap-2 font-bold"><Repeat size={18} className="text-teal" /> Kebiasaan mingguan</p>
                  <p className="text-xs text-muted">Yang dicentang langsung masuk ke <b>target minggu ini</b>.</p>
                  {path.habits.map((h, i) => {
                    const on = habits.has(i);
                    return (
                      <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 ${on ? "bg-white ring-teal/30" : "bg-sky/60 ring-line opacity-60"}`}>
                        <input type="checkbox" checked={on} onChange={() => toggle(habits, setHabits, i)} className="size-4 shrink-0 accent-[var(--color-teal)]" />
                        <IconBadge v={CATEGORY_VISUAL[h.category]} size={16} box={32} rounded="rounded-xl" />
                        <span className="flex-1 text-sm"><b>{h.title}</b><br /><span className="text-xs text-muted">{h.target} {h.unit} per minggu</span></span>
                      </label>
                    );
                  })}
                  {path.habits.length === 0 && <p className="text-sm text-muted">Tidak ada kebiasaan khusus di jalur ini.</p>}
                </section>

                {plan.opportunities.length > 0 && (
                  <section className="card space-y-3">
                    <p className="flex items-center gap-2 font-bold"><Trophy size={18} className="text-amber" /> Lomba & peluang</p>
                    <ul className="space-y-2">
                      {plan.opportunities.map((o) => (
                        <li key={o.name} className="rounded-2xl bg-sky p-3 text-sm">
                          <b>{o.name}</b>
                          {o.window && <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-coral-700"><CalendarRange size={12} className="shrink-0" /> {o.window}</p>}
                          {o.why && <p className="mt-1 text-muted">{o.why}</p>}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted">Jadwal lomba bisa berubah tiap tahun. Selalu cek situs resmi penyelenggara sebelum mendaftar.</p>
                  </section>
                )}
              </div>
            </div>
          )}

          <section className="card space-y-4">
            <label className="flex items-start gap-3 rounded-2xl bg-teal-50 p-3 text-sm">
              <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--color-teal)]" />
              <span><b className="flex items-center gap-1.5"><Users size={14} /> Jadikan Agenda Bersama</b><span className="text-xs text-muted">Orang tua bisa melihat milestone ini dan mendapat saran cara mendukungmu. Kalau tidak dicentang, semuanya tetap pribadi.</span></span>
            </label>
            {err && <p className="text-sm font-medium text-coral-700">{err}</p>}
            <button onClick={save} disabled={saving || !path || steps.size === 0} className="btn-primary w-full py-3.5">
              {saving ? <><Loader2 size={18} className="animate-spin" /> Menyimpan…</> : <>Setuju, masukkan ke Roadmap <ArrowRight size={18} /></>}
            </button>

            <div className="rounded-2xl bg-sky p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold"><MessageSquare size={15} /> Kurang pas? Minta PathFinder merevisi</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={240} className="input" placeholder="Contoh: aku cuma bisa belajar di akhir pekan" />
                <button onClick={() => ask(true)} disabled={thinking || feedback.trim().length < 3} className="btn-ghost shrink-0 px-4 py-3">
                  {thinking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Revisi
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <button onClick={() => { setPlan(null); setErr(""); }} className="font-semibold text-muted underline">Ubah impian</button>
                <Link href="/anak/bicara/kopilot?mode=rencana" className="font-semibold text-coral-700 underline">Konsultasi lebih lanjut dengan Kopilot</Link>
              </div>
            </div>
          </section>
        </>
      )}
      {!ai && !plan && <p className="text-center text-[11px] text-muted">Mode simulasi: rencana disusun mesin perencana PathFinder. Hasil lebih personal saat Gemini AI aktif.</p>}
    </div>
  );
}
