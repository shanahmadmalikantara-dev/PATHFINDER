// Skema database PathFinder AI (SQLite).
// File ini dipakai bersama oleh aplikasi (src/lib/db.ts) dan script seed demo.
//
// PRIVACY BOUNDARY: perhatikan bahwa TIDAK ADA tabel untuk jurnal/curhatan anak.
// Jurnal hanya tersimpan (terenkripsi) di perangkat anak, tidak pernah dikirim ke server.

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS families (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  role           TEXT NOT NULL CHECK (role IN ('child', 'parent')),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  family_id      INTEGER REFERENCES families(id),
  grade          TEXT,             -- anak: mis. "Kelas 11"
  relation       TEXT,             -- orang tua: Ibu / Ayah / Wali
  capability     TEXT NOT NULL DEFAULT 'sedikit', -- orang tua: sibuk / sedikit / banyak
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL
);

-- Check-in harian: hanya angka energi & kategori mood (Shared Insight).
CREATE TABLE IF NOT EXISTS checkins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,       -- YYYY-MM-DD (zona Asia/Jakarta)
  energy      INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  mood        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (child_id, date)
);

-- Target mingguan ("Fokus Utama").
CREATE TABLE IF NOT EXISTS goals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week        TEXT NOT NULL,       -- tanggal Senin minggu tsb (YYYY-MM-DD)
  title       TEXT NOT NULL,
  detail      TEXT,
  category    TEXT NOT NULL DEFAULT 'belajar',
  target      INTEGER NOT NULL DEFAULT 1,
  unit        TEXT NOT NULL DEFAULT 'kali',
  progress    INTEGER NOT NULL DEFAULT 0,
  milestone_id INTEGER,           -- target yang dibuat dari milestone (Rancang dengan AI)
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Roadmap masa depan.
CREATE TABLE IF NOT EXISTS milestones (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  horizon      TEXT NOT NULL DEFAULT 'tahun_ini', -- tahun_ini / jangka_panjang
  status       TEXT NOT NULL DEFAULT 'rencana',   -- rencana / berjalan / selesai
  target_date  TEXT,
  shared       INTEGER NOT NULL DEFAULT 0,        -- 1 = "Agenda Bersama" (terlihat ortu)
  tasks        TEXT,                              -- JSON [{t, done}] checklist langkah
  dream        TEXT,                              -- impian induk (dari Rancang dengan AI)
  priority     INTEGER NOT NULL DEFAULT 2,        -- 1 tinggi, 2 sedang, 3 rendah
  period       TEXT,                              -- mis. "Nov 2026 – Jan 2027"
  xp           INTEGER NOT NULL DEFAULT 100,
  position     INTEGER NOT NULL DEFAULT 0,
  done_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ruang Bicara (Bridging Room): sinyal kesiapan diskusi.
CREATE TABLE IF NOT EXISTS talks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  family_id        INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topics           TEXT NOT NULL,     -- JSON array
  preferred_time   TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'menunggu', -- menunggu / disepakati / ditunda / selesai / dibatalkan
  initiator        TEXT NOT NULL DEFAULT 'child',    -- siapa yang mengajak: child / parent
  initiator_id     INTEGER REFERENCES users(id),
  note             TEXT,                             -- pesan singkat dari yang mengajak
  responder_id     INTEGER REFERENCES users(id),
  response         TEXT,                             -- balasan pihak lain
  parent_id        INTEGER REFERENCES users(id),     -- (lama) digantikan responder_id
  parent_response  TEXT,                             -- (lama) digantikan response
  outcome          TEXT,              -- ringkasan hasil (ditulis bersama, opsional)
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cache teks AI (agar tidak memanggil Gemini terus-menerus).
CREATE TABLE IF NOT EXISTS ai_cache (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_checkins_child_date ON checkins(child_id, date);
CREATE INDEX IF NOT EXISTS idx_goals_child_week ON goals(child_id, week);
CREATE INDEX IF NOT EXISTS idx_milestones_child ON milestones(child_id);
CREATE INDEX IF NOT EXISTS idx_talks_family ON talks(family_id, status);
`;

// Migrasi ringan untuk database yang dibuat sebelum kolom-kolom baru ada.
// Aman dijalankan berkali-kali.
const ADDED_COLUMNS = {
  milestones: [
    ["tasks", "TEXT"],
    ["dream", "TEXT"],
    ["priority", "INTEGER NOT NULL DEFAULT 2"],
    ["period", "TEXT"],
  ],
  talks: [
    ["initiator", "TEXT NOT NULL DEFAULT 'child'"],
    ["initiator_id", "INTEGER"],
    ["note", "TEXT"],
    ["responder_id", "INTEGER"],
    ["response", "TEXT"],
  ],
  goals: [["milestone_id", "INTEGER"]],
};

export function migrate(db) {
  for (const [table, cols] of Object.entries(ADDED_COLUMNS)) {
    const have = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const [name, type] of cols) {
      if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
    }
  }
  // Data lama Ruang Bicara: pindahkan balasan ortu ke kolom umum
  db.exec(`UPDATE talks SET response = parent_response, responder_id = parent_id
           WHERE response IS NULL AND parent_response IS NOT NULL`);
  db.exec(`UPDATE talks SET initiator_id = child_id WHERE initiator_id IS NULL AND initiator = 'child'`);
}
