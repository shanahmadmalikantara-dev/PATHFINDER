// ============================================================================
//  Ukur kinerja PathFinder AI (tanpa install apa pun, cukup Node 20+).
//
//  Jalankan di folder aplikasi (di VPS), SETELAH npm run build & aplikasi jalan:
//    npm run ukur                         # tahap bawaan: 25 → 50 → 100 pengguna
//    npm run ukur -- --tahap=50,100,200,300 --detik=20
//
//  Opsi:
//    --base=URL        alamat yang diuji (bawaan https://pathfind.my.id;
//                      kalau tidak bisa dijangkau dari VPS, otomatis pakai http://127.0.0.1:3000)
//    --tahap=a,b,c     jumlah pengguna bersamaan per tahap (bawaan 25,50,100)
//    --detik=N         lama tiap tahap dalam detik (bawaan 20)
//    --anak=email --ortu=email --sandi=xxx   akun uji (bawaan akun demo dari npm run seed)
//
//  Tiap "pengguna virtual": login sekali, lalu berulang membuka beranda
//  (remaja atau orang tua, bergantian) dan mengecek sinkronisasi sinyal (/api/pulse).
//  Sesi login yang dibuat untuk tes dihapus lagi (logout) di akhir.
//  Jalankan saat aplikasi TIDAK sedang dipakai presentasi: tes ini sengaja membebani server.
// ============================================================================
import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import Database from "better-sqlite3";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=") || "true"];
  }),
);
const STAGES = (args.tahap || "25,50,100").split(",").map(Number).filter((n) => n > 0);
const SECONDS = Number(args.detik || 20);
const ACCOUNTS = {
  child: { email: args.anak || "shan@demo.id", password: args.sandi || "pathfinder" },
  parent: { email: args.ortu || "putri@demo.id", password: args.sandi || "pathfinder" },
};

// ---------------------------------------------------- ID server action dari build
const manifestFile = ".next/server/server-reference-manifest.json";
if (!fs.existsSync(manifestFile)) {
  console.error("Belum ada hasil build. Jalankan dari folder aplikasi setelah npm run build.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8")).node;
const actionId = (name) =>
  Object.entries(manifest).find(([, v]) => v.exportedName === name && /actions\/auth/.test(v.filename ?? ""))?.[0];
const LOGIN_ID = actionId("login");
const LOGOUT_ID = actionId("logout");
if (!LOGIN_ID) {
  console.error("Tidak menemukan aksi login di hasil build.");
  process.exit(1);
}

// ----------------------------------------------------------------- alamat uji
async function reachable(url) {
  try {
    const r = await fetch(url + "/masuk", { signal: AbortSignal.timeout(5000) });
    return r.ok;
  } catch {
    return false;
  }
}
let BASE = (args.base || "https://pathfind.my.id").replace(/\/$/, "");
if (!(await reachable(BASE))) {
  const local = "http://127.0.0.1:3000";
  console.log(`(${BASE} tidak terjangkau dari mesin ini, pakai ${local})`);
  BASE = local;
  if (!(await reachable(BASE))) {
    console.error("Aplikasi tidak bisa dihubungi. Pastikan pm2 status = online.");
    process.exit(1);
  }
}

// ------------------------------------------------------------------- helper
const stats = {}; // aksi -> { ms: [], err: 0 }
const rec = (name, ms, ok) => {
  const s = (stats[name] ??= { ms: [], err: 0 });
  if (ok) s.ms.push(ms);
  else s.err++;
};
const pct = (arr, p) => {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};

async function timed(name, fn) {
  const t = performance.now();
  try {
    const ok = await fn();
    rec(name, performance.now() - t, ok);
    return ok;
  } catch {
    rec(name, performance.now() - t, false);
    return false;
  }
}

/** Login lewat server action yang sama dengan form di halaman Masuk. Mengembalikan cookie sesi. */
async function login(role) {
  const { email, password } = ACCOUNTS[role];
  let cookie = null;
  await timed("Masuk (login)", async () => {
    const body = new FormData();
    // Format yang sama dengan browser: isi form dulu, argumen ("0") paling akhir.
    body.append("_1_email", email);
    body.append("_1_password", password);
    body.append("0", '["$undefined","$K1"]'); // argumen: (prevState, formData)
    const r = await fetch(BASE + "/masuk", {
      method: "POST",
      headers: { "Next-Action": LOGIN_ID, Accept: "text/x-component" },
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
    });
    await r.arrayBuffer();
    const set = r.headers.getSetCookie?.() ?? [];
    cookie = set.map((c) => c.split(";")[0]).find((c) => c.startsWith("pf_session=")) ?? null;
    return !!cookie;
  });
  return cookie;
}

