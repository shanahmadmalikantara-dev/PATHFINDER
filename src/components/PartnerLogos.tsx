// Deretan logo penyelenggara & pendukung lomba.
// Ganti/tambah logo cukup di daftar ini; file gambarnya ada di public/logos/.
// `h` = tinggi tampilan (px). Logo yang lebar dibuat lebih pendek agar
// kelimanya terlihat seimbang.
const LOGOS = [
  { src: "/logos/innovation-competition-2026.webp", alt: "Jagoan Hosting Innovation Competition 2026", w: 300, h: 44 },
  { src: "/logos/jagoan-hosting.webp", alt: "Jagoan Hosting", w: 542, h: 30 },
  { src: "/logos/komdigi.webp", alt: "KOMDIGI", w: 228, h: 40 },
  { src: "/logos/garuda-spark.webp", alt: "Garuda Spark Innovation Hub", w: 306, h: 38 },
  { src: "/logos/ngalup.webp", alt: "Ngalup.co", w: 1010, h: 20 },
];

export default function PartnerLogos({ className = "" }: { className?: string }) {
  return (
    <section aria-label="Didukung oleh" className={`text-center ${className}`}>
      <p className="eyebrow mb-4 text-muted">Didukung oleh</p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 sm:gap-x-10">
        {LOGOS.map((l) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={l.src}
            src={l.src}
            alt={l.alt}
            loading="lazy"
            decoding="async"
            width={Math.round((l.w / 160) * l.h)}
            height={l.h}
            style={{ height: l.h }}
            className="w-auto max-w-[45%] object-contain sm:max-w-none"
          />
        ))}
      </div>
    </section>
  );
}
