// Konstanta yang dipakai di server maupun di browser.

export const ENERGY = [
  { value: 1, label: "Lelah" },
  { value: 2, label: "Lesu" },
  { value: 3, label: "Biasa" },
  { value: 4, label: "Semangat" },
  { value: 5, label: "Membara" },
] as const;

export const MOODS = [
  { value: "stres", label: "Stres" },
  { value: "capek", label: "Capek" },
  { value: "bingung", label: "Bingung" },
  { value: "tenang", label: "Tenang" },
  { value: "senang", label: "Senang" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

export const energyLabel = (v: number) => ENERGY.find((e) => e.value === v)?.label ?? "-";
export const moodInfo = (v: string | null | undefined) => MOODS.find((m) => m.value === v);

/** Respon singkat setelah check-in energi (sisi anak). */
export const ENERGY_RESPONSE: Record<number, string> = {
  1: "Capek itu wajar banget. Hari ini cukup 1 hal kecil aja, sisanya istirahat ya.",
  2: "Lagi lesu? Coba mulai dari tugas paling ringan 15 menit dulu, pelan-pelan aja.",
  3: "Hari yang biasa juga berharga. Satu langkah kecil tetap langkah maju!",
  4: "Bagus sekali! Energi semangat pas banget buat beresin target paling penting hari ini.",
  5: "Wah, lagi membara! Pakai energinya buat target besar, tapi jangan lupa istirahat.",
};

export const GOAL_CATEGORIES = [
  { value: "belajar", label: "Belajar" },
  { value: "kebugaran", label: "Kebugaran" },
  { value: "minat", label: "Eksplorasi Minat" },
  { value: "kebiasaan", label: "Kebiasaan Baik" },
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

/** Topik yang bisa dipilih orang tua saat mengajak anak mengobrol. */
export const PARENT_TALK_TOPICS = [
  "Kabar sekolah minggu ini",
  "Jadwal & Waktu Istirahat",
  "Rencana Kuliah & Karir",
  "Kegiatan di luar sekolah",
  "Uang Saku & Kemandirian",
  "Rencana liburan keluarga",
  "Ada yang ingin Ayah/Ibu sampaikan",
];

export const TALK_TIMES = ["Nanti malam", "Besok", "Akhir pekan", "Kapan saja"];

export const CAPABILITIES = [
  { value: "sibuk", label: "Saya Sibuk Hari Ini", sub: "1–5 menit sentuhan hangat kilat", tag: "Kilat" },
  { value: "sedikit", label: "Saya Punya Sedikit Waktu", sub: "10–15 menit obrolan bermakna", tag: "Seimbang" },
  { value: "banyak", label: "Saya Punya Banyak Waktu", sub: "Akhir pekan / >30 menit bersama", tag: "Mendalam" },
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

/** Pilihan waktu luang per minggu untuk Rancang dengan AI. */
export const HOURS_OPTIONS = ["< 3 jam", "3–6 jam", "6–10 jam", "> 10 jam"];
