import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, USER_COLUMNS, type Role, type User } from "./db";

const COOKIE = "pf_session";
const SESSION_DAYS = 30;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

/** Buat sesi login baru dan simpan token di cookie httpOnly. */
export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expires.toISOString(),
  );
  // Cookie "secure" hanya bila diakses lewat HTTPS (agar tetap bisa dites via http://IP-VPS)
  const h = await headers();
  const https = h.get("x-forwarded-proto") === "https" || process.env.FORCE_SECURE_COOKIE === "true";
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.delete(COOKIE);
}

/** User yang sedang login, atau null. */
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT ${USER_COLUMNS.split(", ").map((c) => "u." + c).join(", ")}, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    )
    .get(token) as (User & { expires_at: string }) | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  const { expires_at: _, ...user } = row;
  return user;
}

/**
 * Wajib login dengan peran tertentu. Inilah "tembok" Dual-Mode:
 * akun anak tidak akan pernah bisa membuka halaman orang tua, dan sebaliknya.
 */
export async function requireRole(role: Role): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/masuk");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

export function homeFor(role: Role) {
  return role === "child" ? "/anak" : "/ortu";
}

// ---- Kode keluarga ----
// Tanpa huruf/angka yang mirip (O/0, I/1/L) supaya tidak salah ketik.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newFamilyCode(): string {
  for (;;) {
    const bytes = crypto.randomBytes(6);
    const code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    const exists = db.prepare("SELECT 1 FROM families WHERE code = ?").get(code);
    if (!exists) return code;
  }
}

export function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
