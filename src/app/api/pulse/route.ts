import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { today } from "@/lib/dates";

// "Detak jantung" keluarga: sidik jari kecil dari data bersama keluarga.
// HP cukup menanyakan ini tiap beberapa detik; halaman baru dimuat ulang
// hanya kalau sidik jarinya berubah. Ringan untuk server & kuota internet.
export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getUser();
  if (!me?.family_id) return NextResponse.json({ v: null }, { status: me ? 200 : 401 });
  const f = me.family_id;
  const row = db
    .prepare(
      `SELECT
        (SELECT COALESCE(MAX(id), 0) || ':' || COALESCE(MAX(updated_at), '') || ':' || COUNT(*) FROM talks WHERE family_id = @f) AS t,
        (SELECT COALESCE(GROUP_CONCAT(c.child_id || c.energy || COALESCE(c.mood, ''), ','), '') FROM checkins c
           JOIN users u ON u.id = c.child_id WHERE u.family_id = @f AND c.date = @d) AS c,
        (SELECT COALESCE(SUM(g.progress * 100 + g.target), 0) || ':' || COUNT(*) FROM goals g
           JOIN users u ON u.id = g.child_id WHERE u.family_id = @f) AS g,
        (SELECT COALESCE(SUM(m.id * (CASE m.status WHEN 'selesai' THEN 3 WHEN 'berjalan' THEN 2 ELSE 1 END) + m.shared), 0) || ':' || COUNT(*)
           FROM milestones m JOIN users u ON u.id = m.child_id WHERE u.family_id = @f) AS m,
        (SELECT COUNT(*) || ':' || GROUP_CONCAT(capability) FROM users WHERE family_id = @f) AS u`,
    )
    .get({ f, d: today() }) as Record<string, string>;
  const v = crypto.createHash("sha1").update(JSON.stringify(row)).digest("hex").slice(0, 12);
  return NextResponse.json({ v }, { headers: { "Cache-Control": "no-store" } });
}
