"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Home, Smile, Sparkles } from "lucide-react";
import { demoLogin, login } from "@/actions/auth";
import { LogoMark } from "@/components/Logo";

export default function LoginForm({ demo, demoMissing }: { demo: boolean; demoMissing: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-20 -left-20 size-96 rounded-full bg-teal-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 size-96 rounded-full bg-coral-100/70 blur-3xl" />
      <div className="relative w-full max-w-md space-y-4">
        <form action={action} className="card space-y-4 sm:p-8">
          <Link href="/" className="mx-auto block w-fit"><LogoMark size={64} className="rounded-2xl shadow" /></Link>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">Selamat datang kembali 👋</h1>
            <p className="mt-1 text-sm text-muted">Masuk ke ruang tumbuh keluargamu.</p>
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required autoComplete="email" className="input" placeholder="nama@email.com" />
          </div>
          <div>
            <label className="label">Kata Sandi</label>
            <input name="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" />
          </div>
          {state?.error && <p className="rounded-xl bg-coral-50 px-4 py-2 text-sm font-medium text-coral-700">{state.error}</p>}
          <button disabled={pending} className="btn-primary w-full py-3.5">{pending ? "Masuk…" : "Masuk"}</button>
          <p className="text-center text-sm text-muted">
            Belum punya akun? <Link href="/mulai" className="font-semibold text-teal">Daftar di sini</Link>
          </p>
        </form>

        {demo && (
          <div className="card space-y-3">
            <p className="flex items-center gap-2 text-sm font-bold"><Sparkles size={16} className="text-violet" /> Coba akun demo (untuk presentasi)</p>
            {demoMissing && <p className="text-xs text-coral-700">Akun demo belum dibuat. Jalankan <code>npm run seed</code> di server.</p>}
            <div className="grid grid-cols-2 gap-2">
              <form action={demoLogin.bind(null, "child")}>
                <button className="btn w-full bg-coral-50 text-coral-700 hover:bg-coral-100"><Smile size={16} /> Shan (Anak)</button>
              </form>
              <form action={demoLogin.bind(null, "parent")}>
                <button className="btn w-full bg-teal-50 text-teal hover:bg-teal-100"><Home size={16} /> Bu Putri (Ortu)</button>
              </form>
            </div>
            <p className="text-xs text-muted">Buka akun anak di satu HP dan akun orang tua di HP lain untuk melihat Dual-Mode bekerja.</p>
          </div>
        )}
      </div>
    </div>
  );
}
