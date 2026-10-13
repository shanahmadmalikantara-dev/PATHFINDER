// ============================================================================
//  Isi data demo untuk FINAL lomba pada akun yang SUDAH ADA.
//
//  Jalankan (di folder aplikasi):
//    npm run seed:final -- --dry-run     # lihat dulu apa yang akan diubah
//    npm run seed:final                  # jalankan sungguhan
//
//  Opsi:
//    --email=alamat@email   akun target (bawaan: stockbandung033@gmail.com)
//    --hari-ini             ikut isi check-in hari ini (bawaan: dikosongkan agar
//                           check-in bisa didemokan langsung saat presentasi)
//    --dry-run              hanya menampilkan rencana, tidak menulis apa pun
//
//  Yang diubah HANYA milik akun target dan anak yang terhubung di keluarganya:
//    - 21 hari check-in (naik-turun wajar, menurun menjelang ujian)
//    - 3 milestone roadmap (1 selesai). Milestone lain milik anak tidak disentuh.
//    - 1 sinyal Ruang Bicara dari anak (ajakan aktif lama dibatalkan, persis
//      seperti saat anak mengirim ajakan baru dari aplikasi)
//  Script ini tidak membuat, mengubah, atau menghapus akun, sesi, maupun password.
//  Aman dijalankan berulang.
// ============================================================================
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA, migrate } from "../src/lib/schema.mjs";

// Muat .env sederhana (tanpa dependency tambahan)
if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const EMAIL = (opt("email")?.split("=")[1] || "stockbandung033@gmail.com").trim().toLowerCase();
const DRY = !!opt("dry-run");
const WITH_TODAY = !!opt("hari-ini");

const file = path.resolve(process.env.DATABASE_PATH || "./data/pathfinder.db");
if (!fs.existsSync(file)) {
  console.error(`Database tidak ditemukan: ${file}`);
  process.exit(1);
}
// --dry-run membuka database read-only: benar-benar tidak ada yang ditulis.
const db = new Database(file, { readonly: DRY });
db.pragma("busy_timeout = 5000");
if (!DRY) {
  db.pragma("foreign_keys = ON");
  // Sama seperti saat aplikasi start (idempoten): pastikan tabel/kolom/trigger terbaru ada.
  db.exec(SCHEMA);
  migrate(db);
}

// ---------------------------------------------------------------- akun target
const target = db.prepare("SELECT id, role, name, email, family_id FROM users WHERE lower(email) = ?").get(EMAIL);
if (!target) {
  console.error(`Akun ${EMAIL} tidak ditemukan. Tidak ada data yang diubah.`);
  process.exit(1);
}
const children =
  target.role === "child"
    ? [target]
    : target.family_id
      ? db.prepare("SELECT id, role, name, email, family_id FROM users WHERE family_id = ? AND role = 'child' ORDER BY id").all(target.family_id)
      : [];
if (!children.length) {
  console.error(`Akun ${EMAIL} belum terhubung dengan akun anak. Tidak ada data yang diubah.`);
  process.exit(1);
}

// ---------------------------------------------------------------------- waktu
const TZ = "Asia/Jakarta";
const day = (offset) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(Date.now() + offset * 86400000));

// 21 hari, terlama → terbaru. Pola wajar: naik-turun (lebih segar di akhir pekan),
// lalu menurun di 6 hari terakhir karena ujian sudah dekat.
const PATTERN = [
  [4, "tenang"], [4, "senang"], [3, "tenang"], [4, "senang"], [5, "senang"], [4, "tenang"], [3, "capek"],
  [4, "tenang"], [3, "bingung"], [4, "senang"], [5, "senang"], [4, "tenang"], [3, "capek"], [4, "tenang"],
  [3, "bingung"], [3, "capek"], [2, "stres"], [3, "bingung"], [2, "capek"], [2, "stres"], [2, "capek"],
];
const offsets = PATTERN.map((_, i) => i - PATTERN.length + (WITH_TODAY ? 1 : 0)); // -21..-1 atau -20..0

