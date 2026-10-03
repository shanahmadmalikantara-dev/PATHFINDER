"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";

export default function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  const share = async () => {
    const url = `${location.origin}/daftar?kode=${code}`;
    const text = `Yuk gabung di PathFinder AI! Kode keluarga kita: ${code}\n${url}`;
    if (navigator.share) navigator.share({ title: "PathFinder AI", text }).catch(() => {});
    else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-1.5 sm:justify-start">
        {code.split("").map((c, i) => (
          <span key={i} className="grid h-12 w-10 place-items-center rounded-xl bg-white font-mono text-xl font-bold text-primary-strong shadow-sm">{c}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={copy} className="chip bg-white px-3 py-2 text-ink shadow-sm"><Copy size={13} /> {copied ? "Tersalin!" : "Salin Kode"}</button>
        <button onClick={share} className="chip bg-white px-3 py-2 text-ink shadow-sm"><Share2 size={13} /> Bagikan Undangan</button>
      </div>
    </div>
  );
}
