import "server-only";
import crypto from "node:crypto";
import { db } from "./db";

// ============================================================================
//  Integrasi Google Gemini
// ----------------------------------------------------------------------------
//  - API key dari env GEMINI_API_KEY. Kosong / error / timeout -> fungsi
//    mengembalikan null dan aplikasi memakai "AI simulasi" berbasis aturan,
//    sehingga demo tetap aman walau internet buruk.
//  - Model dipilih OTOMATIS: aplikasi menanyakan daftar model yang tersedia
//    untuk API key tersebut, lalu memakai model Flash stabil terbaru
//    (cepat, murah, cukup pintar untuk chat & perencanaan). Bila satu model
//    gagal, otomatis mencoba kandidat berikutnya. GEMINI_MODEL (opsional)
//    memaksa model tertentu sebagai pilihan pertama.
// ============================================================================

const API_BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

export const geminiEnabled = () => Boolean(process.env.GEMINI_API_KEY);

export type Msg = { role: "user" | "model"; text: string };

// ---------------------------------------------------------------- pilih model
let modelCache: { at: number; models: string[] } | null = null;
const blocked = new Map<string, number>(); // model -> sampai kapan dilewati (mis. kena kuota)

const EXCLUDE = /(tts|image|embed|live|audio|native|vision|aqa|learnlm|gemma|robotics|computer-use|exp|thinking|nano|veo|imagen)/i;

function scoreModel(id: string) {
  const v = Number(id.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const preview = /preview/i.test(id) ? 1 : 0;
  // Flash = seimbang (utama), Pro = lebih pintar tapi lebih lambat, Lite = cadangan hemat
  const tier = /flash-lite/i.test(id) ? 1 : /flash/i.test(id) ? 3 : /pro/i.test(id) ? 2 : 0;
  return { v, preview, tier };
}

async function listModels(key: string): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < 6 * 3600_000) return modelCache.models;
  try {
    const res = await fetch(`${API_BASE}/models?pageSize=200`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`list ${res.status}`);
    const data = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const ids = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      // tanpa varian khusus (tts, gambar, dll.) dan tanpa versi "terkunci" seperti -001
      .filter((id) => /^gemini-\d/.test(id) && !EXCLUDE.test(id) && !/-\d{3}$/.test(id))
      .sort((a, b) => {
        const A = scoreModel(a);
        const B = scoreModel(b);
        return A.preview - B.preview || B.tier - A.tier || B.v - A.v || a.length - b.length;
      });
    const models = ids.length ? ids : FALLBACK_MODELS;
    modelCache = { at: Date.now(), models };
    console.log("[gemini] model tersedia (urutan pakai):", models.slice(0, 5).join(", "));
    return models;
  } catch (e) {
    console.error("[gemini] gagal membaca daftar model:", (e as Error).message);
    return FALLBACK_MODELS;
  }
}

async function candidates(key: string) {
  const forced = process.env.GEMINI_MODEL?.trim();
  const auto = await listModels(key);
  const all = [...new Set([forced, ...auto].filter(Boolean) as string[])];
  const now = Date.now();
  return all.filter((m) => (blocked.get(m) ?? 0) < now).slice(0, 3);
}

/** Pengaturan "thinking" yang aman per generasi model (cepat untuk chat). */
function thinkingFor(model: string) {
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-2\.5-pro/.test(model)) return { thinkingBudget: 128 };
  if (/^gemini-[3-9]/.test(model)) return { thinkingLevel: "low" };
  return undefined;
}

// ------------------------------------------------------------------ generate
export async function generate(opts: {
  system: string;
  messages: Msg[];
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}): Promise<{ text: string; model: string } | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  // Gemini mewajibkan percakapan diawali pesan pengguna
  const msgs = opts.messages.slice();
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length) return null;

  const deadline = Date.now() + (opts.timeoutMs ?? 25000);
  for (const model of await candidates(key)) {
    let thinking = thinkingFor(model);
    for (let attempt = 0; attempt < 2; attempt++) {
      const left = deadline - Date.now();
      if (left < 1500) return null;
      try {
        const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
          method: "POST",
          signal: AbortSignal.timeout(left),
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: opts.system }] },
            contents: msgs.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
            generationConfig: {
              temperature: opts.temperature ?? 0.7,
              maxOutputTokens: opts.maxTokens ?? 1024,
              ...(opts.json ? { responseMimeType: "application/json" } : {}),
              ...(thinking ? { thinkingConfig: thinking } : {}),
            },
          }),
        });
        if (!res.ok) {
          const body = (await res.text()).slice(0, 400);
          console.error(`[gemini] ${model} -> ${res.status}: ${body}`);
          // Pengaturan thinking tidak didukung -> ulangi tanpa itu
          if (res.status === 400 && thinking && /thinking/i.test(body)) {
            thinking = undefined;
            continue;
          }
          if (res.status === 401 || res.status === 403) return null; // API key salah: berhenti
          if (res.status === 429) blocked.set(model, Date.now() + 60_000); // kuota: istirahatkan 1 menit
          break; // coba model berikutnya
        }
        const data = await res.json();
        const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
        const text = parts.filter((p) => !p.thought).map((p) => p.text ?? "").join("").trim();
        if (!text) {
          console.error(`[gemini] ${model} -> jawaban kosong (${data?.candidates?.[0]?.finishReason ?? "?"})`);
          break;
        }
        return { text, model };
      } catch (e) {
        console.error(`[gemini] ${model} -> ${(e as Error).message}`);
        break;
      }
    }
  }
  return null;
}

/** Ambil objek JSON dari jawaban model (toleran terhadap ```json ... ```). */
export function parseJson<T>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

