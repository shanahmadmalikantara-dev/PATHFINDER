// ============================================================================
//  AI Roadmap Planner
//  Mengubah impian sederhana ("pengen kuliah di MIT") menjadi beberapa jalur
//  pilihan berisi milestone berurutan (periode + prioritas + checklist),
//  kebiasaan mingguan, dan peluang/lomba yang relevan.
//  Gemini dipakai bila tersedia; bila tidak, ada perencana berbasis aturan.
// ============================================================================
import "server-only";
import crypto from "node:crypto";
import { db } from "./db";
import { generate, parseJson } from "./gemini";
import { HOURS_OPTIONS } from "./constants";

export type Horizon = "tahun_ini" | "jangka_panjang";
export type HabitCategory = "belajar" | "kebugaran" | "minat" | "kebiasaan";

export interface PlanStep {
  title: string;
  detail: string;
  period: string;
  horizon: Horizon;
  priority: 1 | 2 | 3;
  tasks: string[];
}
export interface PlanHabit {
  title: string;
  category: HabitCategory;
  target: number;
  unit: string;
}
export interface PlanPath {
  id: string;
  name: string;
  effort: "ringan" | "sedang" | "intens";
  fit: string;
  summary: string;
  steps: PlanStep[];
  habits: PlanHabit[];
}
export interface PlanOpportunity {
  name: string;
  window: string;
  why: string;
}
export interface Plan {
  dream: string;
  analysis: string;
  needs: string[];
  paths: PlanPath[];
  opportunities: PlanOpportunity[];
  source: "gemini" | "simulasi";
}

export interface PlannerInput {
  dream: string;
  hours: string; // waktu luang per minggu
  strengths: string;
  constraints: string;
  feedback?: string; // permintaan revisi
}

export interface PlannerProfile {
  name: string;
  grade: string | null;
  avgEnergy: number | null;
  goals: string[];
  milestones: string[];
}


// ----------------------------------------------------------------- waktu
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function nowWib() {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date());
  const [y, m] = s.split("-").map(Number);
  return { year: y, month: m - 1 };
}

