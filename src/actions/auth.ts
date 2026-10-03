"use server";

import { redirect } from "next/navigation";
import { db, type Role } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  homeFor,
  newFamilyCode,
  normalizeCode,
  verifyPassword,
} from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const role = form.get("role") === "parent" ? "parent" : ("child" as Role);
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const familyMode = form.get("familyMode") === "gabung" ? "gabung" : "buat";
  const code = normalizeCode(String(form.get("code") ?? ""));
  const grade = String(form.get("grade") ?? "").trim().slice(0, 30) || null;
  const relation = String(form.get("relation") ?? "").trim().slice(0, 20) || null;

  if (name.length < 2) return { error: "Nama panggilan minimal 2 huruf ya." };
  if (!EMAIL_RE.test(email)) return { error: "Format email belum benar." };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (!form.get("agree")) return { error: "Centang dulu persetujuan Piagam Privasi ya." };
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email))
    return { error: "Email ini sudah terdaftar. Coba masuk saja." };

  let familyId: number;
  if (familyMode === "gabung") {
    if (code.length !== 6) return { error: "Kode keluarga terdiri dari 6 karakter." };
    const fam = db.prepare("SELECT id FROM families WHERE code = ?").get(code) as { id: number } | undefined;
    if (!fam) return { error: "Kode keluarga tidak ditemukan. Cek lagi ke anggota keluargamu ya." };
    familyId = fam.id;
  } else {
    familyId = Number(db.prepare("INSERT INTO families (code) VALUES (?)").run(newFamilyCode()).lastInsertRowid);
  }

  const hash = await hashPassword(password);
  const id = Number(
    db
      .prepare(
        "INSERT INTO users (role, name, email, password_hash, family_id, grade, relation) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(role, name, email, hash, familyId, role === "child" ? grade : null, role === "parent" ? relation : null)
      .lastInsertRowid,
  );
  await createSession(id);
  redirect(homeFor(role) + (familyMode === "buat" ? "/profil?baru=1" : ""));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const row = db.prepare("SELECT id, role, password_hash FROM users WHERE email = ?").get(email) as
    | { id: number; role: Role; password_hash: string }
    | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash)))
    return { error: "Email atau kata sandi salah." };
  await createSession(row.id);
  redirect(homeFor(row.role));
}

export async function demoLogin(role: Role) {
  if (process.env.DEMO_MODE !== "true") return;
  const email = role === "child" ? "shan@demo.id" : "putri@demo.id";
  const row = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (!row) redirect("/masuk?demo=belum");
  await createSession(row.id);
  redirect(homeFor(role));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
