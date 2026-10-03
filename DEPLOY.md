# 🌐 Panduan Deploy: VPS Jagoan Hosting + Webuzo

Analoginya begini: VPS itu kayak **rumah kosong** yang kamu sewa. Kita bakal:
1. Pasang "listrik" (Node.js)
2. Masukin "perabotan" (kode PathFinder)
3. Nyalain "lampu" biar terus nyala (PM2)
4. Pasang "alamat & pintu depan" (domain + SSL lewat Webuzo)

> ⏱️ Perkiraan waktu: 30–60 menit. Kalau mentok di satu langkah, catat pesan error-nya lalu tanyakan.

---

## 0. Yang perlu disiapkan

- [ ] IP VPS dan password `root` (ada di email/dashboard Jagoan Hosting)
- [ ] Domain yang sudah diarahkan ke IP VPS (**A record** `@` dan `www` → IP VPS)
- [ ] (Opsional) Gemini API key dari https://aistudio.google.com/apikey
- [ ] Aplikasi terminal: **Windows** pakai PowerShell/Terminal bawaan, **Mac** pakai Terminal

## 1. Masuk ke VPS lewat SSH

```bash
ssh root@IP_VPS_KAMU
```

Ketik `yes` kalau ditanya, lalu masukkan password (password memang tidak terlihat saat diketik, itu normal).

## 2. Pasang Node.js 22 + alat build

PathFinder butuh **Node.js versi 22 ke atas**. Kita pakai **nvm** supaya tidak bentrok dengan Node bawaan Webuzo:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22
node -v        # harus muncul v22.x.x

npm install -g pm2
```

Alat build ini dibutuhkan untuk database SQLite (`better-sqlite3`):

```bash
# Kalau VPS pakai AlmaLinux/Rocky/CentOS (umum di Webuzo):
dnf install -y git python3 make gcc-c++
# Kalau Ubuntu/Debian:
# apt update && apt install -y git python3 make g++
```

## 3. Ambil kode dari GitHub

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/shanahmadmalikantara-dev/PATHFINDER.git pathfinder
cd pathfinder
git checkout main      # atau branch yang mau di-deploy
```

> Kalau repo-nya **private**, GitHub akan minta login. Pakai *Personal Access Token* sebagai password (GitHub → Settings → Developer settings → Tokens).

## 4. Atur konfigurasi (.env)

```bash
cp .env.example .env
nano .env
```

Isi seperti ini:

```
DATABASE_PATH=./data/pathfinder.db
GEMINI_API_KEY=isi_api_key_kamu_disini
GEMINI_MODEL=gemini-2.5-flash
DEMO_MODE=true
```

Simpan dengan `Ctrl+O` → Enter, lalu keluar dengan `Ctrl+X`.

> Setelah lomba selesai, ganti `DEMO_MODE=false` biar tombol akun demo hilang.

## 5. Install, build, dan buat data demo

```bash
npm ci
npm run build
npm run seed
```

## 6. Nyalakan dengan PM2 (biar jalan terus 24 jam)

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup        # salin & jalankan perintah yang muncul, supaya auto-nyala saat VPS restart
```

Cek apakah sudah jalan:

```bash
pm2 status
curl -I http://localhost:3000     # harus muncul "HTTP/1.1 200 OK"
```

Sampai sini aplikasi sudah hidup di port **3000**, tapi belum bisa dibuka dari luar. Langkah berikutnya menyambungkan domain.

## 7. Sambungkan domain lewat Webuzo (Reverse Proxy)

Analoginya: Webuzo jadi **resepsionis**. Tamu yang datang ke `domainmu.com` diantar ke "kamar" port 3000.

1. Login panel Webuzo: `https://IP_VPS:2003` (panel user) atau `https://IP_VPS:2005` (panel admin)
2. Tambahkan domain kamu di menu **Domain → Add Domain** (kalau belum)
3. Buka **Domain → Manage Domain**, pilih domain kamu, lalu cari opsi **Proxy / Reverse Proxy**
   (di beberapa versi letaknya di menu **Application Manager → Add Application**: pilih tipe *Node.js*, isi port `3000`, path `/`)
4. Isi target proxy: `http://127.0.0.1:3000`
5. **SSL**: buka **Security → SSL Certificate / Let's Encrypt**, lalu install sertifikat untuk domain kamu

> **PENTING:** PWA (install ke HP) dan enkripsi jurnal **wajib HTTPS**. Pastikan SSL sudah aktif dan buka situsnya lewat `https://`.

Kalau menu proxy tidak ketemu, ambil screenshot menu Webuzo kamu dan tanyakan. Tampilan Webuzo bisa beda-beda tergantung versinya.

## 8. Tes!

1. Buka `https://domainmu.com` di HP
2. Login pakai akun demo Shan (anak) di HP 1, dan Bu Putri (orang tua) di HP 2
3. Di HP anak: tekan **Bicara → pilih topik → Saya Siap Berdiskusi**
4. Dalam ±3 detik, HP orang tua akan bergetar & menampilkan pop-up "Shan siap berdiskusi!" 🎉
5. Install sebagai aplikasi: **Profil → Install PathFinder**, atau lewat menu browser **"Tambahkan ke layar utama"**

---

## 🔄 Update aplikasi (setelah ada perubahan kode)

```bash
cd /var/www/pathfinder
git pull
npm ci
npm run build
pm2 restart pathfinder
```

## 💾 Backup database

Semua data ada di satu file: `data/pathfinder.db`. Backup secara rutin:

```bash
cp data/pathfinder.db ~/backup-pathfinder-$(date +%F).db
```

## 🩺 Kalau ada masalah

| Masalah | Solusi |
|---|---|
| `pm2 status` menunjukkan *errored* | Jalankan `pm2 logs pathfinder` untuk melihat errornya |
| Error `better-sqlite3` waktu `npm ci` | Pastikan langkah 2 (python3, make, g++) sudah dijalankan, lalu ulangi `npm ci` |
| Error `NODE_MODULE_VERSION` | Versi Node berubah. Jalankan `npm rebuild better-sqlite3` |
| Halaman 502 Bad Gateway | Aplikasi mati atau port salah. Cek `pm2 status` dan pastikan proxy mengarah ke port 3000 |
| Login tidak "nempel" | Pastikan situs dibuka lewat HTTPS dan proxy meneruskan header `X-Forwarded-Proto` |
| Tombol install PWA tidak muncul | Wajib HTTPS. Coba buka di Chrome Android |
| Gemini tidak jalan | Cek `GEMINI_API_KEY`, lalu `pm2 restart pathfinder`. Aplikasi tetap jalan pakai AI simulasi |
