# 🌐 Panduan Deploy: VPS Jagoan Hosting (NAT) + Webuzo

Panduan ini ditulis ulang dari proses deploy yang **benar-benar berhasil** di VPS Jagoan Hosting
(Ubuntu 24.04 + Webuzo, domain `pathfind.my.id`).

Analogi singkat:
- **VPS** = unit apartemen kita. Alamat gedungnya (IP publik `101.50.1.15`) dipakai bareng penghuni lain,
  dan alamat internal unit kita `172.16.0.178` (inilah *VPS NAT*).
- **Domain Forward** (panel Jagoan) = resepsionis gedung yang mengantar tamu ke pintu unit kita.
- **Webuzo (Apache)** = penyambut tamu di dalam unit, yang meneruskan tamu ke aplikasi.
- **PM2** = satpam yang menjaga aplikasi Next.js (port 3000) tetap menyala 24 jam.

```
Pengunjung ──▶ pathfind.my.id (DNS A → 101.50.1.15)
           ──▶ Domain Forward Jagoan (80→80, 443→443)
           ──▶ Webuzo Apache di VPS (SSL Let's Encrypt)
           ──▶ ProxyPass ke 127.0.0.1:3000
           ──▶ Next.js (PM2)
```

> ⏱️ Total waktu: sekitar 1–2 jam (termasuk menunggu DNS).
> 💡 Aturan emas: sebelum paste perintah, pastikan awal barisnya `root@pathfind...#`
> (artinya kamu sudah di VPS), bukan `PS C:\Users\...>` (masih di laptop).

---

## 1. Arahkan domain ke VPS (DNS A record)

Dashboard Jagoan → **Domains** → `pathfind.my.id` → **DNS Management**.
Ubah record **A** untuk `pathfind.my.id.` menjadi **`101.50.1.15`** → **Save**.
(Record `www` berupa CNAME ke `pathfind.my.id` biarkan saja.)

> Perubahan DNS butuh waktu menyebar (TTL 14400 = sampai ±4 jam). Selama itu, perangkat yang
> memakai DNS lama (misalnya router WiFi rumah) bisa masih nyasar ke alamat lama dan muncul
> `ERR_CONNECTION_CLOSED`. Cek dengan `nslookup pathfind.my.id 8.8.8.8` (harus `101.50.1.15`).
> Solusi: tunggu, pakai data seluler, atau restart router.

## 2. Masuk SSH lewat port forward

VPS NAT tidak membuka port 22 langsung. Lihat **Domain Forward** di panel Jagoan: ada baris
`101.50.1.15 : 52400 → 22 (TCP)`. Jadi login SSH:

```bash
ssh -p 52400 root@101.50.1.15
```

Password root ada di email aktivasi ("Informasi Login Webuzo"). **Segera ganti** setelah login:

```bash
passwd
```

## 3. Pasang Node.js 22, PM2, dan alat build

Pakai mode non-interaktif supaya tidak muncul jendela biru konfigurasi:

```bash
export DEBIAN_FRONTEND=noninteractive; dpkg --configure -a; apt-get update && apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" git build-essential python3 nano && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm install 22 && nvm alias default 22 && npm install -g pm2 && node -v && pm2 -v
```

> Kalau muncul `Could not get lock ... held by process NNNN`, berarti ada proses apt lama yang
> nyangkut: jalankan `kill NNNN`, tunggu beberapa detik, lalu ulangi perintah di atas.

## 4. Ambil kode & atur `.env`

```bash
mkdir -p /var/www && cd /var/www && git clone https://github.com/shanahmadmalikantara-dev/PATHFINDER.git pathfinder && cd pathfinder
printf 'DATABASE_PATH=./data/pathfinder.db\nGEMINI_API_KEY=\nGEMINI_MODEL=gemini-2.5-flash\nDEMO_MODE=true\n' > .env && chmod 600 .env
```

Masukkan API key Gemini (key terlihat saat di-paste, lalu layar dibersihkan):

```bash
read -rp "API KEY: " K; sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$K|" .env; unset K; clear; awk -F= '{print $1, "-> panjang isi:", length($2)}' .env
```

Baris `GEMINI_API_KEY` harus **bukan 0**. ⚠️ Jangan screenshot layar yang menampilkan API key.

## 5. Build, isi data demo, nyalakan dengan PM2

```bash
cd /var/www/pathfinder && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && npm ci && npm run build && npm run seed && pm2 start ecosystem.config.cjs && pm2 save && pm2 startup systemd -u root --hp /root && curl -s -o /dev/null -w "STATUS: %{http_code}\n" http://localhost:3000/masuk
```

Harus muncul `STATUS: 200`. Cek kapan saja dengan `pm2 status` (baris `pathfinder` harus `online`).

## 6. Buka pintu 80 & 443 di Domain Forward

Panel Jagoan → **Domain Forward** → **+ Add New**, buat dua entri:

| Protocol | Hostname |
|---|---|
| HTTPS | `pathfind.my.id` |
| HTTP | `pathfind.my.id` |

Hasilnya di tabel: `pathfind.my.id 443 → 443 (HTTPS)` dan `pathfind.my.id 80 → 80 (HTTP)`.

## 7. Daftarkan domain di Webuzo

1. Buka panel admin Webuzo: `https://pathfind.my.id:2005` (login `root`). Peringatan sertifikat di
   port panel ini wajar → **Advanced → Proceed**.
2. **Users → Create New Account**:
   - Username: `pathfind`
   - Domain: `pathfind.my.id`
   - Email & password (password **beda** dari root)
   - Plan & Resource: biarkan default → **Add User**

