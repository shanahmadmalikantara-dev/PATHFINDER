// Semua tanggal dihitung dalam zona waktu Indonesia (WIB),
// karena server VPS biasanya memakai zona UTC.
export const TZ = "Asia/Jakarta";

/** Tanggal hari ini dalam format YYYY-MM-DD (WIB). */
export function today(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Tambah/kurangi hari dari sebuah tanggal YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Hari dalam minggu: 0 = Minggu ... 6 = Sabtu */
export function weekday(date: string): number {
  return new Date(date + "T00:00:00Z").getUTCDay();
}

/** Tanggal Senin dari minggu yang memuat `date`. */
export function weekStart(date: string = today()): string {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

/** N tanggal terakhir (paling lama → hari ini). */
export function lastNDays(n: number, end: string = today()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HARI_PANJANG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export const shortDay = (date: string) => HARI[weekday(date)];
export const longDay = (date: string) => HARI_PANJANG[weekday(date)];

/** "12 Jan" */
export function shortDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${BULAN[m - 1]}`;
}

/** "18 – 24 Mar" */
export function weekLabel(monday: string): string {
  return `${shortDate(monday)} – ${shortDate(addDays(monday, 6))}`;
}

/** Salam sesuai jam di WIB. */
export function greeting(): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date()));
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

/** "baru saja", "5 menit lalu", "2 hari lalu" dari timestamp SQLite (UTC). */
export function timeAgo(sqliteUtc: string): string {
  const t = new Date(sqliteUtc.replace(" ", "T") + "Z").getTime();
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return "baru saja";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.round(h / 24);
  return `${d} hari lalu`;
}
