"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Bot, RotateCcw, Send, ShieldCheck } from "lucide-react";
import { askKopilot } from "@/actions/child";
import RichText from "@/components/RichText";

type Msg = { role: "user" | "model"; text: string };

const INTRO = {
  bicara: (n: string) =>
    `Hai ${n}, aku Kopilot, teman latihan ngobrolmu.\n\nAda hal yang pengen kamu sampaikan ke orang tua tapi bingung mulainya? Ceritain aja topiknya, nanti kita susun kalimatnya bareng.`,
  rencana: (n: string) =>
    `Hai ${n}, aku bantu susun rencana belajar yang realistis ya.\n\nTarget apa yang lagi pengen kamu kejar? Kalau mau rencana lengkap dari impian besar, coba juga fitur **Rancang dengan AI** di halaman Roadmap.`,
};
const SUGGEST = {
  bicara: ["Aku mau minta jam main HP ditambah", "Aku pengen ambil jurusan yang beda dari harapan ortu", "Aku capek les terus tiap hari"],
  rencana: ["Aku mau nilai matematika naik", "Bantu atur jadwal belajar UTBK", "Aku mau belajar coding dari nol"],
};

const storeKey = (mode: string) => `pf_kopilot_${mode}`;

export default function Chat({ mode, name, ai }: { mode: "bicara" | "rencana"; name: string; ai: boolean }) {
  const intro: Msg = { role: "model", text: INTRO[mode](name) };
  const [msgs, setMsgs] = useState<Msg[]>([intro]);
  const [source, setSource] = useState<"gemini" | "simulasi" | null>(null);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  // Pulihkan percakapan selama tab masih terbuka (hilang saat tab ditutup).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storeKey(mode)) ?? "null");
      if (Array.isArray(saved) && saved.length > 1) setMsgs(saved);
    } catch {}
  }, [mode]);
  useEffect(() => {
    try {
      sessionStorage.setItem(storeKey(mode), JSON.stringify(msgs.slice(-30)));
    } catch {}
  }, [msgs, mode]);
  // Pakai kurung kurawal: di Chrome terbaru scrollIntoView() mengembalikan Promise, dan React
  // akan mencoba memanggil nilai balik useEffect sebagai fungsi cleanup (crash "u is not a function").
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, pending]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || pending) return;
    const next: Msg[] = [...msgs, { role: "user", text: t }];
    setMsgs(next);
    setInput("");
    start(async () => {
      try {
        // Pesan pembuka (dari model) tidak dikirim agar riwayat diawali pesan user
        const r = await askKopilot(mode, next.slice(1));
        setSource(r.source);
        setMsgs((m) => [...m, { role: "model", text: r.text }]);
      } catch {
        setMsgs((m) => [...m, { role: "model", text: "Maaf, koneksiku lagi terputus. Coba kirim ulang pesanmu sebentar lagi ya." }]);
      }
    });
  };

  const reset = () => {
    setMsgs([intro]);
    setSource(null);
  };

  const label = source === "gemini" || (source === null && ai) ? "Didukung Gemini AI" : "Mode AI simulasi";

  return (
    <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-3xl flex-col lg:h-[calc(100dvh-7rem)]">
      <div className="flex items-center gap-3 pb-4">
        <Link href={mode === "rencana" ? "/anak/roadmap" : "/anak/bicara"} className="grid size-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Kembali"><ArrowLeft size={18} /></Link>
        <span className="grid size-11 place-items-center rounded-2xl bg-violet text-white"><Bot size={22} /></span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-bold">{mode === "bicara" ? "Kopilot AI Bicara" : "Kopilot Rencana Belajar"}</p>
          <p className="text-xs text-muted">{label} · Tidak disimpan di server</p>
        </div>
        {msgs.length > 1 && (
          <button onClick={reset} disabled={pending} className="btn-ghost px-3 py-2 text-xs" aria-label="Mulai ulang percakapan">
            <RotateCcw size={14} /> <span className="hidden sm:inline">Mulai ulang</span>
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-white p-4 shadow-inner sm:p-6">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "user" ? (
              <p className="max-w-[85%] rounded-3xl rounded-br-md bg-coral px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-white">{m.text}</p>
            ) : (
              <RichText text={m.text} className="max-w-[85%] rounded-3xl rounded-bl-md bg-violet-50 px-4 py-3 text-[15px] leading-relaxed text-ink" />
            )}
          </div>
        ))}
        {pending && <p className="w-fit animate-pulse rounded-3xl bg-violet-50 px-4 py-3 text-sm text-violet">Kopilot sedang mengetik…</p>}
        {msgs.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGEST[mode].map((s) => (
              <button key={s} onClick={() => send(s)} className="chip bg-sky px-3 py-2 text-left text-sm whitespace-normal text-ink/80 hover:bg-violet-50">{s}</button>
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} className="input rounded-full" placeholder="Ketik pesanmu…" />
        <button disabled={pending || !input.trim()} className="btn-primary aspect-square w-12 px-0" aria-label="Kirim"><Send size={18} /></button>
      </form>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <ShieldCheck size={12} className="shrink-0" /> Kopilot bukan psikolog. Jika kamu merasa tidak aman, hubungi orang dewasa tepercaya atau SEJIWA 119 ext 8.
      </p>
    </div>
  );
}
