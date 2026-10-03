"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Compass, Heart, Home, LineChart, Lock, MessageCircle, PenLine, Rocket, ShieldCheck, Sparkles, Handshake,
} from "lucide-react";

type Role = "child" | "parent";

function Steps({ step, role }: { step: number; role: Role }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 w-12 rounded-full ${i <= step ? (role === "child" ? "bg-coral" : "bg-teal") : "bg-line"}`} />
        ))}
      </div>
      <span className="text-xs font-bold tracking-wider text-muted">LANGKAH {step} DARI 3</span>
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("child");
  const router = useRouter();
  const next = () => router.push(`/daftar?peran=${role === "child" ? "anak" : "ortu"}`);

  return (
    <div data-role={role} className="min-h-dvh px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        {step === 1 && (
          <div className="animate-pop space-y-5">
            <Steps step={1} role={role} />
            <div className="flex flex-col gap-6 rounded-3xl bg-sky p-6 sm:flex-row sm:items-center sm:p-10">
              <div className="flex-1">
                <span className="chip bg-white text-coral-700">
                  <Heart size={12} className="fill-coral-700" /> Koneksi Tanpa Penghakiman
                </span>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Selamat Datang di <br />
                  <span className="text-coral">PathFinder AI</span>
                </h1>
                <p className="mt-3 max-w-md text-muted">
                  Satu aplikasi, dua sudut pandang. Membantu remaja merancang masa depan dan orang tua mendampingi dengan tenang.
                </p>
              </div>
              <div className="hidden size-40 shrink-0 place-items-center rounded-3xl bg-white text-7xl shadow-md sm:grid">🧭</div>
            </div>

            <p className="text-center text-sm font-semibold text-muted">Kamu menggunakan aplikasi ini sebagai…</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  { r: "child", icon: Compass, title: "Saya Remaja", tag: "OTONOM", sub: "Ruang Eksplorasi Pribadi",
                    body: "Catat targetmu, rencanakan cita-cita, dan kelola perasaanmu di ruang privat yang aman.",
                    chips: ["🔒 100% Privat", "✨ Smart Journal"] },
                  { r: "parent", icon: Home, title: "Saya Orang Tua", tag: "REFLEKSI", sub: "Panduan Pengasuhan Suportif",
                    body: "Pahami perkembangan anak tanpa kepo berlebihan dan dapatkan panduan pendampingan bermakna.",
                    chips: ["📈 Wawasan Empati", "🛡️ Menghormati Batasan"] },
                ] as const
              ).map((o) => {
                const active = role === o.r;
                const tone = o.r === "child" ? "coral" : "teal";
                return (
                  <button
                    key={o.r}
                    onClick={() => setRole(o.r)}
                    className={`card relative text-left transition ${active ? (tone === "coral" ? "ring-2 ring-coral" : "ring-2 ring-teal") : "hover:-translate-y-0.5"}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`grid size-12 place-items-center rounded-full ${tone === "coral" ? "bg-coral-100 text-coral-700" : "bg-teal-100 text-teal"}`}>
                        <o.icon size={22} />
                      </span>
                      <span className={`grid size-7 place-items-center rounded-full ${active ? (tone === "coral" ? "bg-coral text-white" : "bg-teal text-white") : "border-4 border-line"}`}>
                        {active && <Check size={16} />}
                      </span>
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-xl font-bold">
                      {o.title}
                      <span className={`chip ${tone === "coral" ? "bg-coral-100 text-coral-700" : "bg-teal-100 text-teal"}`}>{o.tag}</span>
                    </p>
                    <p className={`text-sm font-medium ${tone === "coral" ? "text-coral-700" : "text-teal"}`}>{o.sub}</p>
                    <p className="mt-2 text-sm text-muted">{o.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {o.chips.map((c) => (
                        <span key={c} className="chip bg-sky text-ink/80">{c}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-3 pt-2">
              <button onClick={() => setStep(2)} className="btn-primary w-full max-w-xs py-3.5">
                Lanjutkan sebagai {role === "child" ? "Remaja" : "Orang Tua"} <ArrowRight size={18} />
              </button>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Lock size={12} /> Peran dikunci per akun — anak & orang tua memakai perangkat masing-masing
              </p>
              <Link href="/masuk" className="text-sm font-semibold text-teal">Sudah punya akun? Masuk</Link>
            </div>
          </div>
        )}

        {step === 2 && role === "child" && (
          <div className="card animate-pop space-y-6 sm:p-10">
            <Steps step={2} role={role} />
            <div className="relative grid place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 via-sky to-coral-50 py-10">
              <span className="chip absolute top-4 bg-white text-violet"><Lock size={11} /> Privasi 100% Terjamin</span>
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-lg">
                <span className="grid size-11 place-items-center rounded-full bg-violet-100 text-violet"><ShieldCheck size={20} /></span>
                <span className="text-left text-sm leading-tight"><b>PathFinder</b><br /><span className="text-xs text-muted">● Jurnal Terenkripsi</span></span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Ruang pribadimu untuk refleksi — catatanmu tidak akan dibaca siapa pun</h2>
              <p className="mt-2 text-muted">Tempat aman untuk menumpahkan isi pikiranmu dengan tenang.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: PenLine, c: "bg-coral text-white", t: "Bebas Berekspresi", b: "Tulis hambatan, rasa lelah, atau mimpi terliarmu tanpa takut dihakimi." },
                { icon: Sparkles, c: "bg-violet-100 text-violet", t: "Filter Privasi AI", b: "Jurnalmu disimpan terenkripsi HANYA di HP-mu. Orang tua cuma melihat pola energi umum, tanpa isi tulisanmu." },
                { icon: Rocket, c: "bg-teal-100 text-teal", t: "Rencana Masa Depan", b: "Rancang cita-cita dan roadmap masa depanmu secara bertahap dan terarah." },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl bg-sky p-5">
                  <span className={`grid size-11 place-items-center rounded-full ${f.c}`}><f.icon size={19} /></span>
                  <p className="mt-3 font-bold">{f.t}</p>
                  <p className="mt-1 text-sm text-muted">{f.b}</p>
                </div>
              ))}
            </div>
            <Nav onBack={() => setStep(1)} onNext={next} label="Paham, Sangat Keren! ✨" />
          </div>
        )}

        {step === 2 && role === "parent" && (
          <div className="card animate-pop space-y-6 sm:p-10">
            <Steps step={2} role={role} />
            <div className="text-center">
              <span className="chip bg-teal-50 text-teal">🌱 Pendampingan Penuh Empati</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Memahami, bukan mengawasi</h2>
              <p className="mt-2 text-muted">Membangun koneksi hangat tanpa menembus batas privasi anak remaja Anda.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-teal-50 p-5">
                <p className="eyebrow text-teal">Yang Anda lihat</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {["Konsistensi refleksi harian", "Tren energi 7 hari", "Progres target mingguan (persen)", "Sinyal “siap berdiskusi” & topiknya"].map((x) => (
                    <li key={x} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-teal" /> {x}</li>
                  ))}
                </ul>
                <p className="eyebrow mt-5 text-coral-700">Yang TIDAK Anda lihat</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {["Isi jurnal & curhatan anak", "Catatan hambatan pribadi", "Roadmap yang tidak dibagikan anak"].map((x) => (
                    <li key={x} className="flex gap-2"><Lock size={15} className="mt-0.5 shrink-0 text-coral-700" /> {x}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-sky p-5">
                <p className="flex items-center gap-2 font-bold"><Heart size={18} className="fill-teal text-teal" /> Contoh Panduan Harian</p>
                <p className="mt-3 rounded-2xl bg-white p-4 text-sm italic text-ink/80">
                  “Alex sedang fokus pada target akademik minggu ini, namun energinya sedikit terkuras. Waktu yang baik untuk menyeduh teh hangat bersama tanpa membahas nilai ujian.”
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="chip bg-teal-100 text-teal">🌱 Saran Pendekatan Halus</span>
                  <span className="chip bg-white text-ink/70">Sentuhan Nyaman</span>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: LineChart, t: "Panduan Nyata", b: "Rekomendasi tindakan sesuai kondisi anak & waktu yang Anda miliki." },
                { icon: MessageCircle, t: "Ruang Tanpa Drama", b: "Obrolan penting dibuka saat kedua pihak sama-sama siap." },
                { icon: Handshake, t: "Bina Kepercayaan", b: "Menghormati batas pribadi anak menumbuhkan kemandiriannya." },
              ].map((f) => (
                <div key={f.t} className="rounded-2xl bg-sky p-4">
                  <p className="flex items-center gap-2 font-bold"><f.icon size={18} className="text-teal" /> {f.t}</p>
                  <p className="mt-1 text-sm text-muted">{f.b}</p>
                </div>
              ))}
            </div>
            <Nav onBack={() => setStep(1)} onNext={next} label="Mulai Dampingi Anak 💛" />
          </div>
        )}
      </div>
    </div>
  );
}

function Nav({ onBack, onNext, label }: { onBack: () => void; onNext: () => void; label: string }) {
  return (
    <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
      <button onClick={onBack} className="btn-ghost"><ArrowLeft size={16} /> Kembali</button>
      <button onClick={onNext} className="btn-primary min-w-64 py-3.5">{label}</button>
    </div>
  );
}
