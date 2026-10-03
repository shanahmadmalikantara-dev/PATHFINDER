"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker agar aplikasi bisa di-install (PWA) & punya halaman offline. */
export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
