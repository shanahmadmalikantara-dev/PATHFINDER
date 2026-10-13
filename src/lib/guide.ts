import "server-only";
import { bumpFamily, db, type Checkin } from "./db";
import { getCheckins, getWeekGoals, goalsPercent } from "./data";
import { analyze } from "./insight";
import { geminiEnabled, personalizeGuide } from "./gemini";

// ============================================================================
//  Panduan Tindakan Parenting versi Gemini.
//  Halaman orang tua TIDAK memanggil Gemini; ia hanya membaca hasil yang
//  tersimpan di ai_cache. Panduan dibuat ulang di latar belakang (after())
//  setiap ada check-in baru, lalu versi keluarga dinaikkan agar HP orang tua
//  memuat ulang dan menampilkan hasil terbaru.
// ============================================================================

const key = (childId: number) => `guide:child:${childId}`;

/** Penanda data yang menjadi dasar panduan: check-in terakhir anak. */
export function guideSignature(checkins: Pick<Checkin, "date" | "energy" | "mood">[]): string | null {
  const last = checkins[checkins.length - 1];
  return last ? `${last.date}:${last.energy}:${last.mood ?? ""}` : null;
}

/** Panduan Gemini yang tersimpan untuk check-in terakhir, atau null. */
export function storedGuide(childId: number, sig: string | null): string | null {
  if (!sig) return null;
  const row = db.prepare("SELECT value FROM ai_cache WHERE key = ?").get(key(childId)) as { value: string } | undefined;
  if (!row) return null;
  try {
    const v = JSON.parse(row.value) as { sig: string; text: string };
    return v.sig === sig && v.text ? v.text : null;
  } catch {
    return null;
  }
}

// Mencegah pembuatan ganda dalam satu proses, dan memberi jeda bila Gemini sedang gagal.
const running = new Set<number>();
const failedAt = new Map<number, number>();
const RETRY_MS = 5 * 60_000;

/** Buat ulang panduan Gemini untuk anak ini (dipanggil di latar belakang). */
export async function refreshGuide(childId: number): Promise<void> {
  if (!geminiEnabled() || running.has(childId)) return;
  if (Date.now() - (failedAt.get(childId) ?? 0) < RETRY_MS) return;
  running.add(childId);
  try {
    const child = db
      .prepare("SELECT id, name, family_id FROM users WHERE id = ? AND role = 'child'")
      .get(childId) as { id: number; name: string; family_id: number | null } | undefined;
    if (!child?.family_id) return;
    const checkins = getCheckins(child.id, 14);
    const sig = guideSignature(checkins);
    if (!sig || storedGuide(child.id, sig)) return;

    const goals = getWeekGoals(child.id);
    const gp = goalsPercent(goals);
    // Kapasitas waktu orang tua hanya memengaruhi rencana langkah, bukan fakta panduan.
    const ins = analyze({ childName: child.name, checkins, goals, goalsPercent: gp, capability: "sedikit" });
    const parent = db
      .prepare("SELECT relation FROM users WHERE family_id = ? AND role = 'parent' ORDER BY id LIMIT 1")
      .get(child.family_id) as { relation: string | null } | undefined;

    const text = await personalizeGuide({
      familyId: child.family_id,
      childName: child.name,
      parentRelation: parent?.relation ?? "Orang tua",
      facts: {
        "Situasi utama": ins.focus,
        "Konsistensi check-in 7 hari": `${ins.consistency.percent}% (${ins.consistency.label})`,
        "Tren energi": ins.energy.label,
        "Progres target mingguan": `${ins.goals.percent}% (${ins.goals.label})`,
        "Suasana hati umum": ins.mood.label,
      },
      baseGuide: ins.guide,
    });
    if (!text) {
      failedAt.set(child.id, Date.now());
      return;
    }
    failedAt.delete(child.id);
    db.prepare("INSERT OR REPLACE INTO ai_cache (key, value) VALUES (?, ?)").run(key(child.id), JSON.stringify({ sig, text }));
    bumpFamily(child.family_id); // HP orang tua akan memuat ulang lewat /api/pulse
  } catch (e) {
    failedAt.set(childId, Date.now());
    console.error("[guide]", (e as Error).message);
  } finally {
    running.delete(childId);
  }
}
