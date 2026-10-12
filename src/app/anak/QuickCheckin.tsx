"use client";

import { useOptimistic, useTransition } from "react";
import { Lightbulb } from "lucide-react";
import { saveCheckin } from "@/actions/child";
import { ENERGY_RESPONSE } from "@/lib/constants";
import { EnergyPicker } from "@/components/CheckinPickers";

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
      <EnergyPicker value={energy} onPick={pick} />
      {energy !== undefined && (
        <p className="animate-pop mt-4 flex items-start gap-2 rounded-2xl bg-sky p-4 text-sm font-medium">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber" />
          {ENERGY_RESPONSE[energy]}
        </p>
      )}
    </div>
  );
}