/** Rentang bulan relatif dari sekarang, mis. period(0, 3) → "Okt – Des 2026". */
function period(startOffset: number, length: number) {
  const { year, month } = nowWib();
  const a = new Date(Date.UTC(year, month + startOffset, 1));
  const b = new Date(Date.UTC(year, month + startOffset + Math.max(1, length) - 1, 1));
  const fa = `${BULAN[a.getUTCMonth()]}${a.getUTCFullYear() !== b.getUTCFullYear() ? " " + a.getUTCFullYear() : ""}`;
  const fb = `${BULAN[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  return length <= 1 ? fb : `${fa} – ${fb}`;
}

/** Perkiraan bulan tersisa sampai lulus SMA/MA (kelulusan ± Juni). */
export function monthsToGraduation(grade: string | null): number | null {
  const n = Number(grade?.match(/\d+/)?.[0]);
  if (!n || n < 7 || n > 12) return null;
  const { year, month } = nowWib();
  // tahun ajaran dimulai Juli; kelas 12 lulus Juni tahun ajaran berikutnya
  const startYear = month >= 6 ? year : year - 1;
  const gradYear = startYear + (12 - n) + 1;
  return Math.max(1, (gradYear - year) * 12 + (5 - month));
}

// ----------------------------------------------------------- normalisasi
const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const CATS: HabitCategory[] = ["belajar", "kebugaran", "minat", "kebiasaan"];

function cleanPlan(raw: unknown, dream: string, source: Plan["source"]): Plan | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const paths: PlanPath[] = arr(r.paths)
    .slice(0, 3)
    .map((p, i): PlanPath | null => {
      const o = (p ?? {}) as Record<string, unknown>;
      const steps = arr(o.steps)
        .slice(0, 7)
        .map((s): PlanStep | null => {
          const x = (s ?? {}) as Record<string, unknown>;
          const title = str(x.title, 80);
          if (title.length < 3) return null;
          const pr = Number(x.priority);
          return {
            title,
            detail: str(x.detail, 240),
            period: str(x.period, 40),
            horizon: x.horizon === "jangka_panjang" ? "jangka_panjang" : "tahun_ini",
            priority: pr === 1 || pr === 3 ? pr : 2,
            tasks: arr(x.tasks).map((t) => str(t, 90)).filter(Boolean).slice(0, 5),
          };
        })
        .filter((s): s is PlanStep => !!s);
      if (!steps.length) return null;
      const habits = arr(o.habits)
        .slice(0, 4)
        .map((h): PlanHabit | null => {
          const x = (h ?? {}) as Record<string, unknown>;
          const title = str(x.title, 60);
          if (title.length < 2) return null;
          return {
            title,
            category: CATS.includes(x.category as HabitCategory) ? (x.category as HabitCategory) : "belajar",
            target: Math.min(30, Math.max(1, Math.round(Number(x.target) || 3))),
            unit: str(x.unit, 12) || "kali",
          };
        })
        .filter((h): h is PlanHabit => !!h);
      const effort = o.effort === "ringan" || o.effort === "intens" ? o.effort : "sedang";
      return {
        id: `p${i + 1}`,
        name: str(o.name, 60) || `Jalur ${i + 1}`,
        effort,
        fit: str(o.fit, 160),
        summary: str(o.summary, 320),
        steps,
        habits,
      };
    })
    .filter((p): p is PlanPath => !!p);
  if (!paths.length) return null;
  return {
    dream: str(r.dream, 120) || dream,
    analysis: str(r.analysis, 700),
    needs: arr(r.needs).map((n) => str(n, 140)).filter(Boolean).slice(0, 6),
    paths,
    opportunities: arr(r.opportunities)
      .map((o) => {
        const x = (o ?? {}) as Record<string, unknown>;
        return { name: str(x.name, 90), window: str(x.window, 80), why: str(x.why, 160) };
      })
      .filter((o) => o.name)
      .slice(0, 6),
    source,
  };
}

// ----------------------------------------------------------------- Gemini
function systemPrompt() {
  const { year, month } = nowWib();
  return `Kamu adalah PathFinder AI, perencana masa depan untuk remaja Indonesia (SMP/SMA/MA).
Tugasmu: mengubah impian anak menjadi rencana bertahap yang REALISTIS dan bisa langsung dikerjakan.
Hari ini: ${BULAN[month]} ${year}. Gunakan bahasa Indonesia santai, hangat, jelas, tanpa emoji.

Cara berpikir:
1. Identifikasi apa saja yang sebenarnya dibutuhkan untuk impian itu (syarat akademik, tes, bahasa, portofolio, prestasi, biaya/beasiswa, dokumen).
2. Sesuaikan dengan kelas anak, sisa waktu sampai lulus, waktu luang per minggu, energi rata-rata, kekuatan, dan kendalanya.
3. Buat 2–3 JALUR PILIHAN dengan tingkat usaha berbeda (ringan / sedang / intens) supaya anak bisa memilih sesuai kemampuan. Jalur berbeda strateginya, bukan cuma beda jumlah jam.
4. Di setiap jalur: 4–6 milestone BERURUTAN secara waktu. Tiap milestone punya periode bulan konkret (format "Nov 2026 – Jan 2027" atau "Mar 2027"), prioritas (1 = paling penting, 3 = pelengkap), dan 2–4 tugas kecil yang bisa dicentang.
   horizon "tahun_ini" untuk yang dimulai dalam 12 bulan ke depan, "jangka_panjang" untuk sesudahnya.
5. Di setiap jalur: 2–4 kebiasaan mingguan yang langsung bisa jadi target minggu ini (target 1–7 untuk hari/sesi, boleh lebih untuk "soal", unit singkat seperti "hari", "sesi", "soal"). Kategori: belajar, kebugaran, minat, atau kebiasaan.
6. Peluang: 3–6 lomba/program/tes NYATA yang memang rutin diadakan dan relevan (contoh: OSN, KSM untuk siswa madrasah, OPSI, FIKSI, Bebras, SAT, IELTS/TOEFL, beasiswa nyata). Tulis jendela waktu sebagai PERKIRAAN pola tahunan (mis. "biasanya pendaftaran Feb–Apr") dan JANGAN mengarang tanggal pasti atau nama lomba yang tidak ada. Bila tidak yakin, tulis "jadwal berubah tiap tahun, cek situs resmi".
7. Jika impian terlalu jauh untuk sisa waktunya, katakan jujur dengan lembut dan beri jalur alternatif yang tetap mengarah ke sana.

Keluarkan HANYA JSON valid dengan bentuk persis:
{"dream":"ringkasan impian","analysis":"2–4 kalimat analisis personal","needs":["kebutuhan 1","..."],
"paths":[{"name":"nama jalur","effort":"ringan|sedang|intens","fit":"cocok untuk siapa","summary":"1–2 kalimat strategi",
"steps":[{"title":"judul milestone (maks 70 huruf)","detail":"penjelasan singkat","period":"Nov 2026 – Jan 2027","horizon":"tahun_ini|jangka_panjang","priority":1,"tasks":["tugas 1","tugas 2"]}],
"habits":[{"title":"kebiasaan","category":"belajar","target":3,"unit":"sesi"}]}],
"opportunities":[{"name":"nama lomba/program","window":"perkiraan waktu","why":"kenapa relevan"}]}`;
}

function profileText(p: PlannerProfile, input: PlannerInput) {
  const months = monthsToGraduation(p.grade);
  return [
    `Nama: ${p.name}`,
    `Kelas: ${p.grade ?? "tidak disebut"}${months ? ` (sekitar ${months} bulan lagi lulus SMA/MA)` : ""}`,
    `Impian: ${input.dream}`,
    `Waktu luang per minggu: ${input.hours}`,
    input.strengths && `Kekuatan/minat: ${input.strengths}`,
    input.constraints && `Kendala: ${input.constraints}`,
    p.avgEnergy !== null && `Rata-rata energi 14 hari: ${p.avgEnergy.toFixed(1)}/5`,
    p.goals.length && `Target minggu ini: ${p.goals.join("; ")}`,
    p.milestones.length && `Roadmap yang sudah ada: ${p.milestones.join("; ")}`,
    input.feedback && `PERMINTAAN REVISI dari anak: ${input.feedback}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ------------------------------------------------------------ cache rencana
// Rencana Gemini untuk impian + kelas + pilihan yang sama disimpan 7 hari, jadi
// impian yang sama muncul instan tanpa memanggil Gemini lagi (hemat kuota, demo mulus).
// Sengaja TIDAK memakai roadmap/target anak sebagai kunci, karena itu berubah
// setelah rencana diterapkan.
const PLAN_TTL_DAYS = 7;
const norm = (v?: string | null) => (v ?? "").toLowerCase().replace(/\s+/g, " ").trim();

export function planCacheKey(profile: PlannerProfile, input: PlannerInput): string {
  const parts = [norm(profile.grade), norm(input.dream), input.hours, norm(input.strengths), norm(input.constraints), norm(input.feedback)];
  return "plan1:" + crypto.createHash("sha1").update(JSON.stringify(parts)).digest("hex");
}

export function cachedPlan(key: string): Plan | null {
  const row = db
    .prepare(`SELECT value FROM ai_cache WHERE key = ? AND created_at >= datetime('now', '-${PLAN_TTL_DAYS} days')`)
    .get(key) as { value: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.value) as Plan;
  } catch {
    return null;
  }
}