const MILESTONES = [
  {
    title: "Selesaikan kursus dasar Python",
    description: "Menuntaskan modul dasar: variabel, perulangan, fungsi, dan satu proyek kecil kalkulator nilai.",
    horizon: "tahun_ini", status: "selesai", period: "Agu – Sep 2026", priority: 2, xp: 100, done_at: day(-12),
    tasks: [{ t: "Tonton modul 1–5", done: true }, { t: "Kerjakan 20 latihan", done: true }, { t: "Buat proyek kalkulator nilai", done: true }],
  },
  {
    title: "Lolos seleksi OSN Informatika tingkat sekolah",
    description: "Latihan soal algoritma rutin dan ikut seleksi yang diadakan guru pembina.",
    horizon: "tahun_ini", status: "berjalan", period: "Okt 2026 – Feb 2027", priority: 1, xp: 150, done_at: null,
    tasks: [{ t: "Daftar ke guru pembina", done: true }, { t: "Kerjakan soal OSN tahun lalu", done: false }, { t: "Ikut seleksi sekolah", done: false }],
  },
  {
    title: "Siap menghadapi ujian akhir semester",
    description: "Menyusun jadwal belajar yang realistis supaya tetap cukup istirahat menjelang ujian.",
    horizon: "tahun_ini", status: "rencana", period: "Nov – Des 2026", priority: 1, xp: 100, done_at: null,
    tasks: [{ t: "Buat jadwal belajar per mapel", done: false }, { t: "Latihan soal 3x seminggu", done: false }, { t: "Tidur sebelum jam 22", done: false }],
  },
];

const TALK = {
  topics: ["Jadwal & Waktu Istirahat", "Tekanan Belajar di Sekolah"],
  time: "Nanti malam",
  note: "Minggu ini lagi capek karena mau ujian. Boleh ngobrol soal jadwal les?",
};

// ---------------------------------------------------------------- ringkasan
console.log(`${DRY ? "[DRY RUN] " : ""}Database : ${file}`);
console.log(`Akun target: ${target.name} <${target.email}> (${target.role === "parent" ? "orang tua" : "anak"})`);
for (const c of children) {
  console.log(`- Anak: ${c.name} <${c.email}>`);
  console.log(`    check-in ${PATTERN.length} hari: ${day(offsets[0])} s/d ${day(offsets[offsets.length - 1])}`);
  console.log(`    milestone: ${MILESTONES.map((m) => `${m.title} [${m.status}]`).join("; ")}`);
  console.log(`    Ruang Bicara: ${TALK.topics.join(", ")} (${TALK.time})`);
}
if (DRY) {
  console.log("\nTidak ada yang ditulis. Jalankan tanpa --dry-run untuk menerapkan.");
  process.exit(0);
}

// -------------------------------------------------------------------- tulis
const upsertCheckin = db.prepare(
  `INSERT INTO checkins (child_id, date, energy, mood) VALUES (?, ?, ?, ?)
   ON CONFLICT(child_id, date) DO UPDATE SET energy = excluded.energy, mood = excluded.mood`,
);
const deleteSeedMilestone = db.prepare("DELETE FROM milestones WHERE child_id = ? AND title = ?");
const insertMilestone = db.prepare(
  `INSERT INTO milestones (child_id, title, description, horizon, status, target_date, shared, tasks, priority, period, xp, position, done_at)
   VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
);
const cancelActiveTalks = db.prepare(
  `UPDATE talks SET status = 'dibatalkan', updated_at = datetime('now')
   WHERE child_id = ? AND status IN ('menunggu','disepakati','ditunda')`,
);
const insertTalk = db.prepare(
  `INSERT INTO talks (family_id, child_id, topics, preferred_time, status, initiator, initiator_id, note)
   VALUES (?, ?, ?, ?, 'menunggu', 'child', ?, ?)`,
);

db.transaction(() => {
  for (const c of children) {
    PATTERN.forEach(([energy, mood], i) => upsertCheckin.run(c.id, day(offsets[i]), energy, mood));

    let pos = db.prepare("SELECT COALESCE(MAX(position), 0) p FROM milestones WHERE child_id = ?").get(c.id).p;
    for (const m of MILESTONES) {
      deleteSeedMilestone.run(c.id, m.title);
      insertMilestone.run(
        c.id, m.title, m.description, m.horizon, m.status, m.period, JSON.stringify(m.tasks), m.priority, m.period, m.xp, ++pos, m.done_at,
      );
    }

    if (c.family_id) {
      cancelActiveTalks.run(c.id);
      insertTalk.run(c.family_id, c.id, JSON.stringify(TALK.topics), TALK.time, c.id, TALK.note);
    } else {
      console.log(`  (lewati Ruang Bicara untuk ${c.name}: belum terhubung dengan keluarga)`);
    }
  }
})();

console.log(`\nSelesai: data demo terisi untuk ${children.length} anak.`);
