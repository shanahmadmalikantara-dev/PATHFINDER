import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Lock, MessageCircleHeart, Route, ShieldCheck, Smartphone, Smile, Sparkles, Users } from "lucide-react";
import { demoLogin } from "@/actions/auth";
import { getUser } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Demo untuk Juri",
  description: "Coba PathFinder AI tanpa daftar: masuk sebagai remaja atau orang tua dengan satu ketukan.",
  robots: { index: false },
};

const TRY = [
  { icon: Smile, title: "Check-in energi", body: "Di sisi Anak, pilih tingkat energi. Grafik & panduan di sisi Orang Tua ikut berubah." },
  { icon: MessageCircleHeart, title: "Ruang Bicara dua arah", body: "Anak menekan “Saya Siap Berdiskusi”, orang tua langsung mendapat ajakan dan bisa membalas." },
  { icon: Route, title: "Rancang dengan AI", body: "Di Roadmap, tulis impian (mis. “Pengen kuliah di MIT”) dan lihat jalur yang disusun AI." },
];

export default async function DemoPage() {
  const user = await getUser();
  const enabled = process.env.DEMO_MODE === "true";
  const current = user?.email === "shan@demo.id" ? "child" : user?.email === "putri@demo.id" ? "parent" : null;

  return (
    <main className="relative min-h-dvh overflow-hidden px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-teal-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-40 size-96 rounded-full bg-coral-100/70 blur-3xl" />

      <div className="relative mx-auto max-w-md space-y-5">
        <header className="text-center">
          <LogoMark size={72} className="mx-auto rounded-2xl shadow" />
          <span className="chip mt-4 bg-violet-50 text-violet"><Sparkles size={12} /> Demo untuk Juri</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            PathFinder <span className="text-coral-700">AI</span>
          </h1>
          <p className="mt-1 font-semibold text-teal italic">“Dari Mengawasi Menuju Memahami”</p>
          <p className="mt-3 text-sm text-muted">
            Satu aplikasi, dua sudut pandang. Pilih mau mencoba sebagai siapa, tanpa perlu daftar.
          </p>
        </header>

        {enabled ? (
          <section className="space-y-3" aria-label="Pilih mode demo">
            <form action={demoLogin.bind(null, "child")}>
              <button className="flex w-full items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-md ring-2 ring-transparent transition hover:ring-coral active:scale-[0.99]">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-coral-100 text-coral-700"><Smile size={28} /></span>
                <span className="flex-1">
                  <b className="block text-lg">Coba sebagai Anak</b>
                  <span className="text-sm text-muted">Shan, kelas 11 · check-in, jurnal, roadmap</span>
                </span>
                {current === "child" ? <span className="chip bg-coral-100 text-coral-700">Aktif</span> : <ArrowRight className="text-coral-700" />}
              </button>
            </form>
            <form action={demoLogin.bind(null, "parent")}>
              <button className="flex w-full items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-md ring-2 ring-transparent transition hover:ring-teal active:scale-[0.99]">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-teal-100 text-teal"><HeartHandshake size={28} /></span>
                <span className="flex-1">
                  <b className="block text-lg">Coba sebagai Orang Tua</b>
                  <span className="text-sm text-muted">Bu Putri · insight, panduan, Ruang Bicara</span>
                </span>
                {current === "parent" ? <span className="chip bg-teal-100 text-teal">Aktif</span> : <ArrowRight className="text-teal" />}
              </button>
            </form>
            <p className="flex items-start gap-2 rounded-2xl bg-white/80 p-3 text-xs text-muted">
              <Smartphone size={16} className="mt-0.5 shrink-0 text-violet" />
              <span><b className="text-ink">Paling seru pakai 2 HP:</b> satu sebagai Anak, satu sebagai Orang Tua. Dengan 1 HP, pindah mode lewat tombol “Lihat sisi …” di bagian atas aplikasi.</span>
            </p>
          </section>
        ) : (
          <section className="card space-y-3 text-center">
            <p className="font-semibold">Mode demo sedang tidak aktif.</p>
            <Link href="/masuk" className="btn-primary w-full py-3">Masuk dengan akun</Link>
          </section>
        )}

        <section className="card space-y-3">
          <p className="flex items-center gap-2 font-bold"><Users size={18} className="text-teal" /> Yang bisa langsung dicoba</p>
          <ol className="space-y-3">
            {TRY.map((t, i) => (
              <li key={t.title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-50 text-sm font-bold text-teal">{i + 1}</span>
                <span className="text-sm">
                  <b className="flex items-center gap-1.5"><t.icon size={15} className="text-teal" /> {t.title}</b>
                  <span className="text-muted">{t.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <p className="flex items-start gap-2 rounded-2xl bg-violet-50 p-4 text-xs text-violet">
          <Lock size={14} className="mt-0.5 shrink-0" />
          <span>Jurnal anak dienkripsi di HP dan tidak pernah dikirim ke server. Orang tua hanya melihat ringkasan energi, mood, dan progres.</span>
        </p>
        <p className="flex items-center justify-center gap-1.5 pb-4 text-center text-xs text-muted">
          <ShieldCheck size={13} /> Akun demo berisi data contoh, bukan data siswa asli.
        </p>
      </div>
    </main>
  );
}
