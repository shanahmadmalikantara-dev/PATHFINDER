"use client";

import { ENERGY, MOODS } from "@/lib/constants";
import { ENERGY_VISUAL, MOOD_VISUAL, VisualIcon } from "./icons";

/** Pilihan tingkat energi (1–5) dengan ikon baterai berwarna. */
export function EnergyPicker({ value, onPick }: { value?: number; onPick: (v: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Tingkat energi">
      {ENERGY.map((e) => {
        const v = ENERGY_VISUAL[e.value];
        const active = value === e.value;
        return (
          <button
            key={e.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(e.value)}
            className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border-2 px-0.5 py-3 text-[11px] font-semibold transition sm:text-sm ${
              active ? "scale-[1.04] shadow-md" : "border-transparent bg-sky text-ink/75 hover:bg-white"
            }`}
            style={active ? { borderColor: v.fg, background: v.bg, color: v.fg } : undefined}
          >
            <span className="grid size-9 place-items-center rounded-full" style={{ background: active ? "#fff" : v.bg }}>
              <VisualIcon v={v} size={20} />
            </span>
            {e.label}
          </button>
        );
      })}
    </div>
  );
}

/** Pilihan suasana hati dengan ikon bermakna (bukan emoji). */
export function MoodPicker({ value, onPick }: { value: string | null; onPick: (v: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Suasana hati">
      {MOODS.map((m) => {
        const v = MOOD_VISUAL[m.value];
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onPick(active ? null : m.value)}
            className={`inline-flex items-center gap-2 rounded-full border-2 py-1.5 pr-4 pl-1.5 text-sm font-semibold transition ${
              active ? "shadow-sm" : "border-transparent bg-sky text-ink/75 hover:bg-white"
            }`}
            style={active ? { borderColor: v.fg, background: v.bg, color: v.fg } : undefined}
          >
            <span className="grid size-7 place-items-center rounded-full" style={{ background: active ? "#fff" : v.bg }}>
              <VisualIcon v={v} size={15} />
            </span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
