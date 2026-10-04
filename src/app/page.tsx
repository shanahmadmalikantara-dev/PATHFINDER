import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Heart, Lock, ShieldCheck, Smile, Sparkles } from "lucide-react";
import { getUser, homeFor } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import PartnerLogos from "@/components/PartnerLogos";

export default async function Landing() {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* latar blob lembut */}
      <div className="pointer-events-none absolute -top-20 -left-32 size-[28rem] rounded-full bg-teal-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-40 size-[30rem] rounded-full bg-coral-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 size-[26rem] rounded-full bg-violet-100/60 blur-3xl" />

      <div className="absolute top-28 left-10 hidden animate-float items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-lg xl:flex">
        <span className="grid size-9 place-items-center rounded-full bg-coral-100 text-coral-700">
          <Heart size={16} />
        </span>
        <span className="text-xs leading-tight">
          <b className="block">Jurnal Pribadi Anak</b>
          <span className="text-muted">Terenkripsi & hanya di HP-mu</span>
        </span>
      </div>
      <div className="absolute right-12 bottom-24 hidden rotate-2 animate-float items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-lg [animation-delay:1.5s] xl:flex">
        <span className="grid size-9 place-items-center rounded-full bg-teal-100 text-teal">
          <Sparkles size={16} />
        </span>
        <span className="text-xs leading-tight">
          <b className="block">Wawasan Orang Tua</b>
          <span className="text-muted">Panduan Tanpa Menghakimi</span>
        </span>
      </div>

      <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-5 py-12 text-center">
        <span className="chip bg-coral-100 text-coral-700">
          <span className="size-1.5 rounded-full bg-coral" /> RUANG AMAN KELUARGA
        </span>
        <div className="mt-6 grid size-32 place-items-center rounded-full bg-white shadow-[0_0_0_10px_rgba(142,227,214,.25),0_20px_50px_-15px_rgba(27,107,99,.45)]">
          <LogoMark size={96} className="rounded-full" />
        </div>
        <span className="chip mt-3 bg-teal-50 text-teal">
          <Heart size={12} className="fill-coral text-coral" /> Empati AI
        </span>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
          PathFinder <span className="text-coral">AI</span>
        </h1>
        <p className="mt-4 rounded-full bg-white px-5 py-2 text-lg font-semibold text-teal italic shadow-sm">
          “Dari Mengawasi Menuju Memahami”
        </p>
        <p className="mt-5 max-w-md text-muted">
          Ruang tumbuh bersama untuk remaja dan orang tua — aman, privat, dan penuh empati.
        </p>

        <Link href="/mulai" className="btn-primary mt-8 px-10 py-4 text-lg" data-role="child">
          Mulai Melangkah <ArrowRight size={20} />
        </Link>
        <p className="mt-4 text-sm text-muted">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="font-semibold text-teal underline-offset-4 hover:underline">
            Masuk di sini
          </Link>
        </p>

        <div className="mt-10 grid w-full gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm font-bold text-coral-700">
              <Smile size={16} /> Mode Anak
            </p>
            <p className="mt-1 text-sm text-muted">Ekspresikan perasaan & rancang masa depan tanpa cemas diawasi.</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm font-bold text-teal">
              <ShieldCheck size={16} /> Mode Orang Tua
            </p>
            <p className="mt-1 text-sm text-muted">Dampingi masa remaja dengan panduan bijak & tenang.</p>
          </div>
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm text-muted">
          <Lock size={14} className="text-violet" /> Privasi & Otonomi Dijaga Sepenuhnya
        </p>
        <PartnerLogos className="mt-10 w-full rounded-3xl bg-white/80 px-5 py-6 shadow-sm backdrop-blur" />
      </main>
    </div>
  );
}
