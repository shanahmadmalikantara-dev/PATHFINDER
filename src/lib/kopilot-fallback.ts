// Kopilot versi "AI simulasi" — dipakai bila Gemini belum diatur / gagal.
// Memberi kerangka kalimat "pesan-aku" (I-message) yang terbukti membantu
// komunikasi tanpa menyalahkan.

const CRISIS = /(bunuh diri|mengakhiri hidup|menyakiti diri|self.?harm|ingin mati|pengen mati|dipukul|kekerasan)/i;

export function fallbackReply(mode: "bicara" | "rencana", message: string, turn: number): string {
  if (CRISIS.test(message)) {
    return "Terima kasih sudah mau cerita, itu butuh keberanian 🤍 Yang kamu rasakan itu penting dan kamu nggak harus menghadapinya sendirian. Tolong segera bicara dengan orang dewasa yang kamu percaya atau guru BK. Kalau kamu merasa tidak aman sekarang, hubungi 112 atau layanan SEJIWA di 119 ext 8.";
  }
  const m = message.toLowerCase();
  if (mode === "rencana") {
    if (turn === 0)
      return "Oke, kita susun bareng ya! 🗺️ Coba ceritain: target apa yang paling pengen kamu capai bulan ini? (misal: nilai matematika naik, selesai 1 proyek coding, latihan UTBK)";
    if (turn === 1)
      return `Mantap! Biar nggak kewalahan, kita pecah jadi langkah kecil:\n\n1. Tentukan 1 hal spesifik minggu ini (contoh: 2 bab materi)\n2. Kerjakan 25 menit, istirahat 5 menit (teknik Pomodoro)\n3. Cek progres tiap Jumat malam\n\nKira-kira kamu punya waktu kosong di jam berapa aja setiap harinya?`;
    return "Sip! Saran aku: masukkan langkah-langkah tadi ke menu Check-In sebagai Target Minggu Ini, terus tandai setiap kali selesai. Jangan lupa sisakan 1 hari buat istirahat ya 😊 Ada bagian lain yang mau kita rencanakan?";
  }
  // mode bicara
  if (turn === 0) {
    const topic = m.includes("uang") ? "uang saku" : m.includes("kuliah") || m.includes("jurusan") ? "rencana kuliah" : m.includes("jadwal") || m.includes("capek") ? "jadwal & istirahat" : "hal ini";
    return `Aku ngerti, ngomongin ${topic} ke orang tua emang bisa bikin deg-degan 😅 Coba pakai rumus "pesan-aku" ini:\n\n“Ma/Pa, aku merasa ___ waktu ___, karena ___. Aku berharap kita bisa ___.”\n\nCoba isi titik-titiknya versi kamu, nanti aku bantu rapikan!`;
  }
  if (turn === 1)
    return "Kalimatmu udah bagus! 👍 Tips biar makin lancar:\n\n• Pilih waktu yang santai (bukan saat orang tua baru pulang kerja)\n• Mulai dengan terima kasih atau hal positif dulu\n• Kalau orang tua langsung menolak, tarik napas, lalu bilang: “Boleh aku jelasin alasanku dulu?”\n\nMenurutmu, orang tuamu kira-kira akan jawab apa?";
  return "Respon seperti itu wajar kok. Ingat, tujuannya bukan menang debat, tapi saling paham 🤝 Kamu bisa bilang: “Aku ngerti Mama/Papa khawatir. Gimana kalau kita coba cara ini dulu selama 2 minggu?” Kalau sudah siap, kirim sinyal lewat tombol “Saya Siap Berdiskusi” ya!";
}
