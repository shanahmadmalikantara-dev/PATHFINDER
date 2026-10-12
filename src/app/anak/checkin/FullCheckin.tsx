"use client";

import { useState, useTransition } from "react";
import { Check, Eye, Timer } from "lucide-react";
import { saveCheckin } from "@/actions/child";
import { ENERGY_RESPONSE } from "@/lib/constants";
import { EnergyPicker, MoodPicker } from "@/components/CheckinPickers";

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
        <h2 className="flex items-center gap-2 text-xl font-bold"><Timer size={20} className="text-coral-700" /> Check-In Hari Ini</h2>
        {saved && !dirty && <span className="chip bg-teal-100 text-teal"><Check size={12} /> Sudah check-in</span>}
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">1. Tingkat energimu</p>
        <EnergyPicker value={energy} onPick={setEnergy} />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">2. Suasana hatimu (opsional)</p>
        <MoodPicker value={mood} onPick={setMood} />
      </div>
      {energy !== undefined && <p className="rounded-2xl bg-sky p-3 text-sm">{ENERGY_RESPONSE[energy]}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-violet"><Eye size={14} /> Dibagikan ke ortu: hanya level energi & kategori mood</p>
        <button
          disabled={!energy || pending || (saved && !dirty)}
          onClick={() => energy && start(async () => { await saveCheckin(energy, mood); setSaved(true); })}
          className="btn-primary"
        >
          {pending ? "Menyimpan…" : saved && !dirty ? "Tersimpan" : "Simpan Check-In"}
        </button>
      </div>
    </div>
  );
}