async function get(name, path, cookie, expect) {
  return timed(name, async () => {
    const r = await fetch(BASE + path, { headers: { cookie }, redirect: "manual", signal: AbortSignal.timeout(30000) });
    const text = await r.text();
    return r.status === 200 && (!expect || text.includes(expect));
  });
}

async function logout(cookie) {
  if (!LOGOUT_ID || !cookie) return;
  const body = new FormData();
  body.append("0", "[]");
  await fetch(BASE + "/masuk", { method: "POST", headers: { "Next-Action": LOGOUT_ID, cookie, Accept: "text/x-component" }, body, redirect: "manual" })
    .then((r) => r.arrayBuffer())
    .catch(() => {});
}

// --------------------------------------------------------------------- tes
async function virtualUser(i, until) {
  const role = i % 2 === 0 ? "child" : "parent";
  const cookie = await login(role);
  if (!cookie) return null;
  while (Date.now() < until) {
    if (role === "child") await get("Beranda Remaja", "/anak", cookie, "Check-In");
    else await get("Beranda Orang Tua", "/ortu", cookie, "Panduan Tindakan Parenting");
    await get("Sinkronisasi sinyal", "/api/pulse", cookie, '"v"');
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 700)); // jeda manusiawi
  }
  return cookie;
}

const ACTIONS = ["Masuk (login)", "Beranda Remaja", "Beranda Orang Tua", "Sinkronisasi sinyal"];
const fmt = (n) => (Number.isFinite(n) ? `${Math.round(n)} ms` : "-");

console.log(`\nMenguji ${BASE}  |  tahap: ${STAGES.join(" → ")} pengguna  |  ${SECONDS} detik/tahap\n`);
const summary = [];
for (const users of STAGES) {
  for (const k of Object.keys(stats)) delete stats[k];
  const until = Date.now() + SECONDS * 1000;
  const cookies = await Promise.all(Array.from({ length: users }, (_, i) => virtualUser(i, until)));
  await Promise.all(cookies.map(logout));

  const total = ACTIONS.reduce((a, n) => a + (stats[n]?.ms.length ?? 0) + (stats[n]?.err ?? 0), 0);
  const errors = ACTIONS.reduce((a, n) => a + (stats[n]?.err ?? 0), 0);
  const errPct = total ? (errors / total) * 100 : 0;
  summary.push({ users, errPct, total });
  console.log(`== ${users} pengguna bersamaan: ${total} permintaan, error ${errPct.toFixed(2)}%`);
  console.log("   AKSI".padEnd(26) + "P50".padStart(10) + "P95".padStart(10));
  for (const n of ACTIONS) {
    const s = stats[n] ?? { ms: [], err: 0 };
    console.log(`   ${n.padEnd(23)}${fmt(pct(s.ms, 50)).padStart(10)}${fmt(pct(s.ms, 95)).padStart(10)}${s.err ? `   (${s.err} gagal)` : ""}`);
  }
  console.log("");
  if (errPct > 5) {
    console.log("Error di atas 5%, tahap berikutnya dibatalkan agar server tidak kewalahan.\n");
    break;
  }
}

const passed = summary.filter((s) => s.errPct === 0).at(-1);
console.log(passed ? `TERUJI: ${passed.users} pengguna bersamaan tanpa error.` : "Belum ada tahap yang 0% error.");

// --------------------------------------------- info tambahan untuk slide
try {
  const list = JSON.parse(execSync("pm2 jlist", { stdio: ["ignore", "pipe", "ignore"] }).toString());
  const app = list.find((a) => a.name === "pathfinder");
  if (app) {
    const up = (Date.now() - app.pm2_env.pm_uptime) / 3600000;
    console.log(`PM2: status ${app.pm2_env.status}, hidup ${up.toFixed(1)} jam sejak restart terakhir, restart ${app.pm2_env.restart_time} kali.`);
  }
} catch {}
try {
  const log = `${process.env.HOME}/.pm2/logs/pathfinder-out.log`;
  const line = fs.readFileSync(log, "utf8").split("\n").filter((l) => l.includes("model tersedia")).at(-1);
  if (line) console.log("Model Gemini yang dipakai:", line.split(":").slice(1).join(":").trim().split(",")[0]);
} catch {}
try {
  // Tanggal akun pertama dibuat = sejak kapan aplikasi dipakai (dibaca saja, tidak mengubah apa pun)
  const env = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
  const dbFile = path.resolve(env.match(/^DATABASE_PATH=(.+)$/m)?.[1]?.trim() || "./data/pathfinder.db");
  const db = new Database(dbFile, { readonly: true, fileMustExist: true });
  const r = db.prepare("SELECT MIN(created_at) first, COUNT(*) n FROM users WHERE email NOT LIKE '%@demo.id'").get();
  if (r?.first) console.log(`Akun pertama terdaftar: ${r.first} UTC (${r.n} akun non-demo).`);
  db.close();
} catch {}
