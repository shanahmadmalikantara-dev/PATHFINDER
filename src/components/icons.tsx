// Ikon garis (lucide) untuk konsep-konsep utama aplikasi.
// Dipakai menggantikan emoji supaya tampilan konsisten dan profesional.
// Setiap level energi & mood punya ikon + warna sendiri agar tetap ekspresif.
import {
  BatteryFull, BatteryLow, BatteryMedium, BatteryWarning, BedDouble, BookOpen, Brush, CloudLightning, Dumbbell,
  Leaf, type LucideIcon, Shuffle, Sparkles, Sprout, Sun, Zap,
} from "lucide-react";

type Visual = { icon: LucideIcon; fg: string; bg: string };

export const ENERGY_VISUAL: Record<number, Visual> = {
  1: { icon: BatteryWarning, fg: "#8a5a9c", bg: "#f1e8f6" },
  2: { icon: BatteryLow, fg: "#4f6fa8", bg: "#e6eef9" },
  3: { icon: BatteryMedium, fg: "#3f7f78", bg: "#e2f4f1" },
  4: { icon: BatteryFull, fg: "#c46a12", bg: "#fdf0df" },
  5: { icon: Zap, fg: "#d1462a", bg: "#ffe7df" },
};

export const MOOD_VISUAL: Record<string, Visual> = {
  stres: { icon: CloudLightning, fg: "#6a5acd", bg: "#ece9fb" },
  capek: { icon: BedDouble, fg: "#4f6fa8", bg: "#e6eef9" },
  bingung: { icon: Shuffle, fg: "#a0640f", bg: "#fbefdc" },
  tenang: { icon: Leaf, fg: "#2f8a63", bg: "#e1f5ec" },
  senang: { icon: Sun, fg: "#d1462a", bg: "#ffe9e1" },
};

export const CATEGORY_VISUAL: Record<string, Visual> = {
  belajar: { icon: BookOpen, fg: "#b4361b", bg: "#ffe3d9" },
  kebugaran: { icon: Dumbbell, fg: "#1b6b63", bg: "#d3f4ee" },
  minat: { icon: Brush, fg: "#4b3ba8", bg: "#e6e1ff" },
  kebiasaan: { icon: Sprout, fg: "#a0640f", bg: "#fbefdc" },
};

export function VisualIcon({ v, size = 20, className = "" }: { v?: Visual; size?: number; className?: string }) {
  const Icon = v?.icon ?? Sparkles;
  return <Icon size={size} color={v?.fg} strokeWidth={2} className={className} aria-hidden />;
}

/** Ikon dalam lingkaran/rounded-square berwarna lembut. */
export function IconBadge({ v, size = 20, box = 40, rounded = "rounded-2xl" }: { v?: Visual; size?: number; box?: number; rounded?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center ${rounded}`} style={{ width: box, height: box, background: v?.bg ?? "#eef3f7" }}>
      <VisualIcon v={v} size={size} />
    </span>
  );
}
