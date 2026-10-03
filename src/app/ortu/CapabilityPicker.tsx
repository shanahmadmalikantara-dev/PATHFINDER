"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { setCapability } from "@/actions/parent";
import { CAPABILITIES } from "@/lib/constants";

export default function CapabilityPicker({ value }: { value: string }) {
  const [cap, setCap] = useOptimistic(value);
  const [, start] = useTransition();
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {CAPABILITIES.map((c) => {
        const on = cap === c.value;
        return (
          <button
            key={c.value}
            onClick={() => start(async () => { setCap(c.value); await setCapability(c.value); })}
            className={`rounded-3xl p-5 text-left transition ${on ? "scale-[1.02] bg-teal text-white shadow-xl shadow-teal/30" : "bg-sky hover:bg-teal-50"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{c.icon}</span>
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
