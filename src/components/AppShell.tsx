"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Home, Lock, MessagesSquare, Route, Smile, User, Settings, ShieldCheck, X } from "lucide-react";
import { Logo, LogoMark } from "./Logo";

type Role = "child" | "parent";

const NAV: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  child: [
    { href: "/anak", label: "Beranda", icon: Home },
    { href: "/anak/checkin", label: "Check-In", icon: Smile },
    { href: "/anak/roadmap", label: "Roadmap", icon: Route },
    { href: "/anak/bicara", label: "Bicara", icon: MessagesSquare },
    { href: "/anak/profil", label: "Profil", icon: User },
  ],
  parent: [
    { href: "/ortu", label: "Beranda", icon: Home },
    { href: "/ortu/roadmap", label: "Roadmap", icon: Route },
    { href: "/ortu/bicara", label: "Bicara", icon: MessagesSquare },
    { href: "/ortu/profil", label: "Profil", icon: Settings },
  ],
};

export interface Notice {
  text: string;
  href: string;
  /** true = kabar penting yang memunculkan pop-up + getar saat baru datang */
  alert?: boolean;
}

export default function AppShell({
  role,
  name,
  subtitle,
  notices,
  children,
}: {
  role: Role;
  name: string;
  subtitle: string;
  notices: Notice[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const nav = NAV[role];
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Notice | null>(null);
  const seen = useRef<Set<string> | null>(null);

  // Munculkan pop-up saat ada kabar penting BARU (misal: anak siap berdiskusi)
  useEffect(() => {
    const alerts = notices.filter((n) => n.alert);
    if (seen.current === null) {
      seen.current = new Set(alerts.map((n) => n.text));
      return;
    }
    const fresh = alerts.find((n) => !seen.current!.has(n.text));
    alerts.forEach((n) => seen.current!.add(n.text));
    if (!fresh) return;
    setToast(fresh);
    // Browser hanya mengizinkan getar setelah pengguna pernah menyentuh layar
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([120, 60, 120]);
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [notices]);

  const isActive = (href: string) => (href === nav[0].href ? pathname === href : pathname.startsWith(href));

  return (
    <div data-role={role} className="min-h-dvh">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white px-5 py-6 lg:flex">
        <Link href={nav[0].href}>
          <Logo />
        </Link>
        <div className="mt-6 flex items-center gap-2 rounded-full bg-primary-faint p-1.5 text-xs font-semibold">
          <span className="flex-1 rounded-full bg-primary px-3 py-2 text-center text-white shadow">
            {role === "child" ? "Mode Anak" : "Mode Orang Tua"}
          </span>
          <span className="flex items-center gap-1 px-2 text-primary-strong" title="Mode dikunci per akun demi privasi">
            <Lock size={12} /> Terkunci
          </span>
        </div>
        <nav className="mt-6 flex flex-col gap-1.5">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition ${
                isActive(href)
                  ? role === "parent"
                    ? "bg-primary text-white shadow-md"
                    : "bg-primary-soft text-ink"
                  : "text-ink/80 hover:bg-sky"
              }`}
            >
              <Icon size={19} /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-sky p-3.5">
          <span className="grid size-9 place-items-center rounded-full bg-violet-100 text-violet">
            <Lock size={16} />
          </span>
          <div className="text-xs leading-tight">
            <p className="font-bold">Privasi Aman</p>
            <p className="text-muted">{role === "child" ? "Jurnal hanya di HP-mu" : "Batas privasi anak aktif"}</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
      {/* ===== Topbar ===== */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <LogoMark size={34} className="rounded-xl shadow-sm lg:hidden" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-bold">
              {role === "child" ? "PathFinder Portal" : (
                <span className="chip bg-primary-soft text-primary-strong">Orang Tua • Ruang Dampingan</span>
              )}
            </p>
            {role === "child" && <p className="truncate text-xs text-muted">Panduan Cerdas & Ruang Refleksi</p>}
          </div>
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative grid size-10 place-items-center rounded-full hover:bg-white"
              aria-label="Notifikasi"
            >
              <Bell size={20} />
              {notices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-coral text-[10px] font-bold text-white">
                  {notices.length}
                </span>
              )}
            </button>
            {open && (
              <div className="animate-pop absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-line">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-sm font-bold">Notifikasi</p>
                  <button onClick={() => setOpen(false)} aria-label="Tutup">
                    <X size={16} />
                  </button>
                </div>
                {notices.length === 0 ? (
                  <p className="px-3 pb-3 text-sm text-muted">Belum ada kabar baru. Semua tenang 🌿</p>
                ) : (
                  notices.map((n, i) => (
                    <Link
                      key={i}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm hover:bg-sky"
                    >
                      {n.text}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          <Link href={nav[nav.length - 1].href} className="flex items-center gap-2.5">
            <span className="relative grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-white">
              {name.slice(0, 1).toUpperCase()}
              <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-teal" />
            </span>
            <span className="hidden text-xs leading-tight sm:block">
              <span className="block font-bold">{name}</span>
              <span className="text-muted">{subtitle}</span>
            </span>
          </Link>
        </div>
      </header>

      {/* ===== Konten ===== */}
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* ===== Pop-up kabar penting ===== */}
      {toast && (
        <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
          <Link
            href={toast.href}
            onClick={() => setToast(null)}
            className="animate-pop flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-sm font-medium text-white shadow-2xl"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary">
              <Bell size={17} />
            </span>
            <span className="flex-1">{toast.text}</span>
            <span className="text-xs font-bold text-primary-soft">Buka →</span>
          </Link>
        </div>
      )}

      {/* ===== Bottom nav (HP) ===== */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md justify-around px-2 pt-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-0.5 py-1">
                <span
                  className={`grid h-8 w-12 place-items-center rounded-full transition ${
                    active ? "bg-primary text-white" : "text-muted"
                  }`}
                >
                  <Icon size={19} />
                </span>
                <span className={`text-[11px] font-semibold ${active ? "text-primary-strong" : "text-muted"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PrivacyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs text-violet">
      <ShieldCheck size={14} className="mt-0.5 shrink-0" /> <span>{children}</span>
    </p>
  );
}
