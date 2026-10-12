import Link from "next/link";
import { ArrowRight, Bot, CalendarCheck, Cookie, HeartHandshake, Lightbulb, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getFamily, getTalkHistory, talkTopics } from "@/lib/data";
import { timeAgo } from "@/lib/dates";
import { TALK_TOPICS } from "@/lib/constants";
import { TalkComposer, TalkStatus } from "@/components/TalkUI";

export const metadata = { title: "Ruang Bicara" };

export default async function ChildTalk() {
  const me = await requireRole("child");
  const talk = getActiveTalk(me.id);
  const history = getTalkHistory(me.id);
  const fam = getFamily(me.family_id);
  const hasParent = !!fam?.members.some((m) => m.role === "parent");
  const fromParent = talk && talk.initiator === "parent";

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden bg-gradient-to-r from-white via-white to-teal-50 sm:p-8">
        <span className="chip bg-coral-100 text-coral-700"><HeartHandshake size={12} /> Ruang aman remaja</span>
        <h1 className="mt-3 flex flex-wrap items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ruang Bicara <span className="chip bg-sky text-muted">Dua arah</span>
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          Kamu bisa mengajak orang tua ngobrol, dan orang tua juga bisa mengajakmu. Yang dibagikan cuma topik, waktu, dan pesan singkat.
        </p>
        <p className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white p-3 text-sm shadow-sm">
          <ShieldCheck size={22} className="text-violet" />
          <span><b>Kamu tetap pegang kendali</b><br /><span className="text-xs text-muted">Boleh setuju, minta waktu lain, atau bilang butuh waktu dulu</span></span>
        </p>
      </section>

      {!hasParent ? (
        <div className="card flex items-start gap-3 text-sm">
          <Users size={22} className="shrink-0 text-primary" />
          <p>Akunmu belum terhubung dengan orang tua. Bagikan <b>kode keluarga</b> di halaman <Link href="/anak/profil" className="font-semibold text-primary underline">Profil</Link> supaya orang tua bisa bergabung.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {talk && (
            <section className="card space-y-3">
              <p className="flex items-center gap-2 font-bold"><MessagesSquare size={18} className="text-primary" /> Ajakan aktif <span className="text-xs font-normal text-muted">· {timeAgo(talk.created_at)}</span></p>
              <TalkStatus talk={talk} viewer="child" partnerName="Orang tuamu" />
            </section>
          )}
          {!fromParent && (
            <section className="card space-y-3">
              <p className="font-bold">{talk ? "Mau ganti ajakanmu?" : "Mau ngobrolin apa? (maks. 3 topik)"}</p>
              <TalkComposer role="child" topicsList={TALK_TOPICS} partnerName="Orang tuamu" replacing={!!talk} />
            </section>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Link href="/anak/bicara/kopilot?mode=bicara" className="card group space-y-2 bg-violet-50 hover:ring-2 hover:ring-violet-100">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet"><Bot size={20} /></span>
            <span className="chip bg-white text-violet">AI Companion</span>
          </div>
          <p className="text-lg font-bold">Kopilot AI Bicara</p>
          <p className="text-sm text-muted">Latih kalimatmu dulu bersama AI sebelum berbicara langsung.</p>
          <p className="flex items-center gap-1 text-sm font-semibold text-violet">Coba Latihan <ArrowRight size={16} className="transition group-hover:translate-x-1" /></p>
        </Link>

        <div className="card space-y-3 bg-gradient-to-br from-violet-50 to-white">
          <span className="chip bg-white text-violet"><Lightbulb size={12} /> Tips Remaja</span>
          <p className="text-lg font-medium">Obrolan santai sambil makan camilan favorit sering menghasilkan kesepakatan terbaik tanpa ketegangan.</p>
          <p className="flex items-center gap-1.5 text-xs text-muted"><Cookie size={14} /> Strategi “Camilan dulu, obrolan kemudian”</p>
        </div>

        <div className="card space-y-3">
          <p className="flex items-center gap-2 font-bold"><CalendarCheck size={20} className="text-teal" /> Ringkasan Diskusi</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted">Belum ada diskusi yang selesai. Obrolan pertama selalu yang paling berharga.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-2xl bg-sky p-3 text-sm">
                  <div className="flex justify-between gap-2"><b>{talkTopics(h).join(", ")}</b><span className="chip bg-teal-100 text-teal">Selesai</span></div>
                  {h.outcome && <p className="mt-1 text-muted">{h.outcome}</p>}
                  <p className="mt-1 text-xs text-muted">{h.initiator === "parent" ? "Diajak orang tua" : "Kamu yang mengajak"} · {timeAgo(h.updated_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
