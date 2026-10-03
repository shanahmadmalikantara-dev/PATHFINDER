import { requireRole } from "@/lib/auth";
import { getFamily } from "@/lib/data";
import { CAPABILITIES } from "@/lib/constants";
import ProfileView from "@/components/ProfileView";

export const metadata = { title: "Profil" };

export default async function ParentProfile({ searchParams }: { searchParams: Promise<{ baru?: string }> }) {
  const me = await requireRole("parent");
  const isNew = (await searchParams).baru === "1";
  const cap = CAPABILITIES.find((c) => c.value === me.capability);
  return (
    <ProfileView
      me={me}
      family={getFamily(me.family_id)}
      isNew={isNew}
      settings={
        <div className="rounded-2xl bg-teal-50 p-4 text-sm">
          <p className="font-bold text-teal">⏱️ Kapasitas Waktu (Capability Filter)</p>
          <p className="mt-1 text-xs text-muted">Saat ini: <b>{cap?.label}</b>. Ubah kapan saja di Beranda — saran parenting akan menyesuaikan.</p>
        </div>
      }
    />
  );
}
