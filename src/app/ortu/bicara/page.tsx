import { Ear, HandHeart, Leaf, ShieldCheck, ThumbsUp, Bookmark, Quote, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getChildren, getTalkHistory, getTodayCheckin } from "@/lib/data";
import { timeAgo } from "@/lib/dates";
import { energyLabel, moodInfo } from "@/lib/constants";
import { ProgressBar } from "@/components/Charts";
import RespondButtons from "./RespondButtons";

export const metadata = { title: "Ruang Bicara" };

const TIPS = [
  { icon: Ear, t: "Mendengar 80%, Berbicara 20%", b: "Tarik napas dan pasang niat untuk lebih banyak mendengar.", hint: "Beri jeda hening sebelum merespons" },
  { icon: HandHeart, t: "Validasi Emosi Anak", b: "Fokus pada perasaan anak, bukan mencari siapa yang benar atau salah.", hint: "Katakan: “Ibu paham hal itu melelahkan untukmu”" },
  { icon: ThumbsUp, t: "Apresiasi Langkah Awal", b: "Hargai keberanian anak yang telah berinisiatif membuka obrolan.", hint: "Ucapkan terima kasih di awal percakapan" },
];

export default async function ParentTalk() {
  const me = await requireRole("parent");
  const kids = getChildren(me.family_id).map((c) => ({ c, talk: getActiveTalk(c.id), ck: getTodayCheckin(c.id), history: getTalkHistory(c.id, 3) }));
  const anyActive = kids.some((k) => k.talk);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted"><span className="chip bg-teal-100 text-teal">💬 Ruang Bicara</span> / Jembatan Komunikasi Suportif</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Jembatan Frekuensi Tenang</h1>
          <p className="mt-2 max-w-2xl text-muted">Menghubungkan orang tua dan anak ketika keduanya telah sama-sama berada di frekuensi yang tenang.</p>
        </div>
        <span className="chip bg-white px-4 py-2 text-sm text-teal shadow-sm"><Leaf size={14} /> Zona Komunikasi Asertif & Damai</span>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          {!anyActive && (
            <div className="card space-y-2 text-center">
              <p className="text-4xl">🌿</p>
              <p className="text-lg font-bold">Belum ada sinyal diskusi</p>
              <p className="text-sm text-muted">Saat anak Anda menekan “Saya Siap Berdiskusi”, topik dan waktu pilihannya akan muncul di sini. Kesabaran Anda adalah bentuk kepercayaan. 🤍</p>
            </div>
          )}
          {kids.filter((k) => k.talk).map(({ c, talk, ck }) => {
            const topics: string[] = JSON.parse(talk!.topics);
            const readiness = ck ? Math.round((ck.energy / 5) * 100) : null;
            return (
              <section key={c.id} className="card space-y-4 bg-gradient-to-br from-teal-50 to-white">
                <div className="flex items-center justify-between">
                  <span className="chip bg-teal px-3 py-1.5 text-white">✨ {c.name} Siap Berdiskusi 🎉</span>
                  <span className="text-xs text-muted">{timeAgo(talk!.created_at)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="grid size-14 place-items-center rounded-full bg-teal-300/50 text-2xl">😊</span>
                  <div className="flex-1">
                    <p className="text-lg font-bold">{c.name} <span className="chip bg-sky text-muted">Anak</span></p>
                    <p className="flex items-center gap-1 text-sm text-teal"><CheckCircle2 size={14} /> Membuka diri untuk bicara</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-xs text-muted">Kondisi Hari Ini</span><br />
                    <b className="text-teal">{ck ? `${moodInfo(ck.mood)?.emoji ?? "🙂"} ${energyLabel(ck.energy)}` : "Belum check-in"}</b>
                  </div>
                </div>
                <div className="rounded-2xl bg-sky p-4">
                  <div className="flex justify-between"><p className="eyebrow flex items-center gap-1.5 text-teal"><Bookmark size={13} /> Topik diskusi terpilih</p><span className="text-xs font-semibold text-muted">Inisiatif Mandiri</span></div>
                  <p className="mt-2 text-lg font-bold">{topics.join(" • ")}</p>
                  <p className="mt-1 text-sm text-muted">☁️ {c.name} memilih waktu: <b>{talk!.preferred_time}</b></p>
                </div>
                {readiness !== null && (
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex justify-between text-sm"><b>Keselarasan Energi</b><b className="text-teal">{readiness}% Siap</b></div>
                    <ProgressBar percent={readiness} className="mt-2" />
                    <p className="mt-2 text-xs text-muted">{readiness >= 60 ? "Optimal untuk dialog santai" : "Energi sedang rendah — pilih suasana yang ringan & singkat"}</p>
                  </div>
                )}
                {talk!.parent_response && talk!.status === "ditunda" && <p className="text-sm text-muted">Balasan Anda: “{talk!.parent_response}”</p>}
                <RespondButtons id={talk!.id} status={talk!.status} />
              </section>
            );
          })}
        </div>

        <aside className="space-y-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal to-coral/70 p-6 text-white">
            <span className="chip bg-white/20">🧘 Suasana Ramah & Tenang</span>
            <p className="mt-16 flex gap-2 text-2xl leading-snug font-semibold"><Quote className="shrink-0" /> Obrolan santai menghasilkan kesepakatan terbaik.</p>
            <p className="mt-3 text-sm text-white/80">PathFinder AI • Mindset Suportif</p>
          </div>
          <div className="card">
            <p className="mb-3 font-bold">Riwayat Diskusi</p>
            {kids.every((k) => k.history.length === 0) ? (
              <p className="text-sm text-muted">Belum ada diskusi selesai.</p>
            ) : (
              <ul className="space-y-2">
                {kids.flatMap((k) => k.history.map((h) => (
                  <li key={h.id} className="rounded-2xl bg-sky p-3 text-sm">
                    <b>{(JSON.parse(h.topics) as string[]).join(", ")}</b>
                    {h.outcome && <p className="text-muted">{h.outcome}</p>}
                    <p className="text-xs text-muted">{k.c.name} • {timeAgo(h.updated_at)}</p>
                  </li>
                )))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">🌱 Tips Persiapan Diskusi Orang Tua 🌿</h2>
          <span className="flex items-center gap-1.5 text-sm text-muted"><ShieldCheck size={15} /> Metode Empati Terarah</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {TIPS.map((t, i) => (
            <div key={t.t} className="card flex flex-col">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-full bg-teal text-lg font-bold text-white">{i + 1}</span>
                <t.icon className="text-teal" />
              </div>
              <p className="mt-4 text-lg font-bold">{t.t}</p>
              <p className="mt-1 flex-1 text-sm text-muted">{t.b}</p>
              <p className="mt-4 flex items-start gap-1.5 text-xs font-semibold text-teal"><CheckCircle2 size={14} className="shrink-0" /> {t.hint}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
