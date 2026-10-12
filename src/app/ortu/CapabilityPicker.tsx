"use client";

import { useOptimistic, useTransition } from "react";
import { CalendarHeart, Check, Timer, Zap, type LucideIcon } from "lucide-react";
import { setCapability } from "@/actions/parent";
import { CAPABILITIES } from "@/lib/constants";

const CAP_ICON: Record<string, LucideIcon> = { sibuk: Zap, sedikit: Timer, banyak: CalendarHeart };

export default function CapabilityPicker({ value }: { value: string }) {
  const [cap, setCap] = useOptimistic(value);
  const [, start] = useTransition();
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {CAPABILITIES.map((c) => {
        const on = cap === c.value;
        const Icon = CAP_ICON[c.value] ?? Timer;
        return (
          <button
            key={c.value}
            onClick={() => start(async () => { setCap(c.value); await setCapability(c.value); })}
            className={`rounded-3xl p-5 text-left transition ${on ? "scale-[1.02] bg-teal text-white shadow-xl shadow-teal/30" : "bg-sky hover:bg-teal-50"}`}
          >
            <div className="flex items-center justify-between">
              <span className={`grid size-10 place-items-center rounded-2xl ${on ? "bg-white/20" : "bg-white text-teal"}`}><Icon size={20} /></span>
              <span className={`chip ${on ? "bg-teal-300 text-teal-700" : "bg-white text-muted"}`}>{on ? <><Check size={12} /> Terpilih</> : c.tag}</span>
            </div>
            <p className="mt-4 font-bold">{c.label}</p>
            <p className={`text-xs ${on ? "text-white/80" : "text-muted"}`}>{c.sub}</p>
          </button>
        );
      })}
    </div>
  );
}
