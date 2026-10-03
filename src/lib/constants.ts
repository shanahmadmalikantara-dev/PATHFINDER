// Konstanta yang dipakai di server maupun di browser.

export const ENERGY = [
  { value: 1, label: "Lelah", emoji: "😴" },
  { value: 2, label: "Lesu", emoji: "🥱" },
  { value: 3, label: "Biasa", emoji: "😐" },
  { value: 4, label: "Semangat", emoji: "😊" },
  { value: 5, label: "Membara", emoji: "⚡" },
] as const;

export const MOODS = [
  { value: "stres", label: "Stres", emoji: "😣" },
  { value: "capek", label: "Capek", emoji: "😩" },
  { value: "bingung", label: "Bingung", emoji: "🤔" },
  { value: "tenang", label: "Tenang", emoji: "🌱" },
  { value: "senang", label: "Senang", emoji: "😄" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

export const energyLabel = (v: number) => ENERGY.find((e) => e.value === v)?.label ?? "-";
export const energyEmoji = (v: number) => ENERGY.find((e) => e.value === v)?.emoji ?? "";
export const moodInfo = (v: string | null | undefined) => MOODS.find((m) => m.value === v);

/** Respon singkat setelah check-in energi (sisi anak). */
export const ENERGY_RESPONSE: Record<number, string> = {
  1: "Capek itu wajar banget. Hari ini cukup 1 hal kecil aja, sisanya istirahat ya 🤍",
  2: "Lagi lesu? Coba mulai dari tugas paling ringan 15 menit dulu, pelan-pelan aja.",
  3: "Hari yang biasa juga berharga. Satu langkah kecil tetap langkah maju!",
  4: "Bagus sekali! Energi semangat pas banget buat beresin target paling penting hari ini.",
  5: "Wah, lagi membara! 🔥 Pakai energinya buat target besar, tapi jangan lupa istirahat.",
};

export const GOAL_CATEGORIES = [
  { value: "belajar", label: "Belajar", emoji: "📚" },
  { value: "kebugaran", label: "Kebugaran", emoji: "🏃" },
  { value: "minat", label: "Eksplorasi Minat", emoji: "🎨" },
  { value: "kebiasaan", label: "Kebiasaan Baik", emoji: "🌱" },
] as const;

export const goalCategory = (v: string) => GOAL_CATEGORIES.find((c) => c.value === v) ?? GOAL_CATEGORIES[0];

export const TALK_TOPICS = [
  "Jadwal & Waktu Istirahat",
  "Tekanan Belajar di Sekolah",
  "Rencana Kuliah & Karir",
  "Uang Saku & Kemandirian",
  "Privasi & Ruang Sendiri",
  "Pertemanan",
  "Hobi & Minat Baru",
];

export const TALK_TIMES = ["Nanti malam", "Besok", "Akhir pekan", "Kapan saja"];

export const CAPABILITIES = [
  { value: "sibuk", label: "Saya Sibuk Hari Ini", sub: "1–5 menit sentuhan hangat kilat", tag: "Kilat", icon: "⚡" },
  { value: "sedikit", label: "Saya Punya Sedikit Waktu", sub: "10–15 menit obrolan bermakna", tag: "Seimbang", icon: "⏱️" },
  { value: "banyak", label: "Saya Punya Banyak Waktu", sub: "Akhir pekan / >30 menit bersama", tag: "Mendalam", icon: "🖐️" },
] as const;

export const QUOTES = [
  "Kemajuan kecil setiap hari menghasilkan hasil yang besar.",
  "Istirahat bukan berarti menyerah. Rehat sebentar bukan berarti gagal.",
  "Kamu tidak harus tahu seluruh jalannya, cukup langkah berikutnya.",
  "Membandingkan dirimu hari ini dengan dirimu kemarin — itu satu-satunya perbandingan yang adil.",
  "Bingung itu tanda kamu sedang memikirkan hal penting.",
  "Mimpi besar dibangun dari kebiasaan kecil yang konsisten.",
  "Gagal sekali bukan berarti gagal selamanya. Coba lagi dengan cara baru.",
];
