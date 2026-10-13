"use client";

// Komponen Ruang Bicara yang dipakai bersama oleh Mode Anak & Mode Orang Tua.
import { useId, useState, useTransition } from "react";
import { CalendarClock, Check, CheckCircle2, Clock, Handshake, Hourglass, MessageCircleHeart, Plus, Send, X } from "lucide-react";
import { cancelTalk, finishTalk, respondTalk, startTalk, type ResponseKey } from "@/actions/talk";
import { TALK_TIMES } from "@/lib/constants";
import type { Talk } from "@/lib/db";

type Role = "child" | "parent";

function topicsOf(t: Talk): string[] {
  try {
    return JSON.parse(t.topics);
  } catch {
    return [];
  }
}

/** Form mengajak diskusi: pilih topik (maks 3), waktu, dan pesan singkat opsional. */
export function TalkComposer({
  role,
  topicsList,
  childId,
  partnerName,
  replacing,
}: {
  role: Role;
  topicsList: string[];
  childId?: number;
  partnerName: string;
  replacing?: boolean;
}) {
  const [topics, setTopics] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [time, setTime] = useState(TALK_TIMES[2]);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const noteId = useId(); // unik per komposer (orang tua bisa melihat beberapa sekaligus)
  const toggle = (t: string) =>
    setTopics((xs) => (xs.includes(t) ? xs.filter((x) => x !== t) : xs.length >= 3 ? xs : [...xs, t]));

  const send = () =>
    start(async () => {
      setErr("");
      const r = await startTalk({ topics, time, note, childId });
      if (r?.error) setErr(r.error);
      else {
        setTopics([]);
        setNote("");
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[...topicsList, ...topics.filter((t) => !topicsList.includes(t))].map((t) => {
          const on = topics.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`chip px-4 py-2.5 text-sm ${on ? "bg-primary text-white shadow" : "bg-sky text-ink/80 hover:bg-primary-faint"}`}
            >
              {on ? <Check size={14} /> : <Plus size={14} />} {t}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={40} className="input py-2.5" placeholder="Topik lain…" />
        <button
          type="button"
          onClick={() => {
            if (custom.trim()) {
              toggle(custom.trim());
              setCustom("");
            }
          }}
          className="btn-ghost px-4 py-2.5"
          aria-label="Tambah topik"
        >
          <Plus size={16} />
        </button>
      </div>
      <div>
        <p className="label flex items-center gap-1.5"><CalendarClock size={14} /> Waktu yang nyaman</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TALK_TIMES.map((t) => (
            <button key={t} type="button" onClick={() => setTime(t)} className={`rounded-2xl py-2.5 text-xs font-semibold ${time === t ? "bg-primary text-white" : "bg-sky"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor={noteId} className="label">Pesan singkat untuk {partnerName} (opsional)</label>
        <textarea
          id={noteId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={140}
          rows={2}
          className="input resize-none"
          placeholder={role === "parent" ? "Contoh: Ibu pengen dengar ceritamu soal sekolah, santai aja ya." : "Contoh: Aku pengen ngobrolin jadwal les, boleh?"}
        />
      </div>
      {err && <p className="text-sm text-coral-700">{err}</p>}
      {replacing && <p className="text-xs text-muted">Mengirim ajakan baru akan menggantikan ajakan yang masih aktif.</p>}
      <button onClick={send} disabled={!topics.length || pending} className="btn-primary w-full py-3.5">
        {role === "parent" ? <><Send size={17} /> Ajak {partnerName} Ngobrol</> : <><Handshake size={18} /> Saya Siap Berdiskusi</>}
      </button>
      <p className="text-center text-xs text-muted">
        {partnerName} hanya menerima <b>topik, waktu, dan pesan singkatmu</b>.
      </p>
    </div>
  );
}

/** Kartu status ajakan yang sedang aktif, dari sudut pandang `viewer`. */
export function TalkStatus({ talk, viewer, partnerName }: { talk: Talk; viewer: Role; partnerName: string }) {
  const [pending, start] = useTransition();
  const [later, setLater] = useState(false);
  const [outcome, setOutcome] = useState("");
  const mine = talk.initiator === viewer;
  const topics = topicsOf(talk);
  const act = (fn: () => Promise<void>) => start(fn);

  const options: { key: ResponseKey; label: string }[] = [
    { key: "1jam", label: "1 jam lagi" },
    { key: "besok", label: "Besok" },
    { key: "akhirpekan", label: "Akhir pekan" },
    ...(viewer === "child" ? [{ key: "butuhwaktu" as ResponseKey, label: "Butuh waktu dulu" }] : []),
  ];

  return (
    <div className={`space-y-4 ${pending ? "opacity-70" : ""}`}>
      {/* Isi ajakan */}
      <div className="rounded-2xl bg-sky p-4">
        <p className="eyebrow flex items-center gap-1.5 text-primary-strong">
          <MessageCircleHeart size={14} /> {mine ? "Ajakanmu" : `${partnerName} mengajak ngobrol`}
        </p>
        <p className="mt-2 text-lg font-bold">{topics.join(" · ")}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Clock size={14} /> {talk.preferred_time}</p>
        {talk.note && <p className="mt-3 rounded-xl bg-white p-3 text-sm italic">“{talk.note}”</p>}
      </div>

      {/* Status & aksi */}
      {talk.status === "disepakati" ? (
        <div className="space-y-3 rounded-2xl bg-teal-50 p-4">
          <p className="flex items-center gap-2 font-bold text-teal"><Handshake size={18} /> Kalian sepakat untuk ngobrol</p>
          {talk.response && <p className="text-sm text-teal">{mine ? `${partnerName}: ` : "Kamu: "}“{talk.response}”</p>}
          <input value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={140} className="input" placeholder="Setelah ngobrol: apa kesepakatannya? (opsional)" />
          <button disabled={pending} onClick={() => act(() => finishTalk(talk.id, outcome))} className="btn w-full bg-teal text-white">
            <CheckCircle2 size={16} /> Tandai Diskusi Selesai
          </button>
        </div>
      ) : mine ? (
        <div className="space-y-3 rounded-2xl bg-primary-faint p-4">
          {talk.status === "menunggu" ? (
            <p className="flex items-center gap-2 font-semibold text-primary-strong"><Hourglass size={16} /> Menunggu balasan {partnerName}</p>
          ) : (
            <>
              <p className="font-semibold">{partnerName} membalas:</p>
              <p className="rounded-xl bg-white p-3 text-sm italic">“{talk.response}”</p>
            </>
          )}
          <button onClick={() => act(() => cancelTalk(talk.id))} className="btn-ghost w-full py-2 text-xs"><X size={14} /> Batalkan ajakan</button>
        </div>
      ) : (
        <div className="space-y-3">
          {talk.status === "ditunda" && talk.response && (
            <p className="rounded-xl bg-white p-3 text-sm text-muted ring-1 ring-line">Balasanmu sebelumnya: “{talk.response}”</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button disabled={pending} onClick={() => act(() => respondTalk(talk.id, "siap"))} className="btn-primary flex-1 py-3.5">
              <Handshake size={18} /> {viewer === "parent" ? "Saya Juga Siap" : "Aku Juga Siap"}
            </button>
            <button disabled={pending} onClick={() => setLater((v) => !v)} className="btn-ghost flex-1 py-3.5">
              <Clock size={16} /> Minta Waktu Lain
            </button>
          </div>
          {later && (
            <div className="animate-pop grid grid-cols-2 gap-2 sm:grid-cols-4">
              {options.map((o) => (
                <button
                  key={o.key}
                  disabled={pending}
                  onClick={() => act(async () => { await respondTalk(talk.id, o.key); setLater(false); })}
                  className="rounded-2xl bg-sky py-2.5 text-xs font-semibold hover:bg-primary-faint"
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
