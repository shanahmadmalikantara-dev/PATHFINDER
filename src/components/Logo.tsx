// Logo PathFinder: lingkaran kompas dengan jalur berliku (dibuat ulang sebagai SVG).
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <rect width="100" height="100" rx="24" fill="#FFF4EA" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#B9D8D4" strokeWidth="5" />
      <path d="M30 66 C 38 52, 42 58, 52 46 S 64 34, 72 32" fill="none" stroke="#8C5A44" strokeWidth="6" strokeLinecap="round" />
      <circle cx="30" cy="66" r="6.5" fill="#1B6B63" />
      <circle cx="51" cy="46" r="5" fill="#3CA6A0" />
      <circle cx="72" cy="32" r="6.5" fill="#fff" stroke="#FF7A59" strokeWidth="4" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={36} className="rounded-xl shadow-sm" />
      <span className="text-lg font-bold tracking-tight">
        PathFinder <span className="text-primary">AI</span>
      </span>
    </span>
  );
}
