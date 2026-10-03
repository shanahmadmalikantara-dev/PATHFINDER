"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Menyegarkan data secara berkala supaya HP anak & HP orang tua "nyambung"
 * hampir real-time (misal: sinyal "Siap Berdiskusi" langsung muncul di HP ortu).
 */
export default function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(tick, seconds * 1000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, [router, seconds]);
  return null;
}
