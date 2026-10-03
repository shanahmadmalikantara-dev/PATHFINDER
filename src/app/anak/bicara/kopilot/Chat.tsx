"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Bot, Send, ShieldCheck } from "lucide-react";
import { askKopilot } from "@/actions/child";

type Msg = { role: "user" | "model"; text: string };

const INTRO = {
  bicara: (n: string) => `Hai ${n}! 👋 Aku Kopilot, teman latihan ngobrolmu. Ada hal yang pengen kamu sampaikan ke orang tua tapi bingung mulainya? Ceritain aja topiknya, kita latihan bareng.`,
  rencana: (n: string) => `Hai ${n}! 🗺️ Aku bantu susun rencana belajar yang realistis ya. Target apa yang lagi pengen kamu kejar?`,
};
const SUGGEST = {
  bicara: ["Aku mau minta jam main HP ditambah", "Aku pengen ambil jurusan yang beda dari harapan ortu", "Aku capek les terus tiap hari"],
  rencana: ["Aku mau nilai matematika naik", "Bantu atur jadwal belajar UTBK", "Aku mau belajar coding dari nol"],
};

export default function Chat({ mode, name, ai }: { mode: "bicara" | "rencana"; name: string; ai: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "model", text: INTRO[mode](name) }]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, pending]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || pending) return;
    const next: Msg[] = [...msgs, { role: "user", text: t }];
    setMsgs(next);
    setInput("");
    start(async () => {
      // Pesan pembuka (dari model) tidak dikirim agar riwayat diawali pesan user
      const r = await askKopilot(mode, next.slice(1));
      setMsgs((m) => [...m, { role: "model", text: r.text }]);
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-3xl flex-col lg:h-[calc(100dvh-7rem)]">
      <div className="flex items-center gap-3 pb-4">
        <Link href={mode === "rencana" ? "/anak/roadmap" : "/anak/bicara"} className="grid size-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Kembali"><ArrowLeft size={18} /></Link>
        <span className="grid size-11 place-items-center rounded-2xl bg-violet text-white"><Bot size={22} /></span>
        <div className="flex-1 leading-tight">
          <p className="font-bold">{mode === "bicara" ? "Kopilot AI Bicara" : "Kopilot Rencana Belajar"}</p>
          <p className="text-xs text-muted">{ai ? "Didukung Gemini AI" : "Mode AI simulasi"} • Percakapan tidak disimpan</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-3xl bg-white p-4 shadow-inner sm:p-6">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "rounded-br-md bg-coral text-white" : "rounded-bl-md bg-violet-50 text-ink"}`}>
              {m.text}
            </p>
          </div>
        ))}
        {pending && <p className="w-fit animate-pulse rounded-3xl bg-violet-50 px-4 py-3 text-sm text-violet">Kopilot sedang mengetik…</p>}
        {msgs.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGEST[mode].map((s) => (
              <button key={s} onClick={() => send(s)} className="chip bg-sky px-3 py-2 text-left text-sm text-ink/80 hover:bg-violet-50">{s}</button>
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={1000} className="input rounded-full" placeholder="Ketik pesanmu…" />
        <button disabled={pending || !input.trim()} className="btn-primary aspect-square px-0 w-12" aria-label="Kirim"><Send size={18} /></button>
      </form>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <ShieldCheck size={12} /> Kopilot bukan psikolog. Jika kamu merasa tidak aman, hubungi orang dewasa tepercaya atau SEJIWA 119 ext 8.
      </p>
    </div>
  );
}