export function storePlan(key: string, plan: Plan) {
  db.prepare("INSERT OR REPLACE INTO ai_cache (key, value, created_at) VALUES (?, ?, datetime('now'))").run(key, JSON.stringify(plan));
}

export async function aiPlan(profile: PlannerProfile, input: PlannerInput): Promise<Plan | null> {
  const r = await generate({
    system: systemPrompt(),
    messages: [{ role: "user", text: profileText(profile, input) }],
    json: true,
    maxTokens: 6000,
    temperature: 0.6,
    timeoutMs: 60000,
  });
  if (!r) return null;
  return cleanPlan(parseJson(r.text), input.dream, "gemini");
}

// ------------------------------------------------- Perencana berbasis aturan
type Template = {
  match: RegExp;
  needs: string[];
  opportunities: PlanOpportunity[];
  build: (ctx: { months: number; light: boolean }) => PlanPath[];
};

const step = (title: string, detail: string, start: number, len: number, priority: 1 | 2 | 3, tasks: string[]): PlanStep => ({
  title,
  detail,
  period: period(start, len),
  horizon: start >= 12 ? "jangka_panjang" : "tahun_ini",
  priority,
  tasks,
});

const TEMPLATES: Template[] = [
  {
    match: /\b(mit|harvard|stanford|oxford|cambridge|luar negeri|abroad|amerika|inggris|jepang|jerman|australia|singapura|nus|ntu|ivy)\b/i,
    needs: [
      "Nilai rapor stabil tinggi, terutama Matematika dan Sains",
      "Skor tes bahasa Inggris (IELTS/TOEFL/Duolingo) sesuai syarat kampus",
      "Tes standar bila diminta kampus (mis. SAT untuk kampus AS)",
      "Prestasi atau proyek yang menunjukkan inisiatif (lomba, riset, karya)",
      "Esai pribadi dan surat rekomendasi guru",
      "Rencana biaya: beasiswa penuh/parsial atau bantuan finansial kampus",
    ],
    opportunities: [
      { name: "Olimpiade Sains Nasional (OSN) / Kompetisi Sains Madrasah (KSM)", window: "Biasanya seleksi sekolah awal tahun, tingkat kota–nasional pertengahan tahun", why: "Prestasi sains jadi nilai kuat di aplikasi kampus luar negeri" },
      { name: "Olimpiade Penelitian Siswa Indonesia (OPSI)", window: "Jadwal berubah tiap tahun, cek situs resmi Puspresnas", why: "Membuktikan kemampuan riset mandiri" },
      { name: "SAT (College Board)", window: "Tersedia beberapa kali setahun, cek jadwal resmi", why: "Tes standar yang diminta banyak kampus AS" },
      { name: "IELTS / TOEFL iBT", window: "Bisa diambil hampir setiap bulan", why: "Syarat bahasa Inggris kampus luar negeri" },
      { name: "Beasiswa Indonesia Maju (BIM) / beasiswa kampus", window: "Pendaftaran biasanya dibuka sekali setahun, cek situs resmi", why: "Membantu biaya kuliah di luar negeri" },
    ],
    build: ({ light }) => [
      {
        id: "", name: "Jalur Prestasi Akademik", effort: "intens", fit: "Cocok kalau kamu kuat di Matematika/Sains dan siap belajar rutin",
        summary: "Fokus nilai, olimpiade, dan tes standar supaya profil akademikmu sangat kuat.",
        steps: [
          step("Petakan syarat kampus impian", "Cek syarat masuk, tes yang diminta, dan beasiswa di situs resmi kampus.", 0, 1, 1, ["Buka halaman admissions kampus impian", "Catat tes, nilai, dan tenggat yang diminta", "Diskusikan biaya dengan orang tua"]),
          step("Kuatkan Matematika & bahasa Inggris", "Bangun fondasi yang dipakai di semua tes.", 0, 4, 1, ["Latihan soal Matematika 3x seminggu", "Baca artikel bahasa Inggris tiap hari 15 menit", "Ikut tryout bahasa Inggris pertama"]),
          step("Ikut seleksi OSN/KSM di sekolah", "Pengalaman lomba sains pertama.", 2, 4, 2, ["Daftar ke guru pembina", "Kerjakan soal tahun lalu", "Ikut seleksi tingkat sekolah"]),
          step("Ambil tes bahasa Inggris resmi", "Target skor sesuai syarat kampus.", 6, 3, 1, ["Pilih tes (IELTS/TOEFL)", "Latihan simulasi 2x", "Ambil tes resmi"]),
          step("Siapkan SAT dan esai pribadi", "Mulai kerangka esai dari pengalamanmu.", light ? 9 : 8, 4, 2, ["Latihan SAT online", "Tulis draf esai pertama", "Minta masukan guru"]),
          step("Kirim aplikasi & beasiswa", "Lengkapi dokumen dan rekomendasi guru.", 13, 3, 1, ["Minta surat rekomendasi", "Isi formulir aplikasi", "Ajukan bantuan finansial"]),
        ],
        habits: [
          { title: "Latihan soal Matematika", category: "belajar", target: light ? 2 : 4, unit: "sesi" },
          { title: "Baca/dengar bahasa Inggris", category: "belajar", target: 5, unit: "hari" },
          { title: "Tidur cukup sebelum jam 22", category: "kebiasaan", target: 5, unit: "hari" },
        ],
      },
      {
        id: "", name: "Jalur Proyek & Portofolio", effort: "sedang", fit: "Cocok kalau kamu suka membuat sesuatu (coding, riset, karya)",
        summary: "Bangun proyek nyata yang menunjukkan rasa ingin tahumu, sambil menjaga nilai tetap baik.",
        steps: [
          step("Pilih satu bidang proyek", "Pilih masalah nyata di sekitarmu yang ingin kamu pecahkan.", 0, 1, 1, ["Tulis 3 ide masalah", "Pilih 1 yang paling kamu suka", "Cari contoh proyek serupa"]),
          step("Buat proyek pertama", "Versi sederhana dulu, yang penting jadi.", 1, 3, 1, ["Tentukan hasil akhir proyek", "Kerjakan 2 sesi per minggu", "Dokumentasikan prosesnya"]),
          step("Ikut lomba riset/inovasi", "Bawa proyekmu ke OPSI atau lomba sejenis.", 4, 4, 2, ["Cek jadwal lomba", "Ubah proyek jadi laporan", "Kirim karya"]),
          step("Ambil tes bahasa Inggris resmi", "Persiapan bertahap tanpa terburu-buru.", 7, 4, 1, ["Latihan simulasi", "Ambil tes resmi"]),
          step("Susun esai dari cerita proyekmu", "Proyek jadi bahan cerita esai yang kuat.", 11, 3, 2, ["Tulis draf esai", "Minta masukan"]),
        ],
        habits: [
          { title: "Kerjakan proyek", category: "minat", target: 2, unit: "sesi" },
          { title: "Belajar bahasa Inggris", category: "belajar", target: 4, unit: "hari" },
        ],
      },
    ],
  },
  {
    match: /\b(ui|itb|ugm|its|ipb|unair|undip|unpad|ptn|kuliah|kedokteran|dokter|snbp|snbt|utbk|teknik|hukum|psikologi)\b/i,
    needs: [
      "Nilai rapor konsisten naik untuk peluang SNBP",
      "Kesiapan UTBK-SNBT (penalaran, literasi, matematika)",
      "Memahami jurusan dan daya tampung kampus impian",
      "Prestasi pendukung (lomba/organisasi) untuk nilai tambah",
      "Rencana cadangan: kampus/jurusan alternatif dan jalur mandiri",
    ],
    opportunities: [
      { name: "Kompetisi Sains Madrasah (KSM)", window: "Biasanya seleksi pertengahan tahun, cek situs resmi Kemenag", why: "Prestasi resmi untuk siswa madrasah" },
      { name: "Olimpiade Sains Nasional (OSN)", window: "Biasanya seleksi awal–pertengahan tahun", why: "Prestasi akademik nasional" },
      { name: "Tryout UTBK-SNBT", window: "Diadakan banyak lembaga sepanjang tahun", why: "Mengukur kesiapan dan melatih manajemen waktu" },
      { name: "Pendaftaran SNBP & SNBT", window: "Biasanya awal tahun saat kelas 12, cek SNPMB", why: "Jalur utama masuk PTN" },
    ],
    build: ({ months }) => [
      {
        id: "", name: "Jalur Rapor (SNBP)", effort: "sedang", fit: "Cocok kalau nilaimu cukup stabil dan kamu rajin",
        summary: "Jaga dan naikkan nilai rapor tiap semester, sambil tetap menyiapkan UTBK sebagai cadangan.",
        steps: [
          step("Riset jurusan & kampus impian", "Cek daya tampung, peminat, dan mata pelajaran pendukung.", 0, 1, 1, ["Bandingkan 3 jurusan", "Catat mapel pendukung", "Diskusikan dengan orang tua"]),
          step("Naikkan nilai mapel pendukung", "Fokus 2 mapel yang paling berpengaruh.", 0, Math.min(6, months), 1, ["Tentukan 2 mapel fokus", "Ulang materi tiap pekan", "Tanya guru tiap ada yang bingung"]),
          step("Bangun prestasi pendukung", "Ikut satu lomba atau organisasi yang relevan.", 2, 5, 2, ["Pilih satu lomba", "Daftar dan latihan", "Ikut seleksi"]),
          step("Mulai latihan UTBK", "Cadangan kalau SNBP belum rezeki.", Math.max(3, months - 10), 6, 2, ["Ikut tryout pertama", "Analisis materi lemah"]),
          step("Daftar SNBP & SNBT", "Ikuti jadwal resmi SNPMB.", Math.max(4, months - 6), 3, 1, ["Cek jadwal resmi", "Siapkan dokumen", "Daftar"]),
        ],
        habits: [
          { title: "Ulang materi mapel fokus", category: "belajar", target: 4, unit: "sesi" },
          { title: "Kerjakan soal latihan", category: "belajar", target: 20, unit: "soal" },
          { title: "Olahraga ringan", category: "kebugaran", target: 2, unit: "kali" },
        ],
      },
      {
        id: "", name: "Jalur Tes (UTBK-SNBT)", effort: "intens", fit: "Cocok kalau kamu kuat di penalaran dan siap latihan rutin",
        summary: "Latihan terstruktur dan tryout berkala supaya skor UTBK-mu tinggi.",
        steps: [
          step("Pahami materi UTBK", "Kenali subtes dan bobotnya.", 0, 1, 1, ["Baca panduan resmi", "Kerjakan 1 paket soal untuk diagnosis"]),
          step("Latihan dasar penalaran", "Bangun fondasi logika & literasi.", 1, 4, 1, ["Latihan 3x seminggu", "Catat jenis soal yang sering salah"]),
          step("Tryout rutin tiap bulan", "Ukur kemajuan secara berkala.", 4, Math.max(3, months - 6), 1, ["Ikut tryout", "Bahas pembahasan", "Perbaiki strategi"]),
          step("Daftar dan ikut UTBK", "Ikuti jadwal resmi SNPMB.", Math.max(5, months - 4), 3, 1, ["Daftar", "Simulasi terakhir", "Ikut tes"]),
        ],
        habits: [
          { title: "Latihan soal UTBK", category: "belajar", target: 5, unit: "sesi" },
          { title: "Tidur cukup", category: "kebiasaan", target: 6, unit: "hari" },
        ],
      },
    ],
  },
  {
    match: /\b(coding|programmer|developer|software|aplikasi|website|web|game|ai|data|teknologi|it|informatika)\b/i,
    needs: [
      "Dasar logika pemrograman dan satu bahasa (mis. Python/JavaScript)",
      "Proyek nyata yang bisa ditunjukkan (portofolio di GitHub)",
      "Bahasa Inggris untuk membaca dokumentasi",
      "Pengalaman lomba atau komunitas teknologi",
    ],
    opportunities: [
      { name: "OSN Informatika", window: "Biasanya seleksi awal–pertengahan tahun", why: "Lomba pemrograman resmi tingkat nasional" },
      { name: "Bebras Challenge Indonesia", window: "Biasanya sekitar November", why: "Melatih computational thinking, cocok untuk pemula" },
      { name: "Festival Inovasi dan Kewirausahaan Siswa Indonesia (FIKSI)", window: "Jadwal berubah tiap tahun, cek situs Puspresnas", why: "Wadah untuk aplikasi/produk teknologi buatanmu" },
      { name: "Hackathon pelajar", window: "Diadakan berbagai komunitas sepanjang tahun", why: "Belajar cepat membuat produk bersama tim" },
    ],
    build: () => [
      {
        id: "", name: "Jalur Builder (Proyek)", effort: "sedang", fit: "Cocok kalau kamu suka langsung praktik",
        summary: "Belajar sambil membangun aplikasi kecil yang makin lama makin besar.",
        steps: [
          step("Kuasai dasar satu bahasa", "Variabel, kondisi, perulangan, fungsi.", 0, 2, 1, ["Pilih bahasa", "Ikuti kursus gratis", "Buat 5 program kecil"]),
          step("Rilis proyek pertama", "Aplikasi sederhana yang bisa dipakai orang lain.", 2, 3, 1, ["Tentukan ide", "Buat versi sederhana", "Unggah ke GitHub"]),
          step("Ikut hackathon atau FIKSI", "Uji proyekmu di lomba.", 5, 4, 2, ["Cari lomba", "Bentuk tim", "Kirim karya"]),
          step("Bangun portofolio", "Kumpulkan 3 proyek terbaik.", 9, 6, 2, ["Rapikan README", "Buat halaman portofolio"]),
        ],
        habits: [
          { title: "Ngoding", category: "minat", target: 4, unit: "sesi" },
          { title: "Baca dokumentasi bahasa Inggris", category: "belajar", target: 3, unit: "kali" },
        ],
      },
      {
        id: "", name: "Jalur Kompetisi (Algoritma)", effort: "intens", fit: "Cocok kalau kamu suka teka-teki logika dan Matematika",
        summary: "Latihan algoritma untuk OSN Informatika dan lomba pemrograman.",
        steps: [
          step("Belajar dasar algoritma", "Sorting, searching, rekursi.", 0, 3, 1, ["Latihan di situs latihan soal", "Catat pola soal"]),
          step("Ikut Bebras / seleksi OSN sekolah", "Pengalaman lomba pertama.", 1, 4, 1, ["Daftar ke guru", "Kerjakan soal tahun lalu"]),
          step("Latihan rutin soal kompetitif", "Naikkan tingkat kesulitan bertahap.", 4, 6, 2, ["5 soal per minggu", "Ikut kontes online"]),
        ],
        habits: [
          { title: "Kerjakan soal algoritma", category: "belajar", target: 5, unit: "soal" },
        ],
      },
    ],
  },
  {
    match: /\b(bisnis|pengusaha|usaha|startup|jualan|wirausaha|ceo|entrepreneur|dagang|toko)\b/i,
    needs: [
      "Memahami dasar bisnis: produk, pelanggan, harga, untung-rugi",
      "Pengalaman nyata menjual sesuatu, sekecil apa pun",
      "Kemampuan komunikasi dan pemasaran digital",
      "Mengatur uang dan mencatat keuangan sederhana",
    ],
    opportunities: [
      { name: "Festival Inovasi dan Kewirausahaan Siswa Indonesia (FIKSI)", window: "Jadwal berubah tiap tahun, cek situs Puspresnas", why: "Lomba resmi untuk ide bisnis pelajar" },
      { name: "Lomba business plan pelajar", window: "Banyak diadakan kampus sepanjang tahun", why: "Melatih menyusun rencana bisnis yang rapi" },
      { name: "Bazar sekolah / pasar kreatif", window: "Biasanya saat acara sekolah", why: "Tempat uji jual produk pertama" },
    ],
    build: () => [
      {
        id: "", name: "Jalur Praktik Langsung", effort: "sedang", fit: "Cocok kalau kamu berani mencoba dan belajar dari pengalaman",
        summary: "Mulai usaha kecil dulu, belajar dari pelanggan nyata, lalu kembangkan.",
        steps: [
          step("Temukan ide produk", "Cari masalah kecil di sekitarmu yang orang mau bayar.", 0, 1, 1, ["Tulis 5 ide", "Tanya 10 teman", "Pilih 1 ide"]),
          step("Jual produk pertama", "Uji pasar dengan modal kecil.", 1, 2, 1, ["Hitung modal & harga", "Buat 10 produk", "Jual ke teman/bazar"]),
          step("Catat keuangan & evaluasi", "Belajar untung-rugi dari data nyata.", 2, 3, 2, ["Catat pemasukan/pengeluaran", "Evaluasi produk"]),
          step("Ikut FIKSI / lomba business plan", "Ubah pengalamanmu jadi proposal.", 5, 4, 2, ["Susun proposal", "Kirim karya"]),
        ],
        habits: [
          { title: "Kerjakan usaha", category: "minat", target: 3, unit: "sesi" },
          { title: "Catat keuangan", category: "kebiasaan", target: 1, unit: "kali" },
        ],
      },
      {
        id: "", name: "Jalur Belajar Dulu", effort: "ringan", fit: "Cocok kalau waktumu terbatas karena fokus sekolah",
        summary: "Bangun ilmu dan jejaring dulu, praktik kecil-kecilan saat libur.",
        steps: [
          step("Pelajari dasar bisnis", "Baca/tonton materi dasar.", 0, 3, 2, ["Baca 1 buku bisnis", "Tonton studi kasus UMKM"]),
          step("Praktik saat libur sekolah", "Jual sesuatu saat libur semester.", 2, 2, 1, ["Siapkan produk", "Jual online"]),
          step("Gabung komunitas wirausaha muda", "Belajar dari orang lain.", 4, 6, 3, ["Cari komunitas", "Ikut 1 acara"]),
        ],
        habits: [{ title: "Baca materi bisnis", category: "minat", target: 2, unit: "kali" }],
      },
    ],
  },
];

