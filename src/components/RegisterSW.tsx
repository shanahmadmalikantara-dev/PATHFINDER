"use client";

import { useEffect } from "react";

const RELOAD_KEY = "pf_chunk_reload";

/** Error khas "version skew": file JS dari build lama sudah tidak ada di server. */
export function isStaleBuildError(err: unknown) {
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  return /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Failed to find Server Action/i.test(msg);
}

/** Reload penuh sekali saja (dijaga sessionStorage agar tidak loop). */
export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 15000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {}
  window.location.reload();
  return true;
}

/**
 * - Mendaftarkan service worker (PWA: bisa di-install & punya halaman offline)
 * - Pengaman setelah update aplikasi: bila halaman lama mencoba memuat file
 *   yang sudah diganti, halaman di-reload otomatis alih-alih menampilkan error.
 */
export default function RegisterSW() {
  useEffect(() => {
    const onError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const err = "reason" in e ? e.reason : e.error ?? e.message;
      if (isStaleBuildError(err)) reloadOnce();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").then((reg) => reg.update()).catch(() => {});
    }
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, []);
  return null;
}
