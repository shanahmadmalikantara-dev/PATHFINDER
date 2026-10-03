// ============================================================================
//  MESIN INSIGHT PATHFINDER ("AI simulasi" berbasis aturan)
// ----------------------------------------------------------------------------
//  Alur sesuai proposal (Bab 3.4):
//    INPUT (check-in, target)  →  ANALISIS POLA  →  PRIVACY FILTER  →  OUTPUT
//
//  Fungsi di sini HANYA menerima data "Shared Insight" (angka energi, kategori
//  mood, progres target). Jurnal anak tidak pernah ada di server, jadi secara
//  teknis memang mustahil bocor ke orang tua.
//
//  Catatan etika: insight ini BUKAN diagnosis. Kalimatnya selalu berupa
//  saran tindakan yang lembut, bukan label/kesimpulan tentang kondisi mental.
// ============================================================================

import type { Capability, Checkin, Goal } from "./db";
import { lastNDays, shortDay, today, weekday } from "./dates";

export type Situation =
  | "kurang_data"
  | "perlu_perhatian"
  | "energi_turun"
  | "konsistensi_turun"
  | "target_tertinggal"
  | "bingung"
  | "stabil_baik";

export interface PlanStep {
  title: string;
  minutes: string;
  body: string;
  tag: string;
}

