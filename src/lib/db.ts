import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema.mjs";

// Satu koneksi database dipakai ulang (disimpan di globalThis agar
// tidak membuka koneksi baru setiap kali file di-reload saat development).
const globalForDb = globalThis as unknown as { __pathfinderDb?: Database.Database };

function open() {
  const file = path.resolve(process.env.DATABASE_PATH || "./data/pathfinder.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  return db;
}

export const db = globalForDb.__pathfinderDb ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.__pathfinderDb = db;

// ---- Tipe data ----
export type Role = "child" | "parent";
export type Capability = "sibuk" | "sedikit" | "banyak";

export interface User {
  id: number;
  role: Role;
  name: string;
  email: string;
  family_id: number | null;
  grade: string | null;
  relation: string | null;
  capability: Capability;
}

export interface Checkin {
  id: number;
  child_id: number;
  date: string;
  energy: number;
  mood: string | null;
}

export interface Goal {
  id: number;
  child_id: number;
  week: string;
  title: string;
  detail: string | null;
  category: string;
  target: number;
  unit: string;
  progress: number;
}

export interface Milestone {
  id: number;
  child_id: number;
  title: string;
  description: string | null;
  horizon: "tahun_ini" | "jangka_panjang";
  status: "rencana" | "berjalan" | "selesai";
  target_date: string | null;
  shared: number;
  xp: number;
  position: number;
  done_at: string | null;
}

export interface Talk {
  id: number;
  family_id: number;
  child_id: number;
  topics: string;
  preferred_time: string;
  status: "menunggu" | "disepakati" | "ditunda" | "selesai" | "dibatalkan";
  parent_id: number | null;
  parent_response: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export const USER_COLUMNS = "id, role, name, email, family_id, grade, relation, capability";
