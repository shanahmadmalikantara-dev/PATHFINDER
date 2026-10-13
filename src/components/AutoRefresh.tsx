"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Jeda cek saat tab/aplikasi tidak terlihat (di latar belakang). */
const HIDDEN_SECONDS = 30;

/**
 * Menjaga HP anak & HP orang tua tetap "nyambung" hampir real-time.
 * Tiap beberapa detik menanyakan versi data keluarga (/api/pulse);
 * kalau berubah (misal anak menekan "Siap Berdiskusi"), halaman dimuat ulang.
 * Saat tab tidak terlihat, pengecekan melambat menjadi 30 detik, lalu
 * langsung dicek sekali begitu tab aktif lagi.
 */
export default function AutoRefresh({ seconds = 3 }: { seconds?: number }) {
  const router = useRouter();
  const last = useRef<string | number | null>(null);

  useEffect(() => {
    let busy = false;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      clearTimeout(timer);
      if (stopped) return;
      const visible = document.visibilityState === "visible";
      timer = setTimeout(tick, (visible ? seconds : HIDDEN_SECONDS) * 1000);
    };

    const tick = async () => {
      if (busy) return;
      busy = true;
      try {
        const res = await fetch("/api/pulse", { cache: "no-store" });
        if (res.ok) {
          const { v } = (await res.json()) as { v: string | number | null };
          if (last.current !== null && v !== last.current) router.refresh();
          last.current = v;
        }
      } catch {
        // offline: abaikan, coba lagi di detak berikutnya
      } finally {
        busy = false;
        schedule();
      }
    };

    // Tab aktif lagi → cek sekali sekarang (lalu kembali ke jeda normal)
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        tick();
      } else {
        schedule();
      }
    };

    tick();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router, seconds]);

  return null;
}
