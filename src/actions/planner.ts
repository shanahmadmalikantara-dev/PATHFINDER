"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db, type Milestone } from "@/lib/db";
import { lastNDays, weekStart } from "@/lib/dates";
import { HOURS_OPTIONS } from "@/lib/constants";
import { aiPlan, rulePlan, type Plan, type PlannerInput, type PlannerProfile } from "@/lib/planner";

const clip = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function profileOf(me: { id: number; name: string; grade: string | null }): PlannerProfile {
  const since = lastNDays(14)[0];
  const e = db.prepare("SELECT AVG(energy) a FROM checkins WHERE child_id = ? AND date >= ?").get(me.id, since) as { a: number | null };
  const goals = db.prepare("SELECT title FROM goals WHERE child_id = ? AND week = ?").all(me.id, weekStart()) as { title: string }[];
  const ms = db.prepare("SELECT title, status FROM milestones WHERE child_id = ? ORDER BY position LIMIT 12").all(me.id) as Milestone[];
  return {
    name: me.name,
    grade: me.grade,
    avgEnergy: e.a,
    goals: goals.map((g) => g.title),
    milestones: ms.map((m) => `${m.title} [${m.status}]`),
  };
}

/** Langkah 1: anak menulis impian → PathFinder menyusun beberapa jalur pilihan. */
export async function planDream(raw: PlannerInput): Promise<{ plan?: Plan; error?: string }> {
  const me = await requireRole("child");
  const input: PlannerInput = {
    dream: clip(raw?.dream, 160),
    hours: HOURS_OPTIONS.includes(raw?.hours) ? raw.hours : HOURS_OPTIONS[1],
    strengths: clip(raw?.strengths, 200),
    constraints: clip(raw?.constraints, 200),
    feedback: clip(raw?.feedback, 240) || undefined,
  };
  if (input.dream.length < 4) return { error: "Ceritakan impianmu sedikit lebih jelas ya (minimal 4 huruf)." };

  const profile = profileOf(me);
  try {
    const ai = await aiPlan(profile, input);
    if (ai) return { plan: ai };
  } catch (e) {
    console.error("[planner]", (e as Error).message);
  }
  return { plan: rulePlan(profile, input) };
}

export interface ApplySelection {
  dream: string;
  steps: { title: string; detail: string; period: string; horizon: string; priority: number; tasks: string[] }[];
  habits: { title: string; category: string; target: number; unit: string }[];
  shared: boolean;
}

/** Langkah 2: anak memilih jalur & milestone → langsung masuk roadmap + target minggu ini. */
export async function applyPlan(sel: ApplySelection): Promise<{ ok?: string; error?: string }> {
  const me = await requireRole("child");
  let steps = (Array.isArray(sel?.steps) ? sel.steps : []).slice(0, 8).filter((s) => clip(s?.title, 80).length >= 3);
  const habits = (Array.isArray(sel?.habits) ? sel.habits : []).slice(0, 4).filter((h) => clip(h?.title, 60).length >= 2);
  if (!steps.length) return { error: "Pilih minimal satu milestone dulu ya." };
  const dream = clip(sel.dream, 120) || null;
  const shared = sel.shared ? 1 : 0;

  // Lewati milestone yang sudah ada di roadmap supaya menyimpan ulang rencana yang sama tidak membuat data dobel
  const existing = new Set(
    (db.prepare("SELECT title FROM milestones WHERE child_id = ?").all(me.id) as { title: string }[]).map((m) => m.title.trim().toLowerCase()),
  );
  const total = steps.length;
  steps = steps.filter((s) => !existing.has(clip(s.title, 80).toLowerCase()));
  if (!steps.length) return { error: "Semua milestone ini sudah ada di roadmap-mu. Cek halaman Roadmap ya." };
  const dupes = total - steps.length;

  const result = db.transaction(() => {
    let pos = (db.prepare("SELECT COALESCE(MAX(position), 0) p FROM milestones WHERE child_id = ?").get(me.id) as { p: number }).p;
    const hasCurrent = !!db.prepare("SELECT 1 FROM milestones WHERE child_id = ? AND status = 'berjalan'").get(me.id);
    const insert = db.prepare(
      `INSERT INTO milestones (child_id, title, description, horizon, status, target_date, shared, tasks, dream, priority, period, xp, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    let firstId: number | null = null;
    steps.forEach((s, i) => {
      const horizon = s.horizon === "jangka_panjang" ? "jangka_panjang" : "tahun_ini";
      const priority = [1, 2, 3].includes(Number(s.priority)) ? Number(s.priority) : 2;
      const tasks = (Array.isArray(s.tasks) ? s.tasks : []).map((t) => clip(t, 90)).filter(Boolean).slice(0, 5).map((t) => ({ t, done: false }));
      const period = clip(s.period, 40) || null;
      const r = insert.run(
        me.id,
        clip(s.title, 80),
        clip(s.detail, 240) || null,
        horizon,
        i === 0 && !hasCurrent ? "berjalan" : "rencana",
        period,
        shared,
        tasks.length ? JSON.stringify(tasks) : null,
        dream,
        priority,
        period,
        horizon === "jangka_panjang" ? 300 : priority === 1 ? 150 : 100,
        ++pos,
      );
      if (firstId === null) firstId = Number(r.lastInsertRowid);
    });

    // Kebiasaan → target minggu ini (maks 6 target per minggu)
    const week = weekStart();
    const used = (db.prepare("SELECT COUNT(*) n FROM goals WHERE child_id = ? AND week = ?").get(me.id, week) as { n: number }).n;
    const slots = Math.max(0, 6 - used);
    const cats = ["belajar", "kebugaran", "minat", "kebiasaan"];
    const addGoal = db.prepare(
      "INSERT INTO goals (child_id, week, title, detail, category, target, unit, milestone_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const added = habits.slice(0, slots);
    for (const h of added) {
      addGoal.run(
        me.id,
        week,
        clip(h.title, 60),
        dream ? clip(`Untuk: ${dream}`, 80) : null,
        cats.includes(h.category) ? h.category : "belajar",
        Math.min(99, Math.max(1, Math.round(Number(h.target) || 1))),
        clip(h.unit, 12) || "kali",
        firstId,
      );
    }
    return { goals: added.length, skipped: habits.length - added.length };
  })();

  revalidatePath("/", "layout");
  const extra = result.goals ? ` dan ${result.goals} target minggu ini` : "";
  const note = result.skipped ? ` (${result.skipped} kebiasaan tidak masuk karena target minggu ini sudah penuh)` : "";
  const dupeNote = dupes ? ` ${dupes} milestone dilewati karena sudah ada di roadmap.` : "";
  return { ok: `${steps.length} milestone${extra} sudah masuk ke rencanamu${note}.${dupeNote}` };
}

/** Centang/batal centang satu tugas di checklist milestone. */
export async function toggleTask(milestoneId: number, index: number) {
  const me = await requireRole("child");
  const m = db.prepare("SELECT tasks FROM milestones WHERE id = ? AND child_id = ?").get(milestoneId, me.id) as { tasks: string | null } | undefined;
  if (!m?.tasks) return;
  let tasks: { t: string; done: boolean }[];
  try {
    tasks = JSON.parse(m.tasks);
  } catch {
    return;
  }
  if (!tasks[index]) return;
  tasks[index].done = !tasks[index].done;
  db.prepare("UPDATE milestones SET tasks = ? WHERE id = ?").run(JSON.stringify(tasks), milestoneId);
  revalidatePath("/anak/roadmap");
}
