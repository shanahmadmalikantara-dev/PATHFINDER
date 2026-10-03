"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2, Handshake, Hourglass, PartyPopper, Plus, X } from "lucide-react";
import { cancelTalk, sendTalkSignal } from "@/actions/child";
import { finishTalk } from "@/actions/parent";
import { TALK_TIMES, TALK_TOPICS } from "@/lib/constants";
import type { Talk } from "@/lib/db";

export default function TalkPanel({ talk, hasParent }: { talk?: Talk; hasParent: boolean }) {
  const [topics, setTopics] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [time, setTime] = useState(TALK_TIMES[2]);
  const [outcome, setOutcome] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const toggle = (t: string) =>
    setTopics((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : xs.length >= 3 ? xs : [...xs, t]));
  const send = () =>
    start(async () => {
      setErr("");
      const r = await sendTalkSignal(topics, time);
      if (r?.error) setErr(r.error);
      else setTopics([]);
    });

  const status = talk?.status;
  const parsed: string[] = talk ? JSON.parse(talk.topics) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Langkah 1: status sinyal */}
      <section className="card space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-coral-700">Langkah 01</p>
            <h2 className="text-xl font-bold">Sinyal Kesiapan</h2>
          </div>
          <span className="chip bg-violet-50 text-violet">🔒 Privat & Sukarela</span>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-3xl bg-sky p-5">
          <Avatar emoji="😊" label="Kamu" tag={talk ? "Siap bicara" : "Eksploratif"} tone="coral" />
          <div className="flex flex-1 flex-col items-center">
            <div className={`h-1 w-full rounded-full ${status === "disepakati" ? "bg-gradient-to-r from-coral to-teal" : "bg-line"}`} />
            <span className="-mt-3 rounded-xl bg-white px-2 py-1 text-center text-[10px] leading-tight font-semibold shadow-sm">
              {status === "disepakati" ? "❤️ Saling\nTerhubung" : status ? "⏳ Menunggu" : "💤 Belum ada\nsinyal"}
            </span>
          </div>
          <Avatar emoji="😄" label="Orang Tua" tag={status === "disepakati" ? "Siap juga" : "Mendengarkan"} tone="teal" />
        </div>

        {!talk && (
          <p className="rounded-2xl bg-white p-4 text-center text-sm text-muted ring-1 ring-line">
            Belum ada sinyal aktif. Pilih topik di samping, lalu kirim sinyal saat kamu siap — <b>kamu yang menentukan temponya.</b>
          </p>
        )}

        {status === "menunggu" && (
          <div className="space-y-3 rounded-2xl bg-coral-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-coral-700"><Hourglass size={16} /> Status: Menunggu respon orang tua</p>
            <p className="text-sm">Topik: <b>{parsed.join(", ")}</b> • {talk!.preferred_time}</p>
            <button onClick={() => start(() => cancelTalk(talk!.id))} className="btn-ghost w-full py-2 text-xs"><X size={14} /> Batalkan sinyal</button>
          </div>
        )}

        {status === "ditunda" && (
          <div className="space-y-3 rounded-2xl bg-amber/10 p-4">
            <p className="font-semibold">⏰ Orang tuamu membalas:</p>
            <p className="rounded-xl bg-white p-3 text-sm italic">“{talk!.parent_response}”</p>
            <p className="text-xs text-muted">Topik: {parsed.join(", ")}</p>
            <button onClick={() => start(() => cancelTalk(talk!.id))} className="btn-ghost w-full py-2 text-xs"><X size={14} /> Batalkan sinyal</button>
          </div>
        )}

        {status === "disepakati" && (
          <div className="space-y-3 rounded-2xl bg-teal-50 p-4">
            <p className="flex items-center gap-2 font-bold text-teal"><PartyPopper size={18} /> Kabar Baik! Orang tua juga siap berdiskusi 🎉</p>
            <p className="text-sm text-teal">“{talk!.parent_response}” — Topikmu siap didengar tanpa celaan.</p>
            <p className="text-xs text-muted">Topik: {parsed.join(", ")} • {talk!.preferred_time}</p>
            <input value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={120} className="input" placeholder="Setelah ngobrol: apa kesepakatannya? (opsional)" />
            <button onClick={() => start(() => finishTalk(talk!.id, outcome))} disabled={pending} className="btn w-full bg-teal text-white">
              <CheckCircle2 size={16} /> Tandai Diskusi Selesai
            </button>
          </div>
        )}
      </section>

      {/* Langkah 2: pilih topik */}
      <section className="card space-y-4">
        <div>
          <p className="eyebrow text-teal">Langkah 02</p>
          <h2 className="text-xl font-bold">Pilih Topik yang Ingin Dibahas</h2>
          <p className="text-sm text-muted">Pilih topik agar orang tua memahami apa yang ada di pikiranmu.</p>
          <span className="chip mt-2 bg-coral-50 text-coral-700"><Check size={12} /> {topics.length} Dipilih (maks 3)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...TALK_TOPICS, ...topics.filter((t) => !TALK_TOPICS.includes(t))].map((t) => {
            const on = topics.includes(t);
            return (
              <button key={t} onClick={() => toggle(t)} className={`chip px-4 py-2.5 text-sm ${on ? "bg-coral text-white shadow" : "bg-sky text-ink/80"}`}>
                {on ? <Check size={14} /> : <Plus size={14} />} {t}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={40} className="input py-2.5" placeholder="Topik lain…" />
          <button onClick={() => { if (custom.trim()) { toggle(custom.trim()); setCustom(""); } }} className="btn-ghost px-4 py-2.5"><Plus size={16} /></button>
        </div>
        <div>
          <p className="label">Waktu yang nyaman</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TALK_TIMES.map((t) => (
              <button key={t} onClick={() => setTime(t)} className={`rounded-2xl py-2.5 text-xs font-semibold ${time === t ? "bg-teal text-white" : "bg-sky"}`}>{t}</button>
            ))}
          </div>
        </div>
        {err && <p className="text-sm text-coral-700">{err}</p>}
        {!hasParent && <p className="rounded-xl bg-amber/10 p-3 text-xs">Orang tuamu belum terhubung. Bagikan kode keluarga dari menu Profil dulu ya.</p>}
        <button onClick={send} disabled={!topics.length || pending} className="btn-primary w-full py-3.5">
          <Handshake size={18} /> {talk ? "Kirim Ulang Sinyal Baru" : "Saya Siap Berdiskusi"}
        </button>
        <p className="text-center text-xs text-muted">Orang tua hanya menerima <b>topik & waktu</b>, bukan alasan atau ceritamu.</p>
      </section>
    </div>
  );
}

function Avatar({ emoji, label, tag, tone }: { emoji: string; label: string; tag: string; tone: "coral" | "teal" }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`grid size-16 place-items-center rounded-full text-3xl shadow ${tone === "coral" ? "bg-coral-100" : "bg-teal-300/60"}`}>{emoji}</span>
      <b className="text-sm">{label}</b>
      <span className={`chip ${tone === "coral" ? "bg-coral-100 text-coral-700" : "bg-teal-100 text-teal"}`}>{tag}</span>
    </div>
  );
}
