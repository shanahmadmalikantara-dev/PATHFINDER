"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { db, type Talk, type User } from "@/lib/db";
import { TALK_TIMES } from "@/lib/constants";

// ============================================================================
//  Ruang Bicara DUA ARAH
//  Anak maupun orang tua bisa mengajak diskusi; pihak lain membalas.
//  Isi yang dibagikan hanya topik, waktu, dan pesan singkat dari yang mengajak.
// ============================================================================

const refresh = () => revalidatePath("/", "layout");
const ACTIVE = "('menunggu','disepakati','ditunda')";

function childInFamily(me: User, childId: number) {
  return db
    .prepare("SELECT id FROM users WHERE id = ? AND role = 'child' AND family_id = ?")
    .get(childId, me.family_id) as { id: number } | undefined;
}

function familyTalk(me: User, id: number) {
  if (!me.family_id) return undefined;
  return db.prepare("SELECT * FROM talks WHERE id = ? AND family_id = ?").get(id, me.family_id) as Talk | undefined;
}

/** Mengajak diskusi. Anak: untuk dirinya sendiri. Orang tua: wajib menyebut anak yang diajak. */
export async function startTalk(input: { topics: string[]; time: string; note?: string; childId?: number }) {
  const me = await getUser();
  if (!me?.family_id) return { error: "Hubungkan akun dengan keluarga dulu ya." };

  const childId = me.role === "child" ? me.id : Number(input.childId);
  if (me.role === "parent" && !childInFamily(me, childId)) return { error: "Anak tidak ditemukan di keluarga ini." };

  const topics = (input.topics ?? [])
    .map((t) => String(t).trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 3);
  if (!topics.length) return { error: "Pilih minimal 1 topik." };
  const time = TALK_TIMES.includes(input.time) ? input.time : "Kapan saja";
  const note = String(input.note ?? "").trim().slice(0, 140) || null;

  db.transaction(() => {
    // hanya satu ajakan aktif per anak
    db.prepare(`UPDATE talks SET status = 'dibatalkan', updated_at = datetime('now') WHERE child_id = ? AND status IN ${ACTIVE}`).run(childId);
    db.prepare(
      "INSERT INTO talks (family_id, child_id, topics, preferred_time, initiator, initiator_id, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(me.family_id, childId, JSON.stringify(topics), time, me.role, me.id, note);
  })();
  refresh();
  return { ok: true };
}

const RESPONSES = {
  parent: {
    siap: "Saya juga siap berdiskusi.",
    "1jam": "Boleh minta waktu satu jam lagi?",
    besok: "Bagaimana kalau besok?",
    akhirpekan: "Kita ngobrol akhir pekan ya.",
  },
  child: {
    siap: "Aku juga siap ngobrol.",
    "1jam": "Boleh satu jam lagi?",
    besok: "Besok aja ya, boleh?",
    akhirpekan: "Akhir pekan aja ya.",
    butuhwaktu: "Aku butuh waktu dulu, nanti aku kabari ya.",
  },
} as const;

export type ResponseKey = "siap" | "1jam" | "besok" | "akhirpekan" | "butuhwaktu";

/** Membalas ajakan dari pihak lain. */
export async function respondTalk(id: number, key: ResponseKey) {
  const me = await getUser();
  if (!me) return;
  const t = familyTalk(me, id);
  if (!t || !["menunggu", "ditunda", "disepakati"].includes(t.status)) return;
  // yang membalas harus pihak yang DIAJAK, bukan yang mengajak
  if (t.initiator === me.role) return;
  if (me.role === "child" && t.child_id !== me.id) return;
  const options = RESPONSES[me.role] as Record<string, string>;
  const text = options[key];
  if (!text) return;
  db.prepare(
    "UPDATE talks SET status = ?, responder_id = ?, response = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(key === "siap" ? "disepakati" : "ditunda", me.id, text, id);
  refresh();
}

/** Membatalkan ajakan sendiri. */
export async function cancelTalk(id: number) {
  const me = await getUser();
  if (!me) return;
  const t = familyTalk(me, id);
  if (!t || t.initiator !== me.role || t.status === "selesai") return;
  db.prepare("UPDATE talks SET status = 'dibatalkan', updated_at = datetime('now') WHERE id = ?").run(id);
  refresh();
}

/** Kedua pihak boleh menandai diskusi selesai + ringkasan kesepakatan (opsional). */
export async function finishTalk(id: number, outcome: string) {
  const me = await getUser();
  if (!me) return;
  const t = familyTalk(me, id);
  if (!t || t.status === "selesai" || t.status === "dibatalkan") return;
  if (me.role === "child" && t.child_id !== me.id) return;
  db.prepare("UPDATE talks SET status = 'selesai', outcome = ?, updated_at = datetime('now') WHERE id = ?").run(
    String(outcome ?? "").trim().slice(0, 140) || null,
    id,
  );
  refresh();
}
