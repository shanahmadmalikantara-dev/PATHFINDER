import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight, BookOpen, CheckCircle2, Clock, Eye, HeartHandshake, Lightbulb, Lock, MessageSquare, Quote, ShieldAlert, Sparkles, XCircle,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getCheckins, getChildForParent, getFamily, getWeekGoals, goalsPercent } from "@/lib/data";
import { greeting, shortDate, today } from "@/lib/dates";
import { analyze, type ParentInsight } from "@/lib/insight";
import { geminiEnabled, personalizeGuide } from "@/lib/gemini";
import { energyLabel } from "@/lib/constants";
import { EnergyChart, ProgressBar, ProgressRing } from "@/components/Charts";
import CopyCode from "@/components/CopyCode";
import CapabilityPicker from "./CapabilityPicker";

export const metadata = { title: "Beranda Orang Tua" };

export default async function ParentHome({ searchParams }: { searchParams: Promise<{ anak?: string }> }) {
  const me = await requireRole("parent");
  const { child, children } = getChildForParent(me, (await searchParams).anak);

  if (!child) {
    const fam = getFamily(me.family_id);
    return (
      <div className="mx-auto max-w-xl space-y-5 py-6 text-center">
        <p className="text-5xl">🔗</p>
        <h1 className="text-2xl font-extrabold">Hubungkan dengan anak Anda</h1>
        <p className="text-muted">Minta anak Anda mendaftar di HP-nya dan memasukkan kode keluarga berikut. Setelah terhubung, wawasan perkembangan akan muncul di sini.</p>
        {fam && <div className="card inline-block text-left"><CopyCode code={fam.code} /></div>}
      </div>
    );
  }

  const checkins = getCheckins(child.id, 14);
  const goals = getWeekGoals(child.id);
  const gp = goalsPercent(goals);
  const ins = analyze({ childName: child.name, checkins, goals, goalsPercent: gp, capability: me.capability });
  const talk = getActiveTalk(child.id);
  const last = checkins[checkins.length - 1];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{greeting()}, {me.name} 🌸</h1>
          <p className="mt-1 max-w-xl text-muted">Berikut wawasan perkembangan {child.name} yang dirangkum dengan penuh rasa hormat dan empati.</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="chip bg-violet-50 text-violet"><Lock size={12} /> Batas Privasi Anak Aktif</span>
          <span className="chip bg-teal-50 text-teal"><Eye size={12} /> Transparansi Terjaga</span>
        </div>
      </header>

      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((c) => (
            <Link key={c.id} href={`/ortu?anak=${c.id}`} className={`chip px-4 py-2 text-sm ${c.id === child.id ? "bg-teal text-white" : "bg-white"}`}>{c.name}</Link>
          ))}
        </div>
      )}

      {/* Kartu anak */}
      <section className="card flex flex-wrap items-center gap-4">
        <span className="relative grid size-14 place-items-center rounded-full bg-teal-300/50 text-2xl">
          😊<span className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-white bg-teal" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold">{child.name} ✏️</p>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {child.grade ?? "Remaja"}
            {last ? (
              <span className="chip bg-teal-50 text-teal">● Check-in terakhir: {last.date === today() ? "hari ini" : shortDate(last.date)}</span>
            ) : (
              <span className="chip bg-sky text-muted">Belum ada check-in</span>
            )}
          </p>
        </div>
        <div className="rounded-2xl bg-sky px-4 py-2 text-sm">
          <span className="text-xs text-muted">Kondisi Mood</span><br />
          <b className="text-teal">{ins.mood.label}</b>
        </div>
      </section>

      {/* Sinyal diskusi */}
      {talk?.status === "menunggu" && (
        <Link href="/ortu/bicara" className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-teal to-teal-700 p-5 text-white shadow-lg">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/20 text-2xl">🎉</span>
          <span className="flex-1"><b className="block text-lg">{child.name} siap berdiskusi!</b><span className="text-sm text-white/80">Topik: {(JSON.parse(talk.topics) as string[]).join(", ")} • {talk.preferred_time}</span></span>
          <ArrowRight />
        </Link>
      )}

      {ins.care && (
        <div className="flex items-start gap-3 rounded-3xl bg-coral-50 p-5 text-sm">
          <ShieldAlert size={22} className="shrink-0 text-coral-700" />
          <p><b className="text-coral-700">Butuh perhatian ekstra.</b> Beberapa hari terakhir energi dan suasana hati {child.name} cenderung rendah. Ini <b>bukan diagnosis</b> — tetapi bila berlanjut lebih dari dua minggu, pertimbangkan berdiskusi dengan guru BK atau psikolog.</p>
        </div>
      )}

      {/* Metrik */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow flex items-center gap-2"><span className="size-2 rounded-full bg-teal" /> Metrik & Tren Kunci Mingguan</p>
          <p className="text-xs font-semibold text-muted">Data teragregasi 7 hari terakhir</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card">
            <Head title="Konsistensi" tag={ins.consistency.label} />
            <div className="my-3 grid place-items-center">
              <ProgressRing percent={ins.consistency.percent} size={120} stroke={11}>
                <span><b className="text-2xl">{ins.consistency.percent}%</b><br /><span className="text-[10px] font-bold text-muted">MINGGUAN</span></span>
              </ProgressRing>
            </div>
            <Note>{ins.consistency.note}</Note>
          </div>
          <div className="card">
            <Head title="Tren Energi" tag={ins.energy.label} />
            <div className="my-3"><EnergyChart series={ins.energy.series} days={ins.energy.days} /></div>
            <Note>{ins.energy.today ? `Hari ini: ${energyLabel(ins.energy.today)}. ` : ""}{ins.energy.note}</Note>
          </div>
          <div className="card">
            <Head title="Progres Target" tag={ins.goals.label} />
            <p className="mt-4"><b className="text-4xl">{ins.goals.percent}%</b> <span className="text-sm text-muted">target minggu ini</span></p>
            <ProgressBar percent={ins.goals.percent} className="mt-3 h-3" />
            <p className="mt-3 text-xs text-muted">{goals.length} target aktif • detail target tetap milik {child.name}</p>
            <Note>{ins.goals.note}</Note>
          </div>
        </div>
      </section>

      {/* Panduan */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        <section className="relative overflow-hidden rounded-3xl bg-teal p-6 text-white shadow-xl shadow-teal/20">
          <div className="absolute -top-10 -right-10 size-40 rounded-full bg-teal-300/20 blur-2xl" />
          <div className="flex items-start justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Lightbulb size={20} /> Panduan Tindakan Parenting</h2>
            <span className="chip bg-teal-300 text-teal-700">FOKUS: {ins.focus.toUpperCase()}</span>
          </div>
          <Suspense fallback={<GuideBox text={ins.guide} ai={false} loading={geminiEnabled()} />}>
            <Guide ins={ins} familyId={me.family_id!} childName={child.name} relation={me.relation ?? "Orang tua"} />
          </Suspense>
          <p className="mt-4 flex items-start gap-2 text-xs text-white/70"><Sparkles size={14} className="shrink-0" /> Analisis Pola Mingguan PathFinder AI • disusun dari data agregat, tanpa membaca jurnal anak. Bukan diagnosis.</p>
          <Link href="/ortu/bicara" className="btn mt-5 bg-teal-300 text-teal-700 hover:brightness-105">Buka Ruang Bicara <ArrowRight size={16} /></Link>
        </section>

        <div className="space-y-5">
          <section className="card">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-bold">Hal yang Sebaiknya Dihindari vs Lebih Baik Digunakan</h2>
              <span className="chip bg-sky text-muted">Panduan Komunikasi</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-coral-50 p-4">
                <p className="eyebrow flex items-center gap-1.5 text-coral-700"><XCircle size={14} /> Hindari mengatakan</p>
                <p className="mt-2 text-sm italic">{ins.avoid}</p>
              </div>
              <div className="rounded-2xl bg-teal-50 p-4">
                <p className="eyebrow flex items-center gap-1.5 text-teal"><CheckCircle2 size={14} /> Lebih baik gunakan</p>
                <p className="mt-2 text-sm italic">{ins.better}</p>
              </div>
            </div>
          </section>
          <section className="card">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold"><MessageSquare size={18} /> Mulai Topik Percakapan</h2>
              <span className="text-xs font-semibold text-muted">Pemantik santai tanpa memicu defensif</span>
            </div>
            <ol className="mt-4 space-y-2">
              {ins.starters.map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-sky px-4 py-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-100 font-bold text-teal">{i + 1}</span> {s}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* Capability filter */}
      <section className="card space-y-5 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="chip bg-teal-50 text-teal"><Clock size={12} /> KONEKSI BERKESADARAN</span>
            <h2 className="mt-2 text-2xl font-bold">Kapasitas Waktu Anda Hari Ini ⏱️</h2>
            <p className="text-sm text-muted">Setiap orang tua memiliki hari yang berbeda. Sesuaikan bentuk dukungan Anda dengan waktu yang tersedia.</p>
          </div>
        </div>
        <CapabilityPicker value={me.capability} />
        <p className="flex items-start gap-3 rounded-3xl bg-teal-50 p-5 text-lg font-medium text-ink/80 italic">
          <Quote size={22} className="shrink-0 text-teal" /> Bukan kuantitas jam, melainkan kehadiran penuh yang membuat anak merasa didengar dan divalidasi.
        </p>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">Saran Disesuaikan</h3>
          <span className="text-xs font-semibold text-teal">3 Rekomendasi Terkurasi</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {ins.plan.map((p, i) => (
            <div key={i} className="flex flex-col rounded-3xl bg-sky p-5">
              <div className="flex justify-between text-[11px] font-bold tracking-wider text-teal"><span>LANGKAH {i + 1}</span><span className="text-muted">{p.minutes}</span></div>
              <p className="mt-2 font-bold">{p.title}</p>
              <p className="mt-2 flex-1 text-sm text-muted">{p.body}</p>
              <span className="chip mt-4 w-fit bg-white text-ink/80">{p.tag}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 pb-4 text-center text-xs text-muted">
        <BookOpen size={14} /> Insight ini membantu Anda memahami, bukan mengawasi. <HeartHandshake size={14} />
      </p>
    </div>
  );
}

async function Guide({ ins, familyId, childName, relation }: { ins: ParentInsight; familyId: number; childName: string; relation: string }) {
  const ai = await personalizeGuide({
    familyId,
    childName,
    parentRelation: relation,
    facts: {
      "Situasi utama": ins.focus,
      "Konsistensi check-in 7 hari": `${ins.consistency.percent}% (${ins.consistency.label})`,
      "Tren energi": ins.energy.label,
      "Progres target mingguan": `${ins.goals.percent}% (${ins.goals.label})`,
      "Suasana hati umum": ins.mood.label,
    },
    baseGuide: ins.guide,
  });
  return <GuideBox text={ai ?? ins.guide} ai={!!ai} />;
}

function GuideBox({ text, ai, loading }: { text: string; ai: boolean; loading?: boolean }) {
  return (
    <div className="mt-5 rounded-2xl bg-white/10 p-5">
      <p className="text-[17px] leading-relaxed italic">“{text}”</p>
      {(ai || loading) && <p className="mt-3 text-xs font-semibold text-teal-300">{loading ? "✨ Gemini sedang mempersonalisasi…" : "✨ Dipersonalisasi oleh Gemini AI"}</p>}
    </div>
  );
}

function Head({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="font-semibold">{title}</p>
      <span className="chip bg-teal-50 text-teal">{tag}</span>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 flex items-start gap-1.5 text-xs text-muted"><CheckCircle2 size={14} className="shrink-0 text-teal" /> {children}</p>;
}
