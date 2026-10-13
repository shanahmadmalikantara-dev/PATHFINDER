// Konfigurasi PM2 untuk menjalankan PathFinder AI di VPS.
// Jalankan: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "pathfinder",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1, // SQLite: cukup 1 proses
      autorestart: true,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        // Thread pool libuv (fs, crypto async, dns, zlib). Bawaan 4; dinaikkan ke 8.
        // Catatan: hanya terbaca saat proses dimulai, jadi setelah mengubahnya jalankan
        // "pm2 delete pathfinder && pm2 start ecosystem.config.cjs && pm2 save".
        UV_THREADPOOL_SIZE: "8",
      },
    },
  ],
};