const GENERIC: Template = {
  match: /.*/,
  needs: [
    "Memahami dengan jelas apa saja syarat untuk mencapai impian itu",
    "Kemampuan inti yang harus dilatih rutin",
    "Pengalaman nyata (lomba, proyek, organisasi) sebagai bukti",
    "Dukungan orang tua dan guru",
  ],
  opportunities: [
    { name: "Lomba dari Puspresnas Kemendikbud", window: "Jadwal berubah tiap tahun, cek situs resmi", why: "Kumpulan lomba resmi untuk pelajar" },
    { name: "Kompetisi Sains Madrasah (KSM)", window: "Biasanya pertengahan tahun", why: "Lomba resmi untuk siswa madrasah" },
  ],
  build: () => [
    {
      id: "", name: "Jalur Bertahap", effort: "sedang", fit: "Cocok untuk kebanyakan siswa",
      summary: "Kenali syaratnya, latih kemampuan inti, lalu kumpulkan pengalaman nyata.",
      steps: [
        step("Riset impianmu", "Cari tahu syarat dan contoh orang yang sudah mencapainya.", 0, 1, 1, ["Cari 3 sumber informasi", "Tanya guru/kakak kelas"]),
        step("Latih kemampuan inti", "Pilih 1–2 kemampuan terpenting.", 1, 4, 1, ["Tentukan kemampuan", "Latihan rutin"]),
        step("Cari pengalaman nyata", "Lomba, proyek, atau organisasi.", 4, 4, 2, ["Pilih satu kegiatan", "Daftar"]),
        step("Evaluasi dan susun langkah berikutnya", "Lihat kemajuanmu dan sesuaikan.", 8, 2, 3, ["Tulis refleksi", "Perbarui roadmap"]),
      ],
      habits: [{ title: "Latihan kemampuan inti", category: "belajar", target: 3, unit: "sesi" }],
    },
  ],
};

export function rulePlan(profile: PlannerProfile, input: PlannerInput): Plan {
  const t = TEMPLATES.find((x) => x.match.test(input.dream)) ?? GENERIC;
  const months = monthsToGraduation(profile.grade) ?? 18;
  const light = input.hours === HOURS_OPTIONS[0] || (profile.avgEnergy !== null && profile.avgEnergy < 2.5);
  const paths = t.build({ months, light }).map((p, i) => ({ ...p, id: `p${i + 1}` }));
  const energyNote =
    profile.avgEnergy !== null && profile.avgEnergy < 2.5
      ? " Energimu belakangan cenderung rendah, jadi mulai dari jalur yang lebih ringan juga tidak apa-apa."
      : "";
  return {
    dream: input.dream,
    analysis: `Impian "${input.dream}" bisa dipecah jadi langkah-langkah kecil. Dengan waktu luang ${input.hours} per minggu${
      profile.grade ? ` dan posisimu di ${profile.grade}` : ""
    }, kuncinya adalah konsisten, bukan ngebut.${energyNote} Pilih jalur yang paling cocok, lalu centang milestone yang mau kamu ambil.`,
    needs: t.needs,
    paths,
    opportunities: t.opportunities,
    source: "simulasi",
  };
}
