"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { finishTalk, respondTalk } from "@/actions/parent";

export default function RespondButtons({ id, status }: { id: number; status: string }) {
  const [pending, start] = useTransition();
  const [more, setMore] = useState(false);
  const [outcome, setOutcome] = useState("");

  if (status === "disepakati")
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-teal-50 p-3 text-sm font-semibold text-teal">🤝 Kalian sudah sepakat untuk berdiskusi. Selamat mengobrol!</p>
        <input value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={120} className="input" placeholder="Hasil kesepakatan (opsional)" />
        <button disabled={pending} onClick={() => start(() => finishTalk(id, outcome))} className="btn w-full bg-teal text-white">
          <CheckCircle2 size={16} /> Tandai Diskusi Selesai
        </button>
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button disabled={pending} onClick={() => start(() => respondTalk(id, "siap"))} className="btn flex-1 bg-teal py-4 text-base text-white shadow-lg shadow-teal/30">
          🤝 Saya Juga Siap Berdiskusi
        </button>
        <button disabled={pending} onClick={() => setMore((v) => !v)} className="btn-ghost flex-1 py-4 text-teal">
          <Clock size={16} /> Minta Waktu Lain
        </button>
      </div>
      {more && (
        <div className="animate-pop grid grid-cols-3 gap-2">
          {([["1jam", "⏰ 1 jam lagi"], ["besok", "🗓️ Besok"], ["akhirpekan", "🌤️ Akhir pekan"]] as const).map(([v, l]) => (
            <button key={v} disabled={pending} onClick={() => start(async () => { await respondTalk(id, v); setMore(false); })} className="rounded-2xl bg-sky py-2.5 text-xs font-semibold hover:bg-teal-50">{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}
