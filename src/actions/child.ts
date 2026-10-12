"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, type Goal, type Milestone } from "@/lib/db";
import { today, weekStart } from "@/lib/dates";
import { ENERGY, GOAL_CATEGORIES, MOODS } from "@/lib/constants";
import { kopilotReply } from "@/lib/gemini";
import { fallbackReply } from "@/lib/kopilot-fallback";
import type { FormState } from "./auth";

const refresh = () => revalidatePath("/", "layout");

// ---------------- Check-in harian ----------------
export async function saveCheckin(energy: number, mood?: string | null) {
  const me = await requireRole("child");
  if (!ENERGY.some((e) => e.value === energy)) return;
  const m = mood && MOODS.some((x) => x.value === mood) ? mood : null;
  db.prepare(
    `INSERT INTO checkins (child_id, date, energy, mood) VALUES (?, ?, ?, ?)
     ON CONFLICT(child_id, date) DO UPDATE SET energy = excluded.energy,
       mood = COALESCE(excluded.mood, checkins.mood)`,
  ).run(me.id, today(), energy, m);
  refresh();
}

// ---------------- Target mingguan ----------------
function ownGoal(childId: number, id: number) {
  return db.prepare("SELECT * FROM goals WHERE id = ? AND child_id = ?").get(id, childId) as Goal | undefined;
}

export async function addGoal(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireRole("child");
  const title = String(form.get("title") ?? "").trim().slice(0, 60);
  const detail = String(form.get("detail") ?? "").trim().slice(0, 80) || null;
  const category = String(form.get("category") ?? "belajar");
  const target = Math.min(99, Math.max(1, Number(form.get("target")) || 1));
  const unit = String(form.get("unit") ?? "kali").trim().slice(0, 12) || "kali";
  if (title.length < 2) return { error: "Tulis nama targetnya dulu ya." };
  if (!GOAL_CATEGORIES.some((c) => c.value === category)) return { error: "Kategori tidak valid." };
  const count = (db.prepare("SELECT COUNT(*) n FROM goals WHERE child_id = ? AND week = ?").get(me.id, weekStart()) as { n: number }).n;
  if (count >= 6) return { error: "Maksimal 6 target per minggu — fokus itu kunci." };
  db.prepare("INSERT INTO goals (child_id, week, title, detail, category, target, unit) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    me.id, weekStart(), title, detail, category, target, unit,
  );
  refresh();
  return { ok: "Target ditambahkan!" };
}

export async function changeGoal(id: number, field: "progress" | "target", delta: number) {
  const me = await requireRole("child");
  const g = ownGoal(me.id, id);
  if (!g) return;
  if (field === "progress") {
    const v = Math.min(g.target, Math.max(0, g.progress + Math.sign(delta)));
    db.prepare("UPDATE goals SET progress = ? WHERE id = ?").run(v, id);
  } else {
    const v = Math.min(99, Math.max(1, g.target + Math.sign(delta)));
    db.prepare("UPDATE goals SET target = ?, progress = MIN(progress, ?) WHERE id = ?").run(v, v, id);
  }
  refresh();
}

export async function deleteGoal(id: number) {
  const me = await requireRole("child");
  db.prepare("DELETE FROM goals WHERE id = ? AND child_id = ?").run(id, me.id);
  refresh();
}

// ---------------- Roadmap ----------------
function ownMilestone(childId: number, id: number) {
  return db.prepare("SELECT * FROM milestones WHERE id = ? AND child_id = ?").get(id, childId) as Milestone | undefined;
}

