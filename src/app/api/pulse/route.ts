import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { familyVersion } from "@/lib/db";

// "Detak jantung" keluarga: cukup satu angka versi per keluarga (tabel family_pulse,
// dibaca lewat primary key). HP menanyakan angka ini berkala; halaman baru dimuat
// ulang hanya kalau angkanya berubah. Ringan untuk server & kuota internet.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const me = await getUser();
  if (!me?.family_id) return NextResponse.json({ v: null }, { status: me ? 200 : 401, headers: NO_STORE });
  return NextResponse.json({ v: familyVersion(me.family_id) }, { headers: NO_STORE });
}
