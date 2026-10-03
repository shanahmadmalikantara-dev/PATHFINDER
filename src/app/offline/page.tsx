import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="space-y-4">
        <LogoMark size={80} className="mx-auto rounded-3xl shadow" />
        <h1 className="text-2xl font-extrabold">Kamu sedang offline 📡</h1>
        <p className="max-w-sm text-muted">Tidak apa-apa, istirahat sejenak juga baik. Sambungkan kembali internet untuk melanjutkan PathFinder.</p>
        <a href="/" className="btn-primary">Coba Lagi</a>
      </div>
    </div>
  );
}