export async function addMilestone(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireRole("child");
  const title = String(form.get("title") ?? "").trim().slice(0, 80);
  const description = String(form.get("description") ?? "").trim().slice(0, 240) || null;
  const horizon = form.get("horizon") === "jangka_panjang" ? "jangka_panjang" : "tahun_ini";
  const target_date = String(form.get("target_date") ?? "").trim().slice(0, 40) || null;
  const shared = form.get("shared") ? 1 : 0;
  if (title.length < 3) return { error: "Judul milestone minimal 3 huruf." };
  const pos = (db.prepare("SELECT COALESCE(MAX(position), 0) + 1 p FROM milestones WHERE child_id = ?").get(me.id) as { p: number }).p;
  db.prepare(
    "INSERT INTO milestones (child_id, title, description, horizon, target_date, shared, xp, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(me.id, title, description, horizon, target_date, shared, horizon === "jangka_panjang" ? 300 : 100, pos);
  refresh();
  return { ok: "Milestone baru ditambahkan." };
}

export async function setMilestoneStatus(id: number, status: Milestone["status"]) {
  const me = await requireRole("child");
  if (!["rencana", "berjalan", "selesai"].includes(status) || !ownMilestone(me.id, id)) return;
  db.prepare("UPDATE milestones SET status = ?, done_at = CASE WHEN ? = 'selesai' THEN ? ELSE NULL END WHERE id = ?").run(
    status, status, today(), id,
  );
  refresh();
}

export async function toggleMilestoneShared(id: number) {
  const me = await requireRole("child");
  if (!ownMilestone(me.id, id)) return;
  db.prepare("UPDATE milestones SET shared = 1 - shared WHERE id = ?").run(id);
  refresh();
}

export async function deleteMilestone(id: number) {
  const me = await requireRole("child");
  db.prepare("DELETE FROM milestones WHERE id = ? AND child_id = ?").run(id, me.id);
  refresh();
}

// ---------------- Kopilot AI ----------------
/** Ringkasan data anak sendiri sebagai konteks Kopilot (tanpa jurnal — jurnal tidak ada di server). */
function kopilotContext(childId: number, mode: "bicara" | "rencana") {
  const lines: string[] = [];
  const ck = db.prepare("SELECT energy, mood FROM checkins WHERE child_id = ? ORDER BY date DESC LIMIT 1").get(childId) as
    | { energy: number; mood: string | null }
    | undefined;
  if (ck) lines.push(`Check-in terakhir: energi ${ck.energy}/5${ck.mood ? `, mood ${ck.mood}` : ""}`);
  const goals = db.prepare("SELECT title, target, unit, progress FROM goals WHERE child_id = ? AND week = ?").all(childId, weekStart()) as Goal[];
  if (goals.length) lines.push("Target minggu ini: " + goals.map((g) => `${g.title} (${g.progress}/${g.target} ${g.unit})`).join("; "));
  if (mode === "rencana") {
    const ms = db.prepare("SELECT title, status, period FROM milestones WHERE child_id = ? ORDER BY position LIMIT 12").all(childId) as Milestone[];
    if (ms.length) lines.push("Roadmap: " + ms.map((m) => `${m.title} [${m.status}${m.period ? `, ${m.period}` : ""}]`).join("; "));
  } else {
    const t = db.prepare("SELECT topics, initiator, status FROM talks WHERE child_id = ? AND status IN ('menunggu','disepakati','ditunda') ORDER BY id DESC LIMIT 1").get(childId) as
      | { topics: string; initiator: string; status: string }
      | undefined;
    if (t) lines.push(`Diskusi aktif (${t.initiator === "parent" ? "diajak orang tua" : "diajak sendiri"}, status ${t.status}): ${JSON.parse(t.topics).join(", ")}`);
  }
  return lines.join("\n");
}

export async function askKopilot(mode: "bicara" | "rencana", history: { role: "user" | "model"; text: string }[]) {
  const me = await requireRole("child");
  const m = mode === "rencana" ? "rencana" : "bicara";
  const msgs = (Array.isArray(history) ? history : [])
    .filter((h) => (h?.role === "user" || h?.role === "model") && typeof h.text === "string" && h.text.trim())
    .map((h) => ({ role: h.role, text: h.text.slice(0, 2000) }))
    .slice(-16);
  const userMsgs = msgs.filter((x) => x.role === "user");
  const last = userMsgs.at(-1)?.text ?? "";
  try {
    const ai = await kopilotReply(m, { name: me.name, grade: me.grade, context: kopilotContext(me.id, m) }, msgs);
    if (ai) return { text: ai.text, source: "gemini" as const };
  } catch (e) {
    console.error("[kopilot]", (e as Error).message);
  }
  return { text: fallbackReply(m, last, userMsgs.length - 1), source: "simulasi" as const };
}
