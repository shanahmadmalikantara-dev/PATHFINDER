import { requireRole } from "@/lib/auth";
import { getFamily } from "@/lib/data";
import ProfileView from "@/components/ProfileView";

export const metadata = { title: "Profil" };

export default async function ChildProfile({ searchParams }: { searchParams: Promise<{ baru?: string }> }) {
  const me = await requireRole("child");
  const isNew = (await searchParams).baru === "1";
  return (
    <ProfileView
      me={me}
      family={getFamily(me.family_id)}
      isNew={isNew}
      settings={
        <div className="rounded-2xl bg-violet-50 p-4 text-sm">
          <p className="font-bold text-violet">🔐 Jurnal Pribadi</p>
          <p className="mt-1 text-xs text-muted">Jurnal tersimpan di HP ini & dikunci PIN. Kalau ganti HP atau hapus data browser, jurnal ikut terhapus — itulah harga privasi total 🤍</p>
        </div>
      }
    />
  );
}
