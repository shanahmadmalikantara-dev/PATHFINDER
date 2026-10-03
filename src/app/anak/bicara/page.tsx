import Link from "next/link";
import { ArrowRight, Bot, CalendarCheck, Lightbulb, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getActiveTalk, getFamily, getTalkHistory } from "@/lib/data";
import { timeAgo } from "@/lib/dates";
import TalkPanel from "./TalkPanel";

export const metadata = { title: "Ruang Bicara" };

export default async function ChildTalk() {
  const me = await requireRole("child");
  const talk = getActiveTalk(me.id);
  const history = getTalkHistory(me.id);
  const fam = getFamily(me.family_id);
  const hasParent = !!fam?.members.some((m) => m.role === "parent");

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden bg-gradient-to-r from-white via-white to-teal-50 sm:p-8">
        <span className="chip bg-coral-100 text-coral-700">❤️ RUANG AMAN REMAJA</span>
        <h1 className="mt-3 flex flex-wrap items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ruang Bicara 💬 <span className="chip bg-sky text-muted">Mode Ramah Remaja</span>
        </h1>
        <p className="mt-2 max-w-xl text-muted">Jembatan aman untuk memulai obrolan dengan orang tua tanpa rasa canggung atau tertekan.</p>
        <p className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white p-3 text-sm shadow-sm">
          <ShieldCheck size={22} className="text-violet" /><span><b>100% Terkendali</b><br /><span className="text-xs text-muted">Kamu yang menentukan temponya</span></span>
        </p>
      </section>

      <TalkPanel talk={talk} hasParent={hasParent} />

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
          <span className="chip bg-white text-violet"><Lightbulb size={12} /> Tips Rahasia Remaja</span>
          <p className="text-lg font-medium">Obrolan santai sambil makan camilan favorit sering kali menghasilkan kesepakatan terbaik tanpa emosi atau ketegangan.</p>
          <p className="text-xs text-muted">Strategi “Camilan Pertama, Obrolan Kedua” 🍪</p>
        </div>

        <div className="card space-y-3">
          <p className="flex items-center gap-2 font-bold"><CalendarCheck size={20} className="text-teal" /> Ringkasan Diskusi</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted">Belum ada diskusi yang selesai. Obrolan pertama selalu yang paling berharga 🌱</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-2xl bg-sky p-3 text-sm">
                  <div className="flex justify-between gap-2"><b>{(JSON.parse(h.topics) as string[]).join(", ")}</b><span className="chip bg-teal-100 text-teal">✓ Disepakati</span></div>
                  {h.outcome && <p className="mt-1 text-muted">{h.outcome}</p>}
                  <p className="mt-1 text-xs text-muted">{timeAgo(h.updated_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