// ------------------------------------------------------- Panduan Parenting
/**
 * Menulis ulang Panduan Tindakan Parenting dengan bahasa yang lebih personal.
 * PRIVACY FILTER: yang dikirim ke AI hanya ringkasan angka & label umum,
 * BUKAN jurnal atau tulisan anak (yang memang tidak pernah ada di server).
 */
export async function personalizeGuide(input: {
  familyId: number;
  childName: string;
  parentRelation: string;
  facts: Record<string, string | number>;
  baseGuide: string;
}): Promise<string | null> {
  if (!geminiEnabled()) return null;
  const cacheKey =
    "guide2:" +
    crypto.createHash("sha1").update(JSON.stringify([input.familyId, input.facts, input.parentRelation])).digest("hex");
  const cached = db.prepare("SELECT value FROM ai_cache WHERE key = ?").get(cacheKey) as { value: string } | undefined;
  if (cached) return cached.value;

  const system = `Kamu adalah PathFinder AI, pendamping orang tua remaja di Indonesia.
Tulis "Panduan Tindakan Parenting": 2–3 kalimat, maksimal 60 kata, Bahasa Indonesia yang hangat, sopan, dan praktis.
Aturan:
- Jangan mendiagnosis kondisi mental atau memberi label pada anak.
- Fokus pada SATU tindakan konkret yang bisa dilakukan orang tua hari ini.
- Jangan sarankan menanyakan nilai atau ranking.
- Sapa orang tua dengan "Anda", sebut anak dengan namanya.
- Teks polos: tanpa markdown, tanpa emoji, tanpa tanda kutip pembuka.`;
  const facts = Object.entries(input.facts).map(([k, v]) => `- ${k}: ${v}`).join("\n");
  const out = await generate({
    system,
    messages: [
      {
        role: "user",
        text: `Nama anak: ${input.childName}\nPengguna: ${input.parentRelation}\nRingkasan pola minggu ini (data agregat):\n${facts}\n\nDraf panduan berbasis aturan (boleh diperbaiki):\n${input.baseGuide}\n\nTulis panduannya sekarang.`,
      },
    ],
    maxTokens: 400,
    temperature: 0.6,
    timeoutMs: 12000,
  });
  const text = out?.text.replace(/^["“]|["”]$/g, "").trim();
  if (text) db.prepare("INSERT OR REPLACE INTO ai_cache (key, value) VALUES (?, ?)").run(cacheKey, text);
  return text || null;
}

// ------------------------------------------------------------------- Kopilot
const KOPILOT_RULES = `Gaya bahasa:
- Santai dan hangat seperti kakak kelas yang peduli. Pakai "kamu". Bahasa Indonesia sehari-hari yang sopan.
- Singkat: maksimal 150 kata. Paragraf pendek (1–3 kalimat).
- Boleh memakai format sederhana: **tebal** untuk kata kunci, daftar "- " atau "1. " untuk langkah. Jangan memakai judul (#), tabel, atau tautan.
- Maksimal satu emoji, hanya bila benar-benar pas.
- Selalu akhiri dengan SATU pertanyaan lanjutan yang spesifik agar percakapan terus berjalan.
- Ingat isi percakapan sebelumnya; jangan mengulang sapaan atau penjelasan yang sama.

Batasan keamanan:
- Kamu BUKAN psikolog/konselor dan tidak mendiagnosis apa pun.
- Jika pengguna menyebut ingin menyakiti diri, merasa tidak aman, atau mengalami kekerasan: tanggapi dengan empati, sarankan segera bicara dengan orang dewasa tepercaya atau guru BK, dan sebutkan layanan darurat 112 serta layanan kesehatan jiwa SEJIWA 119 ext 8.
- Jangan mendorong pengguna berbohong pada atau melawan orang tua.
- Jangan mengarang fakta (nama lomba, tanggal, biaya). Bila tidak yakin, katakan perlu dicek di situs resmi.`;

export async function kopilotReply(
  mode: "bicara" | "rencana",
  profile: { name: string; grade: string | null; context: string },
  history: Msg[],
) {
  const who = `Kamu adalah "Kopilot PathFinder", teman AI untuk remaja Indonesia bernama ${profile.name}${profile.grade ? ` (${profile.grade})` : ""}.`;
  const task =
    mode === "bicara"
      ? `Tugas: membantu ${profile.name} LATIHAN menyampaikan sesuatu kepada orang tuanya.
Alur yang kamu ikuti:
1. Pahami dulu topik dan perasaannya (tanyakan bila belum jelas).
2. Bantu menyusun kalimat pembuka dengan teknik "pesan-aku": "Aku merasa … saat … karena … Aku berharap …".
3. Perkirakan kemungkinan respons orang tua dan cara menanggapinya dengan tenang.
4. Sarankan waktu dan suasana yang pas, lalu ajak ia mengirim sinyal lewat fitur "Ruang Bicara" bila sudah siap.`
      : `Tugas: membantu ${profile.name} menyusun rencana belajar dan target masa depan yang realistis.
Alur yang kamu ikuti:
1. Pahami tujuan, waktu luang, dan kendalanya.
2. Pecah tujuan besar menjadi langkah kecil yang spesifik (15–45 menit per sesi) dengan urutan prioritas.
3. Sarankan ritme belajar yang sehat (ada jeda istirahat) dan cara mengukur kemajuan.
4. Bila cocok, sarankan ia memakai fitur "Rancang dengan AI" di Roadmap untuk membuat milestone otomatis.`;
  const system = `${who}\n\n${task}\n\nData ${profile.name} di PathFinder (pakai sebagai konteks, jangan dibacakan ulang):\n${profile.context || "-"}\n\n${KOPILOT_RULES}`;
  return generate({ system, messages: history.slice(-16), maxTokens: 900, temperature: 0.7, timeoutMs: 25000 });
}
