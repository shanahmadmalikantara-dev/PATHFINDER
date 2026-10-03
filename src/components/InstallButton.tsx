"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Tombol "Install Aplikasi" (PWA). Di iPhone menampilkan petunjuk manual. */
export default function InstallButton() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (installed) return <p className="flex items-center gap-2 text-sm text-teal"><Smartphone size={16} /> Aplikasi sudah terpasang di perangkat ini ✓</p>;
  if (evt)
    return (
      <button onClick={async () => { await evt.prompt(); setEvt(null); }} className="btn-primary w-full">
        <Download size={16} /> Install PathFinder di HP ini
      </button>
    );
  return (
    <p className="text-xs text-muted">
      {ios
        ? "📱 iPhone: ketuk tombol Bagikan (kotak dengan panah) di Safari → “Tambah ke Layar Utama”."
        : "📱 Untuk memasang aplikasi: buka menu browser (⋮) → “Instal aplikasi” / “Tambahkan ke layar utama”."}
    </p>
  );
}
