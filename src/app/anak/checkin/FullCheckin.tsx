"use client";

import { useState, useTransition } from "react";
import { Check, Eye } from "lucide-react";
import { saveCheckin } from "@/actions/child";
import { ENERGY, ENERGY_RESPONSE, MOODS } from "@/lib/constants";

/** Check-in lengkap: energi + suasana hati (keduanya = Shared Insight, tanpa teks). */
export default function FullCheckin({ energy: e0, mood: m0 }: { energy?: number; mood?: string | null }) {
  const [energy, setEnergy] = useState<number | undefined>(e0);
  const [mood, setMood] = useState<string | null>(m0 ?? null);
  const [saved, setSaved] = useState(Boolean(e0));
  const [pending, start] = useTransition();
  const dirty = energy !== e0 || mood !== (m0 ?? null);

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Check-In Hari Ini ⏱️</h2>
        {saved && !dirty && <span className="chip bg-teal-100 text-teal"><Check size={12} /> Sudah check-in</span>}
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">1. Tingkat energimu</p>
        <div className="grid grid-cols-5 gap-2">
          {ENERGY.map((x) => (
            <button key={x.value} onClick={() => setEnergy(x.value)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-0.5 py-3 text-[11px] font-semibold transition sm:text-xs ${energy === x.value ? "bg-coral text-white shadow-lg shadow-coral/30" : "bg-sky text-ink/80"}`}>
              <span className="text-2xl">{x.emoji}</span>{x.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">2. Suasana hatimu (opsional)</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`chip px-4 py-2 text-sm ${mood === m.value ? "bg-coral text-white shadow" : "bg-sky text-ink/80"}`}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>
      {energy !== undefined && <p className="rounded-2xl bg-sky p-3 text-sm">{ENERGY_RESPONSE[energy]}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-violet"><Eye size={14} /> Dibagikan ke ortu: hanya level energi & kategori mood</p>
        <button
          disabled={!energy || pending || (saved && !dirty)}
          onClick={() => energy && start(async () => { await saveCheckin(energy, mood); setSaved(true); })}
          className="btn-primary"
        >
          {pending ? "Menyimpan…" : saved && !dirty ? "Tersimpan ✓" : "Simpan Check-In"}
        </button>
      </div>
    </div>
  );
}
