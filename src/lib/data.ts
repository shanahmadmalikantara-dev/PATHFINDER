import "server-only";
import { db, USER_COLUMNS, type Checkin, type Goal, type Milestone, type Talk, type User } from "./db";
import { addDays, lastNDays, today, weekStart } from "./dates";

// Kumpulan query baca data. Semua fungsi menerima id yang SUDAH diverifikasi
// kepemilikannya oleh pemanggil (lihat requireRole / getChildForParent).

export function getCheckins(childId: number, days = 14): Checkin[] {
  const from = addDays(today(), -(days - 1));
  return db
    .prepare("SELECT id, child_id, date, energy, mood FROM checkins WHERE child_id = ? AND date >= ? ORDER BY date")
    .all(childId, from) as Checkin[];
}

export function getTodayCheckin(childId: number): Checkin | undefined {
  return db
    .prepare("SELECT id, child_id, date, energy, mood FROM checkins WHERE child_id = ? AND date = ?")
    .get(childId, today()) as Checkin | undefined;
}

/** Jumlah hari berturut-turut check-in (hari ini boleh belum). */
export function getStreak(childId: number): number {
  const rows = db
    .prepare("SELECT date FROM checkins WHERE child_id = ? AND date >= ? ORDER BY date DESC")
    .all(childId, addDays(today(), -120)) as { date: string }[];
  const set = new Set(rows.map((r) => r.date));
  let day = set.has(today()) ? today() : addDays(today(), -1);
  let streak = 0;
  while (set.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function getWeekGoals(childId: number, week = weekStart()): Goal[] {
  return db.prepare("SELECT * FROM goals WHERE child_id = ? AND week = ? ORDER BY id").all(childId, week) as Goal[];
}

export function goalsPercent(goals: Goal[]): number {
  if (!goals.length) return 0;
  const sum = goals.reduce((a, g) => a + Math.min(1, g.progress / Math.max(1, g.target)), 0);
  return Math.round((sum / goals.length) * 100);
}

export function getMilestones(childId: number, opts: { sharedOnly?: boolean } = {}): Milestone[] {
  const where = opts.sharedOnly ? "AND shared = 1" : "";
  return db
    .prepare(`SELECT * FROM milestones WHERE child_id = ? ${where} ORDER BY position, id`)
    .all(childId) as Milestone[];
}

export function milestoneStats(childId: number) {
  const r = db
    .prepare(
      `SELECT COUNT(*) total,
              COALESCE(SUM(status = 'selesai'), 0) done,
              COALESCE(SUM(CASE WHEN status = 'selesai' THEN xp ELSE 0 END), 0) xp
       FROM milestones WHERE child_id = ?`,
    )
    .get(childId) as { total: number; done: number; xp: number };
  const level = 1 + Math.floor(r.xp / 100);
  return { ...r, level, percent: r.total ? Math.round((r.done / r.total) * 100) : 0 };
}

/** Sinyal diskusi yang masih aktif (belum selesai/dibatalkan). */
export function getActiveTalk(childId: number): Talk | undefined {
  return db
    .prepare(
      "SELECT * FROM talks WHERE child_id = ? AND status IN ('menunggu','disepakati','ditunda') ORDER BY id DESC LIMIT 1",
    )
    .get(childId) as Talk | undefined;
}

export function getTalkHistory(childId: number, limit = 5): Talk[] {
  return db
    .prepare("SELECT * FROM talks WHERE child_id = ? AND status = 'selesai' ORDER BY updated_at DESC LIMIT ?")
    .all(childId, limit) as Talk[];
}

export function getFamily(familyId: number | null) {
  if (!familyId) return null;
  const fam = db.prepare("SELECT id, code FROM families WHERE id = ?").get(familyId) as
    | { id: number; code: string }
    | undefined;
  if (!fam) return null;
  const members = db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE family_id = ? ORDER BY role DESC, id`)
    .all(familyId) as User[];
  return { ...fam, members };
}

export function getChildren(familyId: number | null): User[] {
  if (!familyId) return [];
  return db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE family_id = ? AND role = 'child' ORDER BY id`)
    .all(familyId) as User[];
}

/** Anak yang sedang dilihat orang tua (dipilih lewat ?anak=ID, default anak pertama). */
export function getChildForParent(parent: User, childParam?: string | string[]) {
  const children = getChildren(parent.family_id);
  const wanted = Number(Array.isArray(childParam) ? childParam[0] : childParam);
  const child = children.find((c) => c.id === wanted) ?? children[0];
  return { child, children };
}

export const sevenDays = () => lastNDays(7);
