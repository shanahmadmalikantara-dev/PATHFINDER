// Grafik sederhana berbasis SVG (tanpa library tambahan, ringan untuk PWA).

export function ProgressRing({
  percent,
  size = 120,
  stroke = 12,
  color = "var(--primary)",
  track = "var(--color-sky)",
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ percent, className = "", color }: { percent: number; className?: string; color?: string }) {
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-sky ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%`, background: color ?? "var(--primary)" }}
      />
    </div>
  );
}

/** Grafik area tren energi 7 hari (nilai 1–5, null = tidak check-in). */
export function EnergyChart({ series, days }: { series: (number | null)[]; days: string[] }) {
  const W = 300;
  const H = 110;
  const pad = 10;
  const step = (W - pad * 2) / Math.max(1, series.length - 1);
  const y = (v: number) => H - pad - ((v - 1) / 4) * (H - pad * 2);
  const pts = series.map((v, i) => (v === null ? null : { x: pad + i * step, y: y(v), v }));
  const valid = pts.filter((p): p is { x: number; y: number; v: number } => p !== null);

  let line = "";
  valid.forEach((p, i) => {
    if (i === 0) line = `M${p.x},${p.y}`;
    else {
      const prev = valid[i - 1];
      const cx = (prev.x + p.x) / 2;
      line += ` C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
    }
  });
  const area = valid.length > 1 ? `${line} L${valid[valid.length - 1].x},${H} L${valid[0].x},${H} Z` : "";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full overflow-visible" role="img" aria-label="Grafik tren energi 7 hari">
        <defs>
          <linearGradient id="pf-energy" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity=".28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[1, 3, 5].map((v) => (
          <line key={v} x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray="3 4" />
        ))}
        {area && <path d={area} fill="url(#pf-energy)" />}
        {valid.length > 1 && <path d={line} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />}
        {pts.map((p, i) =>
          p ? (
            <circle key={i} cx={p.x} cy={p.y} r={i === series.length - 1 ? 5 : 3.5} fill="#fff" stroke="var(--primary)" strokeWidth="2.5" />
          ) : (
            <circle key={i} cx={pad + i * step} cy={H - pad} r="2.5" fill="var(--color-line)" />
          ),
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] font-medium text-muted">
        {days.map((d, i) => (
          <span key={i} className={i === days.length - 1 ? "font-bold text-primary-strong" : ""}>
            {i === days.length - 1 ? "Hari ini" : d}
          </span>
        ))}
      </div>
    </div>
  );
}
