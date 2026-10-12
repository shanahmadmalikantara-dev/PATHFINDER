"use client";

import { useEffect } from "react";
import { isStaleBuildError, reloadOnce } from "@/components/RegisterSW";

// Pengaman terakhir bila layout utama ikut error.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (isStaleBuildError(error)) reloadOnce();
  }, [error]);

  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f3f8fc", color: "#1d2a31", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0, textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 20 }}>PathFinder sedang memuat ulang</h1>
          <p style={{ color: "#5d6a72", fontSize: 14 }}>Aplikasi mungkin baru diperbarui. Muat ulang halaman untuk melanjutkan.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: "10px 20px", borderRadius: 999, border: 0, background: "#ff7a59", color: "#fff", fontWeight: 600 }}>
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