Webuzo otomatis membuat vhost Apache untuk domain ini, beserta "slot" konfigurasi khusus yang
tidak tertimpa saat Webuzo update:
`/var/webuzo-data/apache2/custom/domains/pathfind.my.id.conf`

## 8. Sambungkan domain ke aplikasi (reverse proxy)

Isi slot khusus tadi agar Apache meneruskan pengunjung ke Next.js di port 3000
(folder `.well-known/acme-challenge` dikecualikan supaya perpanjangan SSL tetap jalan):

```bash
mkdir -p /var/webuzo-data/apache2/custom/domains && cat > /var/webuzo-data/apache2/custom/domains/pathfind.my.id.conf <<'EOF'
# PathFinder AI: teruskan pengunjung ke aplikasi Next.js (PM2, port 3000)
ProxyPreserveHost On
ProxyRequests Off
ProxyPass /.well-known/acme-challenge/ !
ProxyPass / http://127.0.0.1:3000/
ProxyPassReverse / http://127.0.0.1:3000/
<IfModule mod_headers.c>
  RequestHeader set X-Forwarded-Proto "https" env=HTTPS
</IfModule>
EOF
/usr/local/apps/apache2/bin/httpd -t && (systemctl restart httpd 2>/dev/null || /usr/local/apps/apache2/bin/apachectl -k graceful)
curl -s -o /dev/null -w "TES DOMAIN: %{http_code}\n" -H "Host: pathfind.my.id" http://127.0.0.1/masuk
```

Harus muncul `Syntax OK` dan `TES DOMAIN: 200`. (Peringatan `AH00316 MaxRequestWorkers` boleh diabaikan.)

## 9. Pasang SSL (Let's Encrypt) lewat Webuzo

Login panel user: `https://pathfind.my.id:2003` (user `pathfind`).

1. **SSL → Automatic SSL**: sertifikat Let's Encrypt dibuat otomatis. Cek tab **Logs**: harus ada
   `Certificate saved successfully`.
2. **SSL → Install Certificate**: pilih domain `pathfind.my.id` → **Fetch** (kotak key/cert terisi
   otomatis) → **Install**. ⚠️ Jangan screenshot kotak *Private Key*.

Langkah 2 penting: tanpa itu, sertifikat hanya "tersimpan" tetapi belum dipasang, sehingga Webuzo
belum membuat pintu `*:443` untuk domain ini dan `https://` jatuh ke halaman default Webuzo.

Verifikasi dari VPS:

```bash
grep -n -E "<VirtualHost|ServerName|SSLCertificateFile" /usr/local/apps/apache2/etc/conf.d/webuzoVH.conf
echo | openssl s_client -connect 172.16.0.178:443 -servername pathfind.my.id 2>&1 | grep -E "^ *[0-9] s:|Verify return code"
curl -sk --resolve pathfind.my.id:443:172.16.0.178 https://pathfind.my.id/masuk | grep -o "<title>[^<]*</title>"
```

Yang benar: ada `<VirtualHost *:443>` dengan `ServerName pathfind.my.id`, rantai sertifikat
Let's Encrypt dengan `Verify return code: 0 (ok)`, dan judul `Masuk · PathFinder AI`.

> Catatan: tes ke `127.0.0.1:443` akan menampilkan sertifikat contoh `template-webuzo`. Itu normal,
> karena vhost domain terikat ke IP internal `172.16.0.178`.
>
> Kalau browser di laptop tetap "Not secure" padahal tertulis *Certificate is valid*, biasanya Chrome
> masih mengingat izin "Proceed" sebelumnya. Tes di HP (data seluler) atau buka `chrome://restart`.

---

## 🔄 Update aplikasi (setelah ada perubahan kode)

```bash
cd /var/www/pathfinder && export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && git pull && npm ci && npm run build && pm2 restart pathfinder
```

## 🎤 Sebelum hari lomba

```bash
cd /var/www/pathfinder && npm run seed
```

Data demo (Shan & Bu Putri, kode keluarga `PATH07`) dibuat ulang, dengan riwayat 2 minggu terakhir
dihitung dari hari itu. Setelah lomba, ubah `DEMO_MODE=false` di `.env` lalu `pm2 restart pathfinder`.

## 🔑 Ganti API key Gemini

Hapus key lama di https://aistudio.google.com/apikey, buat yang baru, masukkan dengan perintah
`read -rp "API KEY: " ...` di langkah 4, lalu `pm2 restart pathfinder`.

## 💾 Backup database

```bash
cp /var/www/pathfinder/data/pathfinder.db ~/backup-pathfinder-$(date +%F).db
```

## 🩺 Kalau ada masalah

| Masalah | Solusi |
|---|---|
| `ssh: connect ... port 22: Connection refused` | Pakai port forward: `ssh -p 52400 root@101.50.1.15` |
| `The token '&&' is not a valid statement separator` | Perintah dijalankan di PowerShell laptop, belum SSH ke VPS |
| Login console VNC selalu `Login incorrect` | Paste tidak berfungsi di console. Pakai SSH dan paste dengan klik kanan |
| `pm2 status` → `errored` | `pm2 logs pathfinder` untuk melihat error |
| `https://` menampilkan halaman awan Webuzo | Sertifikat belum di-**Install** (langkah 9.2) |
| `ERR_CONNECTION_CLOSED` di satu perangkat saja | DNS perangkat/router masih menyimpan IP lama. Tunggu atau ganti jaringan |
| Gemini tidak jalan | Cek `GEMINI_API_KEY` di `.env`, lalu `pm2 restart pathfinder`. Aplikasi tetap jalan dengan AI simulasi |