export interface ParentInsight {
  situation: Situation;
  focus: string;
  consistency: { percent: number; label: string; note: string };
  energy: {
    series: (number | null)[];
    days: string[];
    label: string;
    note: string;
    today: number | null;
  };
  goals: { percent: number; label: string; note: string };
  mood: { label: string; note: string };
  guide: string;
  avoid: string;
  better: string;
  starters: string[];
  plan: PlanStep[];
  care: boolean;
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const LOW_MOODS = ["stres", "capek"];

export function analyze(params: {
  childName: string;
  checkins: Checkin[];
  goals: Goal[];
  goalsPercent: number;
  capability: Capability;
}): ParentInsight {
  const { childName: n, checkins, goals, goalsPercent, capability } = params;
  const days = lastNDays(7);
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const series = days.map((d) => byDate.get(d)?.energy ?? null);
  const filled = series.filter((v): v is number => v !== null);

  // --- Konsistensi: berapa hari dari 7 hari terakhir anak melakukan check-in
  const consistencyPct = Math.round((filled.length / 7) * 100);
  const consistency =
    filled.length === 0
      ? { percent: 0, label: "Belum ada data", note: `${n} belum melakukan check-in minggu ini` }
      : consistencyPct >= 70
        ? { percent: consistencyPct, label: "Stabil", note: "Ritme refleksi harian terjaga dengan baik" }
        : consistencyPct >= 45
          ? { percent: consistencyPct, label: "Naik-turun", note: "Ritme check-in mulai berkurang beberapa hari" }
          : { percent: consistencyPct, label: "Perlu sapaan", note: "Check-in jarang dilakukan minggu ini" };

  // --- Tren energi: bandingkan 3 hari terakhir vs hari-hari sebelumnya
  const recent = checkins.filter((c) => c.date >= days[4]).map((c) => c.energy);
  const before = checkins.filter((c) => c.date < days[4]).map((c) => c.energy);
  const recentAvg = avg(recent);
  const delta = before.length && recent.length ? recentAvg - avg(before) : 0;
  let energyLabel = "Normal";
  let energyNote = "Fluktuasi energi masih dalam batas wajar";
  if (filled.length < 2) {
    energyLabel = "Kurang data";
    energyNote = "Butuh beberapa hari check-in untuk melihat pola";
  } else if (delta <= -0.8 || (recent.length && recentAvg <= 2.3)) {
    energyLabel = "Menurun";
    energyNote = "Energi terlihat menurun beberapa hari terakhir";
  } else if (delta >= 0.8) {
    energyLabel = "Meningkat";
    energyNote = "Energi sedang naik, momen bagus untuk apresiasi";
  } else if (recentAvg >= 3.5) {
    energyLabel = "Prima";
    energyNote = "Energi terjaga tinggi dan stabil";
  }

  // --- Mood umum (hanya kategori, tanpa isi cerita)
  const recentMoods = checkins.filter((c) => c.date >= days[2] && c.mood).map((c) => c.mood as string);
  const lowMoodCount = checkins.filter((c) => c.date >= days[2] && c.mood && LOW_MOODS.includes(c.mood)).length;
  const bingungCount = recentMoods.filter((m) => m === "bingung").length;
  // Prioritaskan mood hari ini; bila belum ada, pakai mood terakhir dalam 3 hari
  const todayMood = checkins.find((c) => c.date === days[6])?.mood;
  const lastMood = todayMood ?? recentMoods[recentMoods.length - 1];
  const mood =
    !lastMood
      ? { label: "Belum terbaca", note: "Belum ada check-in suasana hati" }
      : lastMood === "tenang" || lastMood === "senang"
        ? { label: "Tenang & Lega", note: "Suasana hati terlihat positif" }
        : lastMood === "bingung"
          ? { label: "Sedang Berpikir", note: "Sedang menimbang sesuatu" }
          : { label: "Butuh Ruang", note: "Sedang membawa beban yang cukup berat" };

  // --- Progres target minggu ini
  const wd = weekday(today()); // 0 = Minggu
  const lateInWeek = wd === 0 || wd >= 4;
  const goalsInfo = !goals.length
    ? { percent: 0, label: "Belum diatur", note: `${n} belum membuat target minggu ini` }
    : goalsPercent >= 70
      ? { percent: goalsPercent, label: "Baik", note: "Sebagian besar target mingguan tercapai" }
      : goalsPercent >= 40 || !lateInWeek
        ? { percent: goalsPercent, label: "Berjalan", note: "Target sedang dicicil secara bertahap" }
        : { percent: goalsPercent, label: "Tertinggal", note: "Banyak target yang belum tersentuh" };

  // --- Tentukan situasi utama (urutan = prioritas)
  let situation: Situation = "stabil_baik";
  const care = filled.length >= 3 && recentAvg <= 1.8 && lowMoodCount >= 3;
  if (filled.length < 2) situation = "kurang_data";
  else if (care) situation = "perlu_perhatian";
  else if (energyLabel === "Menurun") situation = "energi_turun";
  else if (consistencyPct < 45) situation = "konsistensi_turun";
  else if (goals.length && goalsInfo.label === "Tertinggal") situation = "target_tertinggal";
  else if (bingungCount >= 2) situation = "bingung";

  const c = CONTENT[situation](n, consistencyPct >= 70);
  const group: PlanGroup =
    situation === "perlu_perhatian" || situation === "energi_turun"
      ? "lelah"
      : situation === "stabil_baik"
        ? "semangat"
        : "arah";

  return {
    situation,
    focus: c.focus,
    consistency,
    energy: {
      series,
      days: days.map(shortDay),
      label: energyLabel,
      note: energyNote,
      today: series[series.length - 1],
    },
    goals: goalsInfo,
    mood,
    guide: c.guide,
    avoid: c.avoid,
    better: c.better,
    starters: c.starters,
    plan: PLANS[group][capability](n),
    care,
  };
}

// ---------------------------------------------------------------------------
//  Konten panduan per situasi
// ---------------------------------------------------------------------------
type Content = { focus: string; guide: string; avoid: string; better: string; starters: string[] };

const CONTENT: Record<Situation, (n: string, consistent: boolean) => Content> = {
  kurang_data: (n) => ({
    focus: "Mulai Mengenal",
    guide: `${n} baru mulai memakai PathFinder, jadi polanya belum terbaca. Ini justru saat yang tepat untuk menunjukkan bahwa Anda hadir tanpa menuntut — cukup tanyakan kabarnya hari ini dengan santai.`,
    avoid: "“Kok kamu nggak pernah isi aplikasinya? Mama mau lihat.”",
    better: "“Gimana harimu tadi? Ada yang seru atau yang bikin capek?”",
    starters: [
      "“Kalau hari ini dikasih nilai 1–10, kamu kasih berapa?”",
      "“Lagi suka dengerin lagu apa belakangan ini?”",
      "“Ada rencana seru buat akhir pekan nanti?”",
    ],
  }),
  perlu_perhatian: (n) => ({
    focus: "Hadir & Mendengar",
    guide: `Beberapa hari terakhir energi ${n} terlihat rendah dan suasana hatinya cukup berat. Prioritaskan rasa aman, bukan solusi: tawarkan waktu bersama yang tenang, dengarkan tanpa menyela. Bila kondisi ini berlangsung lama, pertimbangkan untuk berkonsultasi dengan guru BK atau psikolog.`,
    avoid: "“Ah, gitu aja kok capek. Dulu Mama lebih susah.”",
    better: "“Kelihatannya minggu ini berat ya. Mama di sini kalau kamu mau cerita, kapan aja.”",
    starters: [
      "“Mau Mama buatin minuman hangat? Kita duduk bareng sebentar.”",
      "“Ada yang bisa Mama bantu kurangi bebannya minggu ini?”",
      "“Kamu nggak harus cerita sekarang. Mama cuma mau kamu tahu Mama ada.”",
    ],
  }),
  energi_turun: (n, consistent) => ({
    focus: "Pulihkan Energi",
    guide: consistent
      ? `${n} terlihat sangat konsisten, namun tingkat energinya menurun beberapa hari terakhir. Coba ajak ngobrol santai sambil menyajikan camilan favorit, tanpa menanyakan nilai ujian. Beri ruang istirahat yang cukup.`
      : `Energi ${n} terlihat menurun beberapa hari terakhir. Hindari menambah tuntutan baru minggu ini — tawarkan waktu istirahat dan tunjukkan bahwa usahanya tetap dihargai.`,
    avoid: "“Kenapa nilaimu turun? Padahal sudah ikut les tambahan terus.”",
    better: "“Ibu lihat kamu capek sekali hari ini, mau santai sejenak sambil minum teh bareng?”",
    starters: [
      "“Lagi dengerin lagu apa belakangan ini? Boleh Ibu dengerin juga?”",
      "“Bagian mana dari minggu ini yang paling bikin kamu capek?”",
      "“Weekend ini mau pesan martabak manis atau cobain es krim baru?”",
    ],
  }),
  konsistensi_turun: (n) => ({
    focus: "Sapaan Ringan",
    guide: `Ritme check-in ${n} menurun minggu ini. Ini bukan tanda malas — bisa jadi jadwalnya sedang padat. Jangan menegur soal aplikasinya; cukup sapa dengan ringan dan tanyakan apa yang sedang menyita waktunya.`,
    avoid: "“Kamu sekarang males banget ya, apa-apa nggak diurus.”",
    better: "“Minggu ini kayaknya padat banget ya? Lagi sibuk apa aja sih?”",
    starters: [
      "“Dari semua kegiatan minggu ini, mana yang paling kamu suka?”",
      "“Ada yang bisa kita atur ulang biar kamu nggak kecapekan?”",
      "“Kalau kamu bisa libur satu hari, mau ngapain?”",
    ],
  }),
  target_tertinggal: (n) => ({
    focus: "Bantu Memecah Target",
    guide: `Beberapa target mingguan ${n} belum tersentuh menjelang akhir pekan. Daripada menagih, bantu dia melihat bahwa target bisa dipecah jadi langkah kecil, atau disesuaikan. Hargai usaha yang sudah ada.`,
    avoid: "“Targetmu kok nggak ada yang jalan? Kapan mau seriusnya?”",
    better: "“Target minggu ini kayaknya terlalu banyak ya? Mau Ibu bantu pilih yang paling penting?”",
    starters: [
      "“Dari target minggu ini, mana yang paling bikin kamu penasaran?”",
      "“Kalau dikerjain 15 menit aja hari ini, kamu mau mulai dari mana?”",
      "“Ada yang bikin susah mulai? Mungkin kita bisa cari caranya bareng.”",
    ],
  }),
  bingung: (n) => ({
    focus: "Teman Berpikir",
    guide: `${n} beberapa kali merasa bingung belakangan ini — wajar, karena ia sedang memikirkan hal-hal penting. Jadilah teman berpikir, bukan pemberi jawaban: ajukan pertanyaan terbuka dan biarkan ia menemukan pilihannya sendiri.`,
    avoid: "“Udah, ikutin aja saran Ayah. Pasti bener.”",
    better: "“Kelihatannya kamu lagi mikirin sesuatu yang penting. Mau dipikirin bareng?”",
    starters: [
      "“Kalau semua pilihan sama-sama bisa, kamu paling pengen yang mana?”",
      "“Apa yang bikin kamu ragu dari pilihan itu?”",
      "“Mau kita cari info bareng soal jurusan/kegiatan yang kamu minati?”",
    ],
  }),
  stabil_baik: (n) => ({
    focus: "Rayakan Usaha",
    guide: `${n} sedang dalam ritme yang baik: konsisten dan energinya terjaga. Ini saat yang tepat untuk memberi apresiasi pada usahanya — bukan hanya hasilnya — dan menanyakan apa yang membuatnya bersemangat.`,
    avoid: "“Bagus, tapi jangan cepat puas. Masih bisa lebih tinggi lagi.”",
    better: "“Ibu bangga lihat kamu konsisten minggu ini. Apa yang bikin kamu semangat?”",
    starters: [
      "“Minggu ini momen apa yang paling bikin kamu bangga sama diri sendiri?”",
      "“Kemarin proyekmu bagian mana yang paling seru?”",
      "“Mau rayain kecil-kecilan minggu ini? Kamu yang pilih tempatnya!”",
    ],
  }),
};

// ---------------------------------------------------------------------------
//  Capability Filter: saran disesuaikan dengan waktu yang dimiliki orang tua
// ---------------------------------------------------------------------------
type PlanGroup = "lelah" | "arah" | "semangat";

const PLANS: Record<PlanGroup, Record<Capability, (n: string) => PlanStep[]>> = {
  lelah: {
    sibuk: (n) => [
      { title: "Pesan Singkat Hangat", minutes: "~1 mnt", body: `Kirim pesan pendek ke ${n}: “Semangat ya hari ini, jangan lupa makan 🤍” — tanpa pertanyaan soal tugas.`, tag: "💌 Rasa diperhatikan" },
      { title: "Sentuhan Perhatian Kecil", minutes: "~2 mnt", body: "Saat bertemu, tepuk pundaknya perlahan atau bawakan segelas air hangat. Gestur kecil sudah cukup.", tag: "🤲 Bahasa kasih tindakan" },
      { title: "Jangan Tambah Beban", minutes: "0 mnt", body: "Tunda dulu permintaan tugas rumah tambahan atau pertanyaan tentang nilai hari ini.", tag: "🛡️ Ruang pulih" },
    ],
    sedikit: (n) => [
      { title: "Koneksi Cepat Tanpa Beban", minutes: "~10 mnt", body: `Luangkan 10 menit saat makan malam untuk bertanya hal ringan: “Momen apa yang paling bikin kamu ketawa di sekolah hari ini?”`, tag: "😊 Memicu emosi positif" },
      { title: "Sentuhan Perhatian Kecil", minutes: "~5 mnt", body: `Bawakan potongan buah segar atau minuman hangat ke meja belajar ${n}, tepuk pundaknya perlahan, lalu berikan ia ruang.`, tag: "🤲 Bahasa kasih tindakan" },
      { title: "Dengarkan Tanpa Langsung Memberi Solusi", minutes: "~10 mnt", body: "Bila ia bercerita, cukup anggukkan dan validasi perasaannya: “Pasti berat ya rasanya berada di posisi itu…”", tag: "🫶 Membangun rasa aman" },
    ],
    banyak: (n) => [
      { title: "Waktu Santai Bersama", minutes: "~30 mnt", body: `Ajak ${n} melakukan hal yang ia suka tanpa agenda: jalan sore, masak camilan, atau nonton film pilihannya.`, tag: "🎬 Kebersamaan" },
      { title: "Obrolan Ringan Sambil Beraktivitas", minutes: "~20 mnt", body: "Ngobrol sambil melakukan sesuatu (menyetir, memasak) terasa lebih santai dibanding duduk berhadapan.", tag: "🚗 Tanpa tekanan" },
      { title: "Bantu Atur Ulang Minggu Depan", minutes: "~15 mnt", body: "Tawarkan bantuan menyusun jadwal yang menyisakan waktu istirahat. Biarkan ia yang memutuskan.", tag: "🗓️ Kemandirian" },
    ],
  },
  arah: {
    sibuk: (n) => [
      { title: "Satu Pertanyaan Terbuka", minutes: "~2 mnt", body: `Tanyakan satu hal saja ke ${n}: “Apa satu hal yang pengen kamu selesaikan besok?”`, tag: "🧭 Fokus" },
      { title: "Apresiasi Usaha", minutes: "~1 mnt", body: "Sebutkan satu usaha yang Anda lihat darinya minggu ini, sekecil apa pun.", tag: "⭐ Motivasi" },
      { title: "Tawarkan Bantuan", minutes: "~1 mnt", body: "“Kalau butuh bantuan apa-apa, bilang aja ya.” — lalu tepati bila ia meminta.", tag: "🤝 Kepercayaan" },
    ],
    sedikit: (n) => [
      { title: "Pecah Target Bersama", minutes: "~10 mnt", body: `Ajak ${n} memilih satu target terpenting minggu ini dan pecah jadi langkah 15 menit.`, tag: "🧩 Langkah kecil" },
      { title: "Tanya Hambatan, Bukan Hasil", minutes: "~5 mnt", body: "“Apa yang bikin susah mulai?” lebih membantu daripada “Kenapa belum selesai?”", tag: "💬 Dialog" },
      { title: "Sepakati Waktu Cek Santai", minutes: "~5 mnt", body: "Buat kesepakatan kecil kapan ngobrol lagi, misalnya Jumat malam sambil makan.", tag: "🤝 Kolaborasi" },
    ],
    banyak: (n) => [
      { title: "Eksplorasi Minat Bersama", minutes: "~45 mnt", body: `Cari info bareng ${n} tentang jurusan, kegiatan, atau profesi yang ia minati — biarkan ia memimpin.`, tag: "🔎 Rasa ingin tahu" },
      { title: "Kunjungan Inspiratif", minutes: "~2 jam", body: "Rencanakan kunjungan ke pameran pendidikan, kampus, atau tempat kerja yang terkait minatnya.", tag: "🎓 Wawasan" },
      { title: "Susun Roadmap Bersama", minutes: "~20 mnt", body: "Tawarkan diri menjadi teman diskusi saat ia menyusun roadmap — tanya, jangan mendikte.", tag: "🗺️ Masa depan" },
    ],
  },
  semangat: {
    sibuk: (n) => [
      { title: "Pesan Apresiasi", minutes: "~1 mnt", body: `Kirim pesan: “Ibu/Ayah bangga lihat usahamu minggu ini, ${n}!”`, tag: "🌟 Apresiasi" },
      { title: "High-five Kecil", minutes: "~1 mnt", body: "Gestur sederhana saat bertemu bisa sangat berarti.", tag: "🙌 Kehangatan" },
      { title: "Tanya Satu Hal Seru", minutes: "~3 mnt", body: "“Apa yang paling seru hari ini?” — dengarkan sampai selesai.", tag: "😊 Emosi positif" },
    ],
    sedikit: (n) => [
      { title: "Rayakan Usaha", minutes: "~10 mnt", body: `Sebutkan secara spesifik usaha ${n} yang Anda perhatikan, bukan hanya hasilnya.`, tag: "🌟 Growth mindset" },
      { title: "Tanya Sumber Semangat", minutes: "~5 mnt", body: "“Apa yang bikin kamu semangat minggu ini?” Jawabannya membantu Anda memahami motivasinya.", tag: "💡 Memahami" },
      { title: "Tawarkan Tantangan Seru", minutes: "~5 mnt", body: "Tanyakan apakah ada hal baru yang ingin ia coba, dan bagaimana Anda bisa mendukung.", tag: "🚀 Eksplorasi" },
    ],
    banyak: (n) => [
      { title: "Perayaan Kecil", minutes: "~1 jam", body: `Ajak ${n} makan di tempat favoritnya sebagai apresiasi atas konsistensinya.`, tag: "🎉 Perayaan" },
      { title: "Aktivitas Minat Bersama", minutes: "~1 jam", body: "Lakukan kegiatan sesuai minatnya bersama: olahraga, membuat proyek, atau belajar hal baru.", tag: "🎨 Kebersamaan" },
      { title: "Bicara Mimpi Jangka Panjang", minutes: "~20 mnt", body: "Saat suasana hangat, tanyakan mimpinya 5 tahun ke depan — dengarkan dengan antusias.", tag: "🗺️ Masa depan" },
    ],
  },
};

// ---------------------------------------------------------------------------
//  Pesan "AI Companion" untuk anak
// ---------------------------------------------------------------------------
export function childCompanion(params: { streak: number; checkinsThisWeek: number; goalsPercent: number; todayEnergy?: number }) {
  const { streak, checkinsThisWeek, goalsPercent, todayEnergy } = params;
  if (todayEnergy !== undefined && todayEnergy <= 2)
    return "Energimu lagi rendah. Nggak apa-apa, istirahat juga bagian dari progres kok 🤍";
  if (streak >= 7) return `Wah, ${streak} hari berturut-turut kamu check-in! Konsistensimu keren banget ✨`;
  if (goalsPercent >= 70) return `Target minggu ini sudah ${goalsPercent}% tercapai. Pertahankan ritmemu ya! 🎯`;
  if (checkinsThisWeek >= 3) return `Kamu sudah refleksi ${checkinsThisWeek} hari minggu ini. Langkah kecil yang konsisten itu kuat 💪`;
  if (goalsPercent > 0) return "Target sedang berjalan. Pilih satu yang paling ringan buat hari ini, yuk!";
  return "Yuk mulai dengan check-in singkat. Kurang dari satu menit kok ⏱️";
}
