"use client";

import { useEffect, useState } from "react";
import { Fingerprint, KeyRound, Lock, LockOpen, MinusCircle, ShieldCheck, Trash2, X } from "lucide-react";
import { MOODS, moodInfo } from "@/lib/constants";
import {
  createVault, cryptoSupported, destroyVault, hasVault, saveVault, unlockVault,
  type JournalEntry, type OpenVault,
} from "@/lib/journal-crypto";

const SUGGESTED_TAGS = ["Akademik", "TugasSekolah", "ManajemenWaktu", "Pertemanan", "Keluarga", "MasaDepan"];

function ago(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "hari ini" : d === 1 ? "kemarin" : `${d} hari yang lalu`;
}

export default function Journal({ userId }: { userId: number }) {
  const [ready, setReady] = useState(false);
  const [exists, setExists] = useState(false);
  const [vault, setVault] = useState<OpenVault | null>(null);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // editor
  const [mood, setMood] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setExists(hasVault(userId));
    setReady(true);
  }, [userId]);

  if (!ready) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;
  if (!cryptoSupported())
    return <p className="card text-sm text-coral-700">Browser ini belum mendukung enkripsi. Buka lewat HTTPS atau gunakan Chrome/Safari terbaru.</p>;

  const doCreate = async () => {
    setErr("");
    if (!/^\d{4,6}$/.test(pin)) return setErr("PIN harus 4–6 angka.");
    if (pin !== pin2) return setErr("PIN konfirmasi tidak sama.");
    setBusy(true);
    setVault(await createVault(userId, pin));
    setExists(true);
    setPin(""); setPin2(""); setBusy(false);
  };
  const doUnlock = async () => {
    setErr(""); setBusy(true);
    try {
      setVault(await unlockVault(userId, pin));
      setPin("");
    } catch {
      setErr("PIN salah. Coba lagi ya.");
    }
    setBusy(false);
  };
  const doReset = () => {
    if (!confirm("Lupa PIN? Semua catatan jurnal di HP ini akan DIHAPUS permanen dan tidak bisa dikembalikan. Lanjutkan?")) return;
    destroyVault(userId);
    setExists(false); setVault(null); setPin("");
  };

  const save = async () => {
    if (!vault || text.trim().length < 2) return;
    setBusy(true);
    const entry: JournalEntry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), mood, text: text.trim(), tags };
    const entries = [entry, ...vault.entries];
    await saveVault(userId, vault, entries);
    setVault({ ...vault, entries });
    setText(""); setTags([]); setMood(null);
    setSaved("Tersimpan & terkunci 🔒"); setBusy(false);
    setTimeout(() => setSaved(""), 2500);
  };
  const remove = async (id: string) => {
    if (!vault || !confirm("Hapus catatan ini?")) return;
    const entries = vault.entries.filter((e) => e.id !== id);
    await saveVault(userId, vault, entries);
    setVault({ ...vault, entries });
  };
  const addTag = (t: string) => {
    const clean = t.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 20);
    if (clean && !tags.includes(clean) && tags.length < 5) setTags([...tags, clean]);
    setTagInput("");
  };

  // ======= Belum ada PIN / terkunci =======
  if (!vault) {
    return (
      <div className="card mx-auto max-w-md space-y-4 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-violet-100 text-violet">
          {exists ? <Lock size={26} /> : <KeyRound size={26} />}
        </span>
        <div>
          <h3 className="text-lg font-bold">{exists ? "Jurnal Terkunci" : "Buat PIN Jurnal Rahasia"}</h3>
          <p className="mt-1 text-sm text-muted">
            {exists
              ? "Masukkan PIN untuk membuka catatan pribadimu."
              : "PIN ini mengunci jurnalmu dengan enkripsi AES-256. Simpan baik-baik — kalau lupa, jurnal tidak bisa dibuka siapa pun (termasuk kami)."}
          </p>
        </div>
        <input
          inputMode="numeric" type="password" maxLength={6} value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && (exists ? doUnlock() : undefined)}
          placeholder="PIN 4–6 angka"
          className="input text-center text-2xl tracking-[.6em] focus:border-violet focus:ring-violet-100"
        />
        {!exists && (
          <input
            inputMode="numeric" type="password" maxLength={6} value={pin2}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
            placeholder="Ulangi PIN"
            className="input text-center text-2xl tracking-[.6em] focus:border-violet focus:ring-violet-100"
          />
        )}
        {err && <p className="text-sm font-medium text-coral-700">{err}</p>}
        <button onClick={exists ? doUnlock : doCreate} disabled={busy} className="btn w-full bg-violet py-3.5 text-white hover:brightness-110">
          {busy ? "Memproses…" : exists ? <><LockOpen size={16} /> Buka Jurnal</> : <><ShieldCheck size={16} /> Buat Jurnal Terenkripsi</>}
        </button>
        {exists && (
          <button onClick={doReset} className="text-xs font-semibold text-muted underline-offset-4 hover:underline">Lupa PIN?</button>
        )}
      </div>
    );
  }

  // ======= Terbuka =======
  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <div className="card space-y-4">
        <p className="text-sm font-bold">Bagaimana rasa harimu sekarang?</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => setMood(mood === m.value ? null : m.value)}
              className={`chip px-4 py-2 text-sm ${mood === m.value ? "bg-coral text-white shadow" : "bg-sky text-ink/80"}`}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-line bg-coral-50/30 p-4 focus-within:border-violet">
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={6} maxLength={3000}
            placeholder="Curahkan isi hatimu di sini… Minggu ini aku merasa…"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted/60"
          />
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1"><Lock size={12} /> Terenkripsi AES-256</span>
            <span>{text.trim() ? text.trim().split(/\s+/).length : 0} kata • disimpan di HP ini</span>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2 text-muted">Fokus Topik Hambatan</p>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((t) => (
              <span key={t} className="chip bg-sky text-ink">#{t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`hapus ${t}`}><X size={12} /></button>
              </span>
            ))}
            <input
              value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
              placeholder="+ Tambah topik" className="w-28 rounded-full border border-dashed border-coral/50 px-3 py-1 text-xs outline-none"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
              <button key={t} onClick={() => addTag(t)} className="text-xs text-muted hover:text-coral-700">#{t}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="flex items-center gap-1.5 text-xs text-muted"><MinusCircle size={14} /> Catatan ini tidak dapat dibaca Mode Orang Tua</span>
          <button onClick={save} disabled={busy || text.trim().length < 2} className="btn-primary">
            <Lock size={15} /> Kunci & Simpan Catatan
          </button>
        </div>
        {saved && <p className="animate-pop text-center text-sm font-semibold text-teal">{saved}</p>}
      </div>

      <div className="space-y-4">
        <div className="card">
          <p className="flex items-center gap-2 text-sm font-bold text-coral-700">🧘 PELEPASAN BEBAN</p>
          <p className="mt-2 text-lg font-semibold italic">“Menuliskan hambatanmu adalah langkah pertama mengubah kekhawatiran menjadi rencana yang jernih.”</p>
        </div>
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-bold">Riwayat Catatan <span className="chip ml-1 bg-sky text-muted">{vault.entries.length}</span></p>
            <button onClick={() => setVault(null)} className="chip bg-violet-50 text-violet"><Lock size={11} /> Kunci</button>
          </div>
          {vault.entries.length === 0 ? (
            <p className="text-sm text-muted">Belum ada catatan. Tulisan pertamamu akan muncul di sini.</p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {vault.entries.map((e) => {
                const mi = moodInfo(e.mood);
                const open = openId === e.id;
                return (
                  <li key={e.id} className="rounded-2xl bg-sky p-3">
                    <button onClick={() => setOpenId(open ? null : e.id)} className="w-full text-left">
                      <div className="flex justify-between text-xs">
                        <b>{mi ? `${mi.emoji} Mood: ${mi.label}` : "📝 Catatan"}</b>
                        <span className="text-muted">{ago(e.createdAt)}</span>
                      </div>
                      <p className={`mt-1 text-sm text-ink/80 italic ${open ? "whitespace-pre-wrap" : "line-clamp-1"}`}>“{e.text}”</p>
                    </button>
                    {open && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted">{e.tags.map((t) => `#${t}`).join(" ")}</span>
                        <button onClick={() => remove(e.id)} className="text-coral-700" aria-label="hapus"><Trash2 size={15} /></button>
                      </div>
                    )}
                    {!open && <p className="mt-1 text-[11px] font-semibold text-violet">🔒 Disembunyikan dari Mode Orang Tua</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-3 rounded-3xl bg-violet-50 p-4 text-xs">
          <Fingerprint size={28} className="shrink-0 text-violet" />
          <span><b className="block">Kunci PIN Aktif</b>Jurnal otomatis terkunci saat kamu meninggalkan halaman ini.</span>
        </div>
        <button onClick={() => setVault(null)} className="btn-ghost w-full"><Lock size={15} /> Kunci Jurnal Sekarang</button>
      </div>
    </div>
  );
}
