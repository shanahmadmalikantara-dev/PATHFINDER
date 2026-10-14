import "server-only";
import { db } from "./db";
import { today } from "./dates";

// ============================================================================
//  Batas harian pemakaian Gemini per akun.
//  Kalau batas tercapai, fitur tidak error: pemanggil memakai mesin rule-based.
//  Ubah lewat .env:  AI_LIMIT_CHAT, AI_LIMIT_PLAN, AI_LIMIT_GUIDE
//  Akun tanpa batas (mis. akun yang dipakai juri):  AI_UNLIMITED_EMAILS=a@x.com,b@y.com
// ============================================================================

export type AiKind = "chat" | "plan" | "guide";

const DEFAULTS: Record<AiKind, number> = { chat: 20, plan: 5, guide: 10 };

function limitFor(kind: AiKind): number {
  const v = Number(process.env[`AI_LIMIT_${kind.toUpperCase()}`]);
  return Number.isFinite(v) && v >= 0 ? v : DEFAULTS[kind];
}

function unlimited(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.AI_UNLIMITED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * Pakai satu jatah AI hari ini. true = boleh memanggil Gemini.
 * Penambahan dilakukan secara atomik, jadi permintaan bersamaan tidak bisa melewati batas.
 */
export function takeAiQuota(user: { id: number; email?: string | null }, kind: AiKind): boolean {
  if (unlimited(user.email)) return true;
  const limit = limitFor(kind);
  if (limit <= 0) return false;
  const day = today();
  return db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO ai_usage (user_id, day, kind, count) VALUES (?, ?, ?, 0)").run(user.id, day, kind);
    const r = db
      .prepare("UPDATE ai_usage SET count = count + 1 WHERE user_id = ? AND day = ? AND kind = ? AND count < ?")
      .run(user.id, day, kind, limit);
    return r.changes === 1;
  })();
}

/** Kembalikan jatah bila Gemini ternyata tidak memberi jawaban (gagal/429), supaya tidak terbuang. */
export function refundAiQuota(user: { id: number }, kind: AiKind) {
  db.prepare("UPDATE ai_usage SET count = MAX(0, count - 1) WHERE user_id = ? AND day = ? AND kind = ?").run(user.id, today(), kind);
}
