"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Menjaga HP anak & HP orang tua tetap "nyambung" hampir real-time.
 * Tiap beberapa detik menanyakan sidik jari data keluarga (/api/pulse);
 * kalau berubah (misal anak menekan "Siap Berdiskusi"), halaman dimuat ulang.
 */
export default function AutoRefresh({ seconds = 3 }: { seconds?: number }) {
  const router = useRouter();
  const last = useRef<string | null>(null);

  useEffect(() => {
    let busy = false;
    const tick = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const res = await fetch("/api/pulse", { cache: "no-store" });
        const { v } = (await res.json()) as { v: string | null };
        if (last.current !== null && v !== last.current) router.refresh();
        last.current = v;
      } catch {
        // offline: abaikan, coba lagi di detak berikutnya
      } finally {
        busy = false;
      }
    };
    tick();
    const id = setInterval(tick, seconds * 1000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [router, seconds]);

  return null;
}
