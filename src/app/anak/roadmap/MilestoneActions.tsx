"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { CheckCircle2, Link2, MoreHorizontal, PlayCircle, PlusCircle, Trash2, Undo2, X } from "lucide-react";
import { addMilestone, deleteMilestone, setMilestoneStatus, toggleMilestoneShared } from "@/actions/child";
import type { Milestone } from "@/lib/db";

export function MilestoneMenu({ m }: { m: Milestone }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<void>) => start(async () => { await fn(); setOpen(false); });

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className={`grid size-9 place-items-center rounded-full bg-sky ${pending ? "animate-pulse" : ""}`} aria-label="Aksi milestone">
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="animate-pop absolute right-0 z-20 mt-2 w-56 rounded-2xl bg-white p-1.5 text-sm shadow-xl ring-1 ring-line">
            {m.status !== "selesai" && (
              <Item icon={CheckCircle2} onClick={() => act(() => setMilestoneStatus(m.id, "selesai"))} className="text-teal">Tandai Selesai (+{m.xp} XP)</Item>
            )}
            {m.status === "rencana" && (
              <Item icon={PlayCircle} onClick={() => act(() => setMilestoneStatus(m.id, "berjalan"))}>Jadikan Posisi Sekarang</Item>
            )}
            {m.status !== "rencana" && (
              <Item icon={Undo2} onClick={() => act(() => setMilestoneStatus(m.id, "rencana"))}>Kembalikan ke Rencana</Item>
            )}
            <Item icon={Link2} onClick={() => act(() => toggleMilestoneShared(m.id))}>
              {m.shared ? "Jadikan Pribadi" : "Bagikan sebagai Agenda Bersama"}
            </Item>
            <Item icon={Trash2} onClick={() => confirm("Hapus milestone ini?") && act(() => deleteMilestone(m.id))} className="text-coral-700">Hapus</Item>
          </div>
        </>
      )}
    </div>
  );
}

function Item({ icon: Icon, children, onClick, className = "" }: { icon: React.ElementType; children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left font-medium hover:bg-sky ${className}`}>
      <Icon size={16} /> {children}
    </button>
  );
}

export function AddMilestoneButton({ horizon }: { horizon: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addMilestone, undefined);
  useEffect(() => { if (state?.ok) setOpen(false); }, [state]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-coral/30 bg-white/60 py-5 font-semibold text-coral-700 hover:border-coral">
        <PlusCircle size={20} /> Tambah Milestone Baru
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/30 backdrop-blur-sm sm:place-items-center" onClick={() => setOpen(false)}>
          <form action={action} onClick={(e) => e.stopPropagation()} className="animate-pop w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Milestone Baru 🗺️</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[["tahun_ini", "📅 Tahun Ini"], ["jangka_panjang", "🚩 Jangka Panjang"]].map(([v, l]) => (
                <label key={v}>
                  <input type="radio" name="horizon" value={v} defaultChecked={v === horizon} className="peer sr-only" />
                  <span className="block cursor-pointer rounded-2xl border border-line py-2.5 text-center text-sm font-semibold peer-checked:border-coral peer-checked:bg-coral-50 peer-checked:text-coral-700">{l}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="label">Judul</label>
              <input name="title" required maxLength={80} className="input" placeholder="Contoh: Ikut lomba coding tingkat nasional" />
            </div>
            <div>
              <label className="label">Deskripsi (opsional)</label>
              <textarea name="description" rows={3} maxLength={240} className="input resize-none" placeholder="Langkah apa yang perlu dilakukan?" />
            </div>
            <div>
              <label className="label">Target waktu (opsional)</label>
              <input name="target_date" maxLength={40} className="input" placeholder="Contoh: Akhir Februari" />
            </div>
            <label className="flex items-start gap-3 rounded-2xl bg-teal-50 p-3 text-sm">
              <input type="checkbox" name="shared" className="mt-1 size-4 accent-[var(--color-teal)]" />
              <span><b>Agenda Bersama</b><br /><span className="text-xs text-muted">Orang tua bisa melihat milestone ini & mendapat rekomendasi topik obrolan. Milestone lain tetap pribadi.</span></span>
            </label>
            {state?.error && <p className="text-sm font-medium text-coral-700">{state.error}</p>}
            <button disabled={pending} className="btn-primary w-full py-3.5">{pending ? "Menyimpan…" : "Simpan Milestone"}</button>
          </form>
        </div>
      )}
    </>
  );
}
