# 🧭 PathFinder AI

> **Dari Mengawasi Menuju Memahami.**
> Aplikasi PWA dua mode (Dual-Mode) untuk remaja dan orang tua. Remaja dapat merefleksikan diri dan merencanakan masa depan, sementara orang tua mendapat panduan untuk mendukung anak **tanpa melanggar privasinya**.

Dikembangkan untuk **World Youth Invention and Innovation Award (WYIIA) 2026**, kategori Teknologi.
Tim: Shan Ahmad Malikantara & Ahmad Hisyam Putra Alika Ahmudi, MAN 4 Jakarta.

---

## ✨ Fitur MVP

| Mode Anak 🧡 | Mode Orang Tua 💚 |
|---|---|
| **Daily Check-In** (energi + mood, < 1 menit) | **Metrik mingguan**: konsistensi, tren energi, progres target |
| **Target Mingguan** dengan progres +/- | **Panduan Tindakan Parenting** (AI) |
| **Jurnal Rahasia** terenkripsi AES-256 dengan PIN | **Hindari vs Lebih Baik**: contoh kalimat komunikasi |
| **Roadmap** masa depan, lengkap dengan XP & level | **Pemantik obrolan** yang disesuaikan situasi |
| **Ruang Bicara**: sinyal "Saya Siap Berdiskusi" | **Capability Filter**: saran disesuaikan waktu luang orang tua |
| **Kopilot AI**: latihan bicara & menyusun rencana belajar | **Ruang Bicara**: balas "Siap juga" / "Minta waktu lain" |

Fitur bersama: kode keluarga 6 digit, notifikasi, PWA yang bisa di-install dan punya halaman offline, serta tampilan responsif untuk HP dan desktop.

## 🔒 Privacy Boundary (inti inovasi)

```
HP ANAK                              SERVER                         HP ORANG TUA
┌─────────────────────┐   hanya angka   ┌──────────────┐  insight   ┌────────────────────┐
│ Jurnal (AES-256,    │ ──────────────▶ │ energi 1–5   │ ─────────▶ │ Tren & saran       │
│ PIN) TIDAK PERNAH   │  energi, mood,  │ mood (label) │  + saran   │ tindakan, BUKAN    │
│ keluar dari HP      │  progres target │ progres %    │  AI        │ isi curhat anak    │
└─────────────────────┘                 └──────────────┘            └────────────────────┘
```

- **Jurnal tidak punya tabel di database.** Jurnal dienkripsi di browser (PBKDF2 → AES-256-GCM) dan disimpan di `localStorage` HP anak. Server, developer, maupun orang tua tidak bisa membacanya.
- **Peran dikunci per akun.** Akun anak tidak bisa membuka halaman orang tua, begitu juga sebaliknya (lihat `requireRole` di `src/lib/auth.ts`).
- Data yang dikirim ke Gemini hanya **ringkasan agregat** (angka/label), tanpa teks pribadi.
- Milestone roadmap bersifat pribadi, kecuali yang ditandai anak sebagai **Agenda Bersama**.

## 🤖 AI: Simulasi + Gemini

- **AI simulasi** (`src/lib/insight.ts`) adalah mesin aturan yang membaca pola energi, konsistensi, dan target, lalu memilih satu dari 7 situasi dengan panduan, kalimat, dan 3 langkah aksi untuk tiap kapasitas waktu orang tua. Mesin ini **selalu aktif dan tidak butuh internet**.
- **Gemini (opsional)**: kalau `GEMINI_API_KEY` diisi, Panduan Parenting dipersonalisasi dan Kopilot memakai AI asli. Kalau gagal atau timeout, aplikasi otomatis kembali ke AI simulasi, jadi demo tetap aman.
- AI **tidak mendiagnosis**. Bila energi dan mood rendah terus-menerus, aplikasi menyarankan orang tua berkonsultasi dengan guru BK atau psikolog.

## 🛠️ Teknologi

Next.js 15 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4, SQLite (better-sqlite3), bcrypt, Web Crypto API, Service Worker.

## 🚀 Menjalankan di komputer sendiri

Butuh **Node.js 22+**.

```bash
npm install
cp .env.example .env      # lalu isi GEMINI_API_KEY bila ada
npm run seed              # membuat akun demo
npm run dev               # buka http://localhost:3000
```

**Akun demo** (password: `pathfinder`):
- Anak: `shan@demo.id`
- Orang tua: `putri@demo.id`
- Kode keluarga: `PATH07`

Di halaman **Masuk** juga ada tombol "Coba akun demo" (aktif kalau `DEMO_MODE=true`).

## 🌐 Deploy ke VPS

Lihat **[DEPLOY.md](./DEPLOY.md)** untuk panduan langkah demi langkah di VPS Jagoan Hosting + Webuzo.

## 📁 Struktur folder

```
src/
  app/
    page.tsx            Landing
    mulai/              Onboarding pilih peran
    daftar/ masuk/      Registrasi & login
    anak/               Mode Anak (beranda, checkin, roadmap, bicara, profil)
    ortu/               Mode Orang Tua (beranda, roadmap, bicara, profil)
    manifest.ts         Manifest PWA
  actions/              Server Actions (auth, anak, orang tua)
  lib/
    schema.mjs          Skema database
    insight.ts          🧠 Mesin insight (AI simulasi)
    gemini.ts           Integrasi Gemini (opsional)
    journal-crypto.ts   🔐 Enkripsi jurnal di perangkat
  components/           Komponen UI
public/sw.js            Service worker (offline & install)
scripts/seed-demo.mjs   Data demo
```

## ⚠️ Batasan (sesuai proposal)

PathFinder AI adalah prototipe. Aplikasi ini **bukan alat diagnosis kesehatan mental** dan tidak menggantikan peran psikolog, konselor, atau guru BK.
