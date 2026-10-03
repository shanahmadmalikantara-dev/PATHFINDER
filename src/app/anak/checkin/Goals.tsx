"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Minus, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { addGoal, changeGoal, deleteGoal } from "@/actions/child";
import { GOAL_CATEGORIES, goalCategory } from "@/lib/constants";
import type { Goal } from "@/lib/db";
import { ProgressBar } from "@/components/Charts";

const TONE: Record<string, { bg: string; text: string; bar: string }> = {
  belajar: { bg: "bg-coral-100", text: "text-coral-700", bar: "var(--color-coral)" },
  kebugaran: { bg: "bg-teal-100", text: "text-teal", bar: "var(--color-teal)" },
  minat: { bg: "bg-violet-100", text: "text-violet", bar: "var(--color-violet)" },
  kebiasaan: { bg: "bg-amber/20", text: "text-amber", bar: "var(--color-amber)" },
};

export default function Goals({ goals }: { goals: Goal[] }) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Fokus Utama Minggu Ini</h2>
          <p className="text-sm text-muted">Disesuaikan secara mandiri tanpa tekanan eksternal</p>
        </div>
        <div className="flex gap-2">
          {goals.length > 0 && (
            <button onClick={() => setEditing((v) => !v)} className={`chip px-3 py-2 ${editing ? "bg-coral text-white" : "bg-white text-coral-700"}`}>
              <SlidersHorizontal size={14} /> {editing ? "Selesai" : "Sesuaikan Target"}
            </button>
          )}
          <button onClick={() => setAdding(true)} className="chip bg-white px-3 py-2 text-coral-700"><Plus size={14} /> Tambah</button>
        </div>
      </div>

      {goals.length === 0 && !adding && (
        <button onClick={() => setAdding(true)} className="card w-full border-2 border-dashed border-coral/30 text-center text-muted hover:border-coral">
          <span className="text-3xl">🎯</span>
          <p className="mt-2 font-semibold text-ink">Buat target pertamamu minggu ini</p>
          <p className="text-sm">Contoh: Belajar UTBK 6 jam, jogging 3 sesi, 2 modul coding</p>
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g) => <GoalCard key={g.id} g={g} editing={editing} />)}
      </div>

      {adding && <AddGoal onClose={() => setAdding(false)} />}
    </section>
  );
}

function GoalCard({ g, editing }: { g: Goal; editing: boolean }) {
  const [pending, start] = useTransition();
  const cat = goalCategory(g.category);
  const tone = TONE[g.category] ?? TONE.belajar;
  const pct = Math.round((g.progress / g.target) * 100);
  const run = (fn: () => Promise<void>) => start(fn);

  return (
    <div className={`card flex flex-col gap-4 transition ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between">
        <span className={`grid size-12 place-items-center rounded-2xl text-2xl ${tone.bg}`}>{cat.emoji}</span>
        {editing ? (
          <button onClick={() => confirm(`Hapus target "${g.title}"?`) && run(() => deleteGoal(g.id))} className="grid size-9 place-items-center rounded-full bg-coral-50 text-coral-700" aria-label="Hapus target">
            <Trash2 size={16} />
          </button>
        ) : (
          <span className={`chip ${tone.bg} ${tone.text}`}>{pct >= 100 ? "Selesai ✓" : `${pct}% Selesai`}</span>
        )}
      </div>
      <div>
        <p className="text-lg font-bold">{g.title}</p>
        {g.detail && <p className="text-sm text-muted">{g.detail}</p>}
      </div>
      {editing && (
        <div className="flex items-center justify-between rounded-2xl bg-sky px-4 py-2.5 text-sm">
          <span className="font-semibold text-muted">Target Mingguan</span>
          <span className="flex items-center gap-2">
            <Step onClick={() => run(() => changeGoal(g.id, "target", -1))} icon={Minus} label="kurangi target" />
            <b className="min-w-16 text-center">{g.target} {g.unit}</b>
            <Step onClick={() => run(() => changeGoal(g.id, "target", 1))} icon={Plus} label="tambah target" />
          </span>
        </div>
      )}
      <div className="mt-auto">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="font-semibold">{g.progress} / {g.target} {g.unit}</span>
          <span className={`font-bold ${tone.text}`}>{pct}%</span>
        </div>
        <ProgressBar percent={pct} color={tone.bar} />
        <div className="mt-3 flex gap-2">
          <button onClick={() => run(() => changeGoal(g.id, "progress", -1))} disabled={g.progress <= 0} className="btn-ghost flex-none px-3 py-2" aria-label="kurangi progres">
            <Minus size={16} />
          </button>
          <button onClick={() => run(() => changeGoal(g.id, "progress", 1))} disabled={g.progress >= g.target} className={`btn flex-1 py-2 ${tone.bg} ${tone.text}`}>
            <Plus size={16} /> {g.progress >= g.target ? "Tercapai! 🎉" : `Catat 1 ${g.unit}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ onClick, icon: Icon, label }: { onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="grid size-7 place-items-center rounded-full bg-white shadow-sm">
      <Icon size={14} />
    </button>
  );
}

function AddGoal({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(addGoal, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/30 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <form ref={ref} action={action} onClick={(e) => e.stopPropagation()} className="animate-pop w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Target Baru 🎯</h3>
          <button type="button" onClick={onClose} aria-label="Tutup"><X size={20} /></button>
        </div>
        <div>
          <label className="label">Kategori</label>
          <div className="grid grid-cols-2 gap-2">
            {GOAL_CATEGORIES.map((c, i) => (
              <label key={c.value}>
                <input type="radio" name="category" value={c.value} defaultChecked={i === 0} className="peer sr-only" />
                <span className="block cursor-pointer rounded-2xl border border-line py-2.5 text-center text-sm font-semibold peer-checked:border-coral peer-checked:bg-coral-50 peer-checked:text-coral-700">
                  {c.emoji} {c.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Nama target</label>
          <input name="title" required maxLength={60} className="input" placeholder="Contoh: Belajar UTBK & Sekolah" />
        </div>
        <div>
          <label className="label">Detail (opsional)</label>
          <input name="detail" maxLength={80} className="input" placeholder="Contoh: Fokus Kimia & Literasi Inggris" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Jumlah</label>
            <input name="target" type="number" min={1} max={99} defaultValue={3} className="input" />
          </div>
          <div>
            <label className="label">Satuan</label>
            <input name="unit" list="units" defaultValue="sesi" maxLength={12} className="input" />
            <datalist id="units">
              <option value="jam" /><option value="sesi" /><option value="modul" /><option value="bab" /><option value="kali" /><option value="hari" />
            </datalist>
          </div>
        </div>
        {state?.error && <p className="text-sm font-medium text-coral-700">{state.error}</p>}
        <button disabled={pending} className="btn-primary w-full py-3.5">{pending ? "Menyimpan…" : "Simpan Target"}</button>
      </form>
    </div>
  );
}
