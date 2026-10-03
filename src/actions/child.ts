"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, type Goal, type Milestone } from "@/lib/db";
import { today, weekStart } from "@/lib/dates";
import { ENERGY, GOAL_CATEGORIES, MOODS, TALK_TIMES } from "@/lib/constants";
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
  if (count >= 6) return { error: "Maksimal 6 target per minggu — fokus itu kunci! 🎯" };
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
  return { ok: "Milestone baru ditambahkan! 🗺️" };
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

// ---------------- Ruang Bicara ----------------
export async function sendTalkSignal(topics: string[], time: string) {
  const me = await requireRole("child");
  if (!me.family_id) return { error: "Hubungkan akun dengan keluarga dulu ya." };
  const clean = topics.map((t) => String(t).trim().slice(0, 40)).filter(Boolean).slice(0, 3);
  if (!clean.length) return { error: "Pilih minimal 1 topik." };
  const pt = TALK_TIMES.includes(time) ? time : "Kapan saja";
  // Tutup sinyal lama yang masih aktif agar hanya ada satu
  db.prepare("UPDATE talks SET status = 'dibatalkan', updated_at = datetime('now') WHERE child_id = ? AND status IN ('menunggu','disepakati','ditunda')").run(me.id);
  db.prepare("INSERT INTO talks (family_id, child_id, topics, preferred_time) VALUES (?, ?, ?, ?)").run(
    me.family_id, me.id, JSON.stringify(clean), pt,
  );
  refresh();
  return { ok: true };
}

export async function cancelTalk(id: number) {
  const me = await requireRole("child");
  db.prepare("UPDATE talks SET status = 'dibatalkan', updated_at = datetime('now') WHERE id = ? AND child_id = ?").run(id, me.id);
  refresh();
}

// ---------------- Kopilot AI ----------------
export async function askKopilot(mode: "bicara" | "rencana", history: { role: "user" | "model"; text: string }[]) {
  const me = await requireRole("child");
  const msgs = history
    .filter((h) => (h.role === "user" || h.role === "model") && typeof h.text === "string")
    .map((h) => ({ role: h.role, text: h.text.slice(0, 1500) }))
    .slice(-12);
  const last = msgs.filter((m) => m.role === "user").pop()?.text ?? "";
  const turn = msgs.filter((m) => m.role === "user").length - 1;
  const ai = await kopilotReply(mode === "rencana" ? "rencana" : "bicara", me.name, msgs);
  return { text: ai ?? fallbackReply(mode, last, turn), source: ai ? "gemini" : "simulasi" };
}
