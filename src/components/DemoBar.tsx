import { Repeat, Sparkles } from "lucide-react";
import { demoLogin } from "@/actions/auth";

/** Bar kecil di atas aplikasi khusus akun demo: pindah ke sisi lain dengan satu ketukan. */
export default function DemoBar({ role }: { role: "child" | "parent" }) {
  const other = role === "child" ? "parent" : "child";
  return (
    <form action={demoLogin.bind(null, other)} className="mb-4 flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-2.5 text-sm text-violet">
      <Sparkles size={16} className="shrink-0" />
      <span className="flex-1"><b>Mode demo</b> · kamu melihat sisi {role === "child" ? "Anak" : "Orang Tua"}</span>
      <button className="chip shrink-0 bg-white px-3 py-1.5 font-semibold text-violet shadow-sm hover:bg-violet-100">
        <Repeat size={13} /> Lihat sisi {other === "child" ? "Anak" : "Orang Tua"}
      </button>
    </form>
  );
}
