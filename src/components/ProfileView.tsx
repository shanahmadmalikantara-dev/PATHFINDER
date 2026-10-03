import { Bot, LogOut, Lock, ShieldCheck, Sparkles, Users } from "lucide-react";
import { logout } from "@/actions/auth";
import type { User } from "@/lib/db";
import CopyCode from "./CopyCode";
import InstallButton from "./InstallButton";

/** Halaman Profil & Keamanan Akun (dipakai Mode Anak & Mode Orang Tua). */
export default function ProfileView({
  me,
  family,
  isNew,
  settings,
}: {
  me: User;
  family: { code: string; members: User[] } | null;
  isNew: boolean;
  settings?: React.ReactNode;
}) {
  const child = me.role === "child";
  const others = family?.members.filter((m) => m.role !== me.role) ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-strong"><ShieldCheck size={26} /></span>
        <div className="flex-1">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight">Profil & Keamanan <span className="chip bg-teal-100 text-teal">● Aktif</span></h1>
          <p className="text-muted">Kelola keluarga, batas privasi, dan pengaturan akun.</p>
        </div>
        <span className="chip bg-white px-4 py-2 text-sm shadow-sm"><span className="size-2 rounded-full bg-primary" /> Mode {child ? "Anak" : "Orang Tua"} (terkunci per akun)</span>
      </header>

      {isNew && family && (
        <div className="animate-pop rounded-3xl bg-gradient-to-r from-primary-soft to-sky p-5">
          <p className="text-lg font-bold">🎉 Akun berhasil dibuat!</p>
          <p className="text-sm text-ink/80">Langkah terakhir: bagikan kode keluarga di bawah ke {child ? "orang tuamu" : "anak Anda"} supaya kedua HP saling terhubung.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <section className="card relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-40 rounded-full bg-teal-100/60 blur-2xl" />
            <div className="relative flex flex-wrap items-start gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-primary text-2xl font-bold text-white">{me.name[0]?.toUpperCase()}</span>
              <div className="flex-1">
                <p className="text-xl font-bold">{me.name}</p>
                <p className="text-sm text-muted">{me.email}</p>
                <p className="text-sm text-muted">{child ? me.grade ?? "Remaja" : me.relation ?? "Orang Tua"}</p>
              </div>
            </div>
            {family ? (
              <div className="relative mt-5 grid gap-4 rounded-3xl bg-sky p-5 sm:grid-cols-2">
                <div>
                  <p className="eyebrow mb-2 text-muted">🔑 Kode Keluarga</p>
                  <CopyCode code={family.code} />
                </div>
                <div>
                  <p className="eyebrow mb-2 flex items-center gap-1.5 text-muted"><Users size={13} /> Terhubung dengan</p>
                  {others.length === 0 ? (
                    <p className="text-sm text-muted">Belum ada {child ? "orang tua" : "anak"} yang bergabung. Bagikan kodenya ya!</p>
                  ) : (
                    <ul className="space-y-2">
                      {others.map((o) => (
                        <li key={o.id} className="flex items-center gap-2 text-sm">
                          <span className={`grid size-8 place-items-center rounded-full text-xs font-bold text-white ${o.role === "child" ? "bg-coral" : "bg-teal"}`}>{o.name[0]}</span>
                          <b>{o.name}</b> <span className="text-muted">• {o.role === "child" ? o.grade ?? "Anak" : o.relation ?? "Orang Tua"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">Akun belum terhubung ke keluarga.</p>
            )}
          </section>

          <section className="card space-y-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-bold"><span className="size-2.5 rounded-full bg-violet" /> Batas Privasi & Kepercayaan 🛡️</p>
              <span className="chip bg-violet-100 text-violet">ZERO-SPYING</span>
            </div>
            <p className="text-sm text-muted">Arsitektur privasi terpisah memastikan ekspresi murni remaja tetap terlindungi tanpa menghilangkan kemampuan orang tua memberi dukungan.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Lock, n: "Langkah 1", t: "Jurnal Remaja", b: "Terenkripsi AES-256, hanya di HP anak", c: "bg-violet-50 text-violet" },
                { icon: Bot, n: "Langkah 2", t: "Filter AI", b: "Hanya angka energi, mood & progres yang diproses", c: "bg-teal-50 text-teal" },
                { icon: Sparkles, n: "Langkah 3", t: "Wawasan Empati", b: "Ortu menerima saran tindakan, bukan teks curhat", c: "bg-coral-50 text-coral-700" },
              ].map((s) => (
                <div key={s.t} className={`rounded-2xl p-4 ${s.c}`}>
                  <div className="flex items-center justify-between"><s.icon size={20} /><span className="chip bg-white">{s.n}</span></div>
                  <p className="mt-3 font-bold text-ink">{s.t}</p>
                  <p className="text-xs">{s.b}</p>
                </div>
              ))}
            </div>
            <p className="rounded-2xl bg-violet-50 p-4 text-sm text-violet">
              ℹ️ Catatan curhatan dan jurnal anak tersimpan terenkripsi di perangkat anak dan <b>tidak pernah dikirim ke server</b> maupun ditampilkan ke orang tua. Orang tua hanya menerima saran empati berbasis tren secara agregat.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card space-y-4">
            <p className="eyebrow text-muted">Kontrol Sistem</p>
            {settings}
            <div className="rounded-2xl bg-sky p-4">
              <p className="mb-2 text-sm font-bold">Pasang sebagai Aplikasi</p>
              <InstallButton />
            </div>
            <form action={logout}>
              <button className="btn w-full bg-coral-100 text-coral-700 hover:bg-coral-100/70"><LogOut size={16} /> Keluar dari Sesi</button>
            </form>
            <p className="text-center text-xs text-muted">PathFinder AI v1.0 (MVP) • Ruang Aman Tanpa Menghakimi</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
