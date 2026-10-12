"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { isStaleBuildError, reloadOnce } from "@/components/RegisterSW";

// Tampilan ramah bila terjadi error di sebuah halaman (menggantikan layar putih).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (isStaleBuildError(error)) reloadOnce();
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[60dvh] place-items-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-coral-100 text-coral-700">
          <RefreshCw size={24} />
        </span>
        <h1 className="text-xl font-bold">Halaman gagal dimuat</h1>
        <p className="text-sm text-muted">
          Biasanya karena aplikasi baru saja diperbarui atau koneksi terputus. Coba muat ulang halamannya.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={() => reset()} className="btn-ghost">Coba lagi</button>
          <button onClick={() => window.location.reload()} className="btn-primary">Muat ulang</button>
        </div>
      </div>
    </div>
  );
}
