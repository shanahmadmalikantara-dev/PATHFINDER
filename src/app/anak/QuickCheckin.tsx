"use client";

import { useOptimistic, useTransition } from "react";
import { Lightbulb } from "lucide-react";
import { saveCheckin } from "@/actions/child";
import { ENERGY, ENERGY_RESPONSE } from "@/lib/constants";

/** Check-in energi satu ketukan (dipakai di Beranda & halaman Check-In). */
export default function QuickCheckin({ current }: { current?: number }) {
  const [energy, setEnergy] = useOptimistic(current);
  const [, start] = useTransition();
  const pick = (v: number) =>
    start(async () => {
      setEnergy(v);
      await saveCheckin(v);
    });

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {ENERGY.map((e) => {
          const active = energy === e.value;
          return (
            <button
              key={e.value}
              onClick={() => pick(e.value)}
              className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-0.5 py-3 text-[11px] font-semibold transition sm:text-sm ${
                active ? "scale-105 bg-coral text-white shadow-lg shadow-coral/30" : "bg-sky text-ink/80 hover:bg-coral-50"
              }`}
              aria-pressed={active}
            >
              <span className="text-2xl">{e.emoji}</span>
              {e.label}
            </button>
          );
        })}
      </div>
      {energy !== undefined && (
        <p className="animate-pop mt-4 flex items-start gap-2 rounded-2xl bg-sky p-4 text-sm font-medium">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber" />
          {ENERGY_RESPONSE[energy]}
        </p>
      )}
    </div>
  );
}
