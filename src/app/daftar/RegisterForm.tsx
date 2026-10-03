"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AtSign, Eye, EyeOff, Home, IdCard, KeyRound, Link2, Lock, ShieldCheck, Smile, UserPlus } from "lucide-react";
import { register } from "@/actions/auth";

type Role = "child" | "parent";

export default function RegisterForm({ initialRole, initialCode }: { initialRole: Role; initialCode: string }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [mode, setMode] = useState<"buat" | "gabung">(initialCode ? "gabung" : initialRole === "child" ? "gabung" : "buat");
  const [show, setShow] = useState(false);
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <div data-role={role} className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -top-10 left-0 size-96 rounded-full bg-coral-100/60 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 size-96 rounded-full bg-teal-100/70 blur-3xl" />

      <form action={action} className="card relative w-full max-w-4xl space-y-6 sm:p-8">
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="familyMode" value={mode} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="chip bg-primary-soft text-primary-strong">Langkah 3 dari 3</span>
          <span className="chip bg-violet-50 text-violet"><ShieldCheck size={12} /> Privasi Terlindungi</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Selamat Datang di PathFinder</h1>
          <p className="mt-1 text-sm text-muted">Ruang aman yang menghubungkan impianmu dengan dukungan hangat keluarga tercinta.</p>
        </div>

        <div className="inline-flex rounded-full bg-sky p-1.5 text-sm font-semibold">
          {([["child", "Daftar sebagai Anak", Smile], ["parent", "Daftar sbg Orang Tua", Home]] as const).map(([r, l, Icon]) => (
            <button
              type="button"
              key={r}
              onClick={() => { setRole(r); setMode(r === "child" ? "gabung" : "buat"); }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition ${role === r ? "bg-primary text-white shadow" : "text-muted"}`}
            >
              <Icon size={16} /> {l}
            </button>
          ))}
        </div>

        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4 rounded-3xl bg-sky/70 p-5">
            <p className="flex items-center gap-2 font-bold"><span className="size-2 rounded-full bg-primary" /> Data Akun Personal</p>
            <Field label="Nama Panggilan" icon={IdCard}>
              <input name="name" required minLength={2} maxLength={40} className="input pl-11" placeholder={role === "child" ? "Contoh: Shan" : "Contoh: Bu Putri"} />
            </Field>
            {role === "child" ? (
              <Field label="Kelas / Sekolah (opsional)" icon={Smile}>
                <input name="grade" maxLength={30} className="input pl-11" placeholder="Contoh: Kelas 11" />
              </Field>
            ) : (
              <div>
                <label className="label">Saya adalah</label>
                <div className="flex gap-2">
                  {["Ibu", "Ayah", "Wali"].map((r, i) => (
                    <label key={r} className="flex-1">
                      <input type="radio" name="relation" value={r} defaultChecked={i === 0} className="peer sr-only" />
                      <span className="block cursor-pointer rounded-2xl border border-line bg-white py-2.5 text-center text-sm font-semibold peer-checked:border-primary peer-checked:bg-primary-faint peer-checked:text-primary-strong">{r}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Field label="Email" icon={AtSign}>
              <input name="email" type="email" required autoComplete="email" className="input pl-11" placeholder="nama@email.com" />
            </Field>
            <Field label="Kata Sandi" icon={KeyRound}>
              <input name="password" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" className="input px-11" placeholder="Minimal 8 karakter" />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" aria-label="Lihat sandi">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>
            {role === "child" && (
              <p className="flex items-start gap-2 text-xs text-teal"><Lock size={14} className="mt-0.5 shrink-0" /> Jurnal pribadi & catatan harianmu tidak dapat dibaca siapa pun tanpa izinmu.</p>
            )}
          </div>

          <div className="space-y-4 rounded-3xl bg-gradient-to-br from-teal-50 to-sky p-5">
            <p className="flex items-center gap-2 eyebrow text-teal"><span className="grid size-8 place-items-center rounded-full bg-teal-100"><UserPlus size={15} /></span> Tautan Rumah</p>
            <div>
              <p className="font-bold">Hubungkan dengan Keluarga</p>
              <p className="mt-1 text-xs text-muted">Satu kode keluarga menghubungkan HP anak dan HP orang tua.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button type="button" onClick={() => setMode("buat")} className={`rounded-2xl px-3 py-2.5 ${mode === "buat" ? "bg-primary text-white" : "bg-white text-muted"}`}>Buat kode baru</button>
              <button type="button" onClick={() => setMode("gabung")} className={`rounded-2xl px-3 py-2.5 ${mode === "gabung" ? "bg-primary text-white" : "bg-white text-muted"}`}>Saya punya kode</button>
            </div>
            {mode === "gabung" ? (
              <div>
                <label className="label">Kode Penghubung (6 karakter)</label>
                <input
                  name="code"
                  defaultValue={initialCode}
                  required
                  maxLength={6}
                  autoCapitalize="characters"
                  className="input text-center font-mono text-2xl font-bold tracking-[.5em] uppercase"
                  placeholder="PATH07"
                />
                <p className="mt-2 text-xs text-muted">Minta kode ini dari {role === "child" ? "orang tuamu" : "anak Anda"} (ada di menu Profil).</p>
              </div>
            ) : (
              <p className="rounded-2xl bg-white p-4 text-sm text-muted">
                Kode keluarga baru akan dibuat otomatis setelah daftar. Bagikan kodenya ke {role === "child" ? "orang tuamu" : "anak Anda"} supaya bisa terhubung.
              </p>
            )}
            <p className="flex items-start gap-2 rounded-2xl bg-white/70 p-3 text-xs text-muted">
              <Link2 size={14} className="mt-0.5 shrink-0 text-violet" /> Tautan ini hanya menyinkronkan pola energi, progres target, dan sinyal diskusi — bukan isi jurnal.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="agree" required className="size-4 accent-[var(--primary)]" />
            Saya setuju dengan <span className="font-semibold text-primary-strong">Piagam Privasi & Keamanan Remaja</span>
          </label>
          {state?.error && <p className="rounded-xl bg-coral-50 px-4 py-2 text-sm font-medium text-coral-700">{state.error}</p>}
          <button disabled={pending} className="btn-primary w-full max-w-sm py-3.5">
            {pending ? "Membuat akun…" : "Buat Akun & Mulai Melangkah 🚀"}
          </button>
          <p className="text-sm text-muted">
            Sudah punya akun? <Link href="/masuk" className="font-semibold text-teal">Masuk di sini</Link>
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        {children}
      </div>
    </div>
  );
}
