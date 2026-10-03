"use server";

import { revalidatePath } from "next/cache";
import { getUser, requireRole } from "@/lib/auth";
import { db, type Talk } from "@/lib/db";
import { CAPABILITIES } from "@/lib/constants";

const refresh = () => revalidatePath("/", "layout");

export async function setCapability(cap: string) {
  const me = await requireRole("parent");
  if (!CAPABILITIES.some((c) => c.value === cap)) return;
  db.prepare("UPDATE users SET capability = ? WHERE id = ?").run(cap, me.id);
  refresh();
}

function familyTalk(familyId: number | null, id: number) {
  if (!familyId) return undefined;
  return db.prepare("SELECT * FROM talks WHERE id = ? AND family_id = ?").get(id, familyId) as Talk | undefined;
}

const RESPONSES: Record<string, string> = {
  siap: "Saya juga siap berdiskusi 🤝",
  "1jam": "Boleh minta waktu 1 jam lagi? ⏰",
  besok: "Bagaimana kalau besok? 🗓️",
  akhirpekan: "Kita ngobrol akhir pekan ya 🌤️",
};

export async function respondTalk(id: number, response: keyof typeof RESPONSES) {
  const me = await requireRole("parent");
  const t = familyTalk(me.family_id, id);
  if (!t || !["menunggu", "ditunda", "disepakati"].includes(t.status) || !RESPONSES[response]) return;
  const status = response === "siap" ? "disepakati" : "ditunda";
  db.prepare("UPDATE talks SET status = ?, parent_id = ?, parent_response = ?, updated_at = datetime('now') WHERE id = ?").run(
    status, me.id, RESPONSES[response], id,
  );
  refresh();
}

/** Anak atau orang tua sama-sama boleh menandai diskusi selesai (+ ringkasan hasil bersama). */
export async function finishTalk(id: number, outcome: string) {
  const me = await getUser();
  if (!me) return;
  const t = familyTalk(me.family_id, id);
  if (!t || t.status === "selesai" || t.status === "dibatalkan") return;
  db.prepare("UPDATE talks SET status = 'selesai', outcome = ?, updated_at = datetime('now') WHERE id = ?").run(
    outcome.trim().slice(0, 120) || null, id,
  );
  refresh();
}
