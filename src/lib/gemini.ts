import "server-only";
import crypto from "node:crypto";
import { db } from "./db";

// Integrasi Gemini OPSIONAL. Bila GEMINI_API_KEY kosong / error / timeout,
// semua fungsi mengembalikan null dan aplikasi memakai AI simulasi (aturan).
// Jadi demo tetap aman walau internet lambat.

export const geminiEnabled = () => Boolean(process.env.GEMINI_API_KEY);

type Msg = { role: "user" | "model"; text: string };

async function generate(system: string, messages: Msg[], opts: { maxTokens?: number; timeoutMs?: number } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 12000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: opts.maxTokens ?? 400,
          // Matikan "thinking" agar cepat & hemat (didukung model 2.5 Flash)
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (!res.ok) {
      console.error("[gemini]", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch (e) {
    console.error("[gemini]", (e as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

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
    "guide:" +
    crypto.createHash("sha1").update(JSON.stringify([input.familyId, input.facts, input.parentRelation])).digest("hex");
  const cached = db.prepare("SELECT value FROM ai_cache WHERE key = ?").get(cacheKey) as { value: string } | undefined;
  if (cached) return cached.value;

  const system = `Kamu adalah PathFinder AI, asisten pendamping orang tua remaja di Indonesia.
Tugasmu menulis "Panduan Tindakan Parenting" singkat (2–3 kalimat, maks 60 kata) dalam Bahasa Indonesia yang hangat, sopan, dan praktis.
Aturan penting:
- Jangan pernah mendiagnosis kondisi mental atau memberi label.
- Fokus pada SATU tindakan konkret yang bisa dilakukan orang tua hari ini.
- Jangan sarankan orang tua menanyakan nilai/ranking.
- Sapa orang tua sebagai "Anda". Sebut anak dengan namanya.
- Jangan pakai markdown, emoji berlebihan, atau tanda kutip pembuka.`;
  const facts = Object.entries(input.facts)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  const text = await generate(system, [
    {
      role: "user",
      text: `Nama anak: ${input.childName}\nPeran pengguna: ${input.parentRelation}\nRingkasan pola minggu ini (data agregat):\n${facts}\n\nContoh panduan berbasis aturan (boleh kamu perbaiki):\n${input.baseGuide}\n\nTulis panduannya sekarang.`,
    },
  ]);
  if (text) db.prepare("INSERT OR REPLACE INTO ai_cache (key, value) VALUES (?, ?)").run(cacheKey, text);
  return text;
}

/** Kopilot Bicara: latihan menyampaikan sesuatu ke orang tua / menyusun rencana. */
export async function kopilotReply(mode: "bicara" | "rencana", name: string, history: Msg[]) {
  const base = `Kamu adalah "Kopilot PathFinder", teman AI yang suportif untuk remaja Indonesia bernama ${name}.
Gaya bahasa: santai, hangat, seperti kakak yang baik (pakai "kamu", boleh sedikit emoji). Jawaban singkat: maks 120 kata.
Batasan keamanan:
- Kamu BUKAN psikolog/konselor dan tidak mendiagnosis apa pun.
- Jika pengguna menyebut ingin menyakiti diri, merasa tidak aman, atau mengalami kekerasan, dengan lembut sarankan segera bicara dengan orang dewasa yang dipercaya, guru BK, atau layanan darurat (112) / layanan kesehatan jiwa SEJIWA 119 ext 8.
- Jangan mendorong pengguna untuk membohongi atau melawan orang tua.`;
  const system =
    mode === "bicara"
      ? `${base}
Tugasmu: membantu ${name} LATIHAN menyampaikan sesuatu ke orang tuanya. Bantu menyusun kalimat pembuka dengan teknik "pesan-aku" (Aku merasa… saat… karena… aku berharap…), prediksi respon orang tua, dan cara tetap tenang. Akhiri dengan satu pertanyaan untuk melanjutkan latihan.`
      : `${base}
Tugasmu: membantu ${name} menyusun rencana belajar/target yang realistis. Pecah tujuan besar menjadi langkah kecil (15–30 menit), sarankan jeda istirahat, dan tanyakan apa yang paling penting baginya.`;
  return generate(system, history.slice(-12), { maxTokens: 500, timeoutMs: 20000 });
}
