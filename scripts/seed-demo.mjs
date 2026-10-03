// ============================================================================
//  Membuat akun DEMO untuk presentasi lomba.
//  Jalankan: npm run seed
//
//  Anak      : shan@demo.id   / pathfinder
//  Orang tua : putri@demo.id  / pathfinder
//  Kode keluarga: PATH07
//
//  Script ini aman dijalankan berulang: data demo lama dihapus lalu dibuat ulang
//  (data pengguna lain tidak disentuh).
// ============================================================================
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "../src/lib/schema.mjs";

// Muat .env sederhana (tanpa dependency tambahan)
if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const file = path.resolve(process.env.DATABASE_PATH || "./data/pathfinder.db");
fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new Database(file);
db.pragma("foreign_keys = ON");
db.exec(SCHEMA);

const TZ = "Asia/Jakarta";
const day = (offset) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(Date.now() + offset * 86400000));
const today = day(0);
const wd = new Date(today + "T00:00:00Z").getUTCDay();
const monday = day(wd === 0 ? -6 : 1 - wd);

const run = db.transaction(() => {
  // Hapus data demo lama
  const old = db.prepare("SELECT family_id FROM users WHERE email IN ('shan@demo.id','putri@demo.id')").all();
  db.prepare("DELETE FROM users WHERE email IN ('shan@demo.id','putri@demo.id')").run();
  for (const { family_id } of old) if (family_id) db.prepare("DELETE FROM families WHERE id = ? AND NOT EXISTS (SELECT 1 FROM users WHERE family_id = ?)").run(family_id, family_id);
  db.prepare("DELETE FROM families WHERE code = 'PATH07'").run();

  const fam = Number(db.prepare("INSERT INTO families (code) VALUES ('PATH07')").run().lastInsertRowid);
  const hash = bcrypt.hashSync("pathfinder", 10);
  const child = Number(db.prepare("INSERT INTO users (role, name, email, password_hash, family_id, grade) VALUES ('child','Shan','shan@demo.id',?,?,'Kelas 11 • MAN 4 Jakarta')").run(hash, fam).lastInsertRowid);
  db.prepare("INSERT INTO users (role, name, email, password_hash, family_id, relation, capability) VALUES ('parent','Bu Putri','putri@demo.id',?,?,'Ibu','sedikit')").run(hash, fam);

  // 13 hari check-in: awalnya semangat, 3 hari terakhir energi menurun
  // (supaya Panduan Parenting menampilkan skenario "energi turun" seperti di proposal).
  // Hari ini sengaja dikosongkan agar bisa didemokan langsung.
  const pattern = [
    [-13, 4, "senang"], [-12, 4, "tenang"], [-11, 5, "senang"], [-10, 3, "tenang"], [-9, 4, "senang"],
    [-8, 4, "tenang"], [-7, 5, "senang"], [-6, 4, "tenang"], [-5, 4, "senang"], [-4, 3, "bingung"],
    [-3, 2, "capek"], [-2, 2, "bingung"], [-1, 2, "capek"],
  ];
  const ck = db.prepare("INSERT INTO checkins (child_id, date, energy, mood) VALUES (?, ?, ?, ?)");
  for (const [o, e, m] of pattern) ck.run(child, day(o), e, m);

  const goal = db.prepare("INSERT INTO goals (child_id, week, title, detail, category, target, unit, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  goal.run(child, monday, "Belajar UTBK & Sekolah", "Fokus Saintek, Kimia & Literasi B. Inggris", "belajar", 6, "jam", 4);
  goal.run(child, monday, "Kebugaran Santai", "Jogging ringan sore & peregangan", "kebugaran", 3, "sesi", 2);
  goal.run(child, monday, "Eksplorasi Minat", "Coding Web Kreatif & Desain Antarmuka", "minat", 2, "modul", 1);

  const ms = db.prepare("INSERT INTO milestones (child_id, title, description, horizon, status, target_date, shared, xp, position, done_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  ms.run(child, "Kenali Minat & Bakat Pribadi", "Mengisi asesmen kepribadian Holland & refleksi diri santai selama liburan semester.", "tahun_ini", "selesai", "Januari", 0, 100, 1, day(-60));
  ms.run(child, "Pilih 3 Jurusan Kuliah Impian", "Desain Komunikasi Visual, Ilmu Komunikasi, Sistem Informasi — rangkum silabus & prospek karir.", "tahun_ini", "selesai", "Januari", 1, 150, 2, day(-45));
  ms.run(child, "Fokus Nilai Semester & Latihan Soal", "Meningkatkan rata-rata rapor Bahasa & Matematika untuk seleksi jalur prestasi.", "tahun_ini", "berjalan", "Akhir Februari", 0, 100, 3, null);
  ms.run(child, "Kunjungi Pameran Pendidikan Bersama Orang Tua", "Mengunjungi booth universitas, mengambil brosur biaya, dan merasakan suasana kampus bersama ayah & ibu.", "tahun_ini", "rencana", "Maret", 1, 100, 4, null);
  ms.run(child, "Masuk Universitas Impian! 🎓", "Meraih kursi di program studi impian. Target perayaan: makan malam keluarga & foto toga bersama.", "jangka_panjang", "rencana", "Musim masuk PTN", 1, 300, 5, null);
  ms.run(child, "Bangun Startup Pertama", "Membuat produk digital yang membantu banyak orang — mulai dari proyek kecil.", "jangka_panjang", "rencana", "Usia 22", 0, 300, 6, null);

  db.prepare("INSERT INTO talks (family_id, child_id, topics, preferred_time, status, outcome, created_at, updated_at) VALUES (?, ?, ?, 'Akhir pekan', 'selesai', ?, datetime('now','-6 days'), datetime('now','-5 days'))")
    .run(fam, child, JSON.stringify(["Ekskul & Jam Pulang"]), "Sepakat: boleh ikut ekskul robotik, pulang maksimal jam 6 sore.");
});
run();

console.log(`✅ Data demo siap di ${file}
   Anak      : shan@demo.id  / pathfinder
   Orang tua : putri@demo.id / pathfinder
   Kode keluarga: PATH07`);
