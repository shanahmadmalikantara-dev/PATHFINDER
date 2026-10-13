// Membuat gambar Open Graph (1200x630) untuk pratinjau tautan. Jalankan: node scripts/make-og.mjs
import sharp from "sharp";

const W = 1200, H = 630;
const mark = `
  <g transform="translate(110 175) scale(2.8)">
    <circle cx="50" cy="50" r="48" fill="#FFF4EA"/>
    <circle cx="50" cy="50" r="34" fill="none" stroke="#B9D8D4" stroke-width="5"/>
    <path d="M30 66 C 38 52, 42 58, 52 46 S 64 34, 72 32" fill="none" stroke="#8C5A44" stroke-width="6" stroke-linecap="round"/>
    <circle cx="30" cy="66" r="6.5" fill="#1B6B63"/>
    <circle cx="51" cy="46" r="5" fill="#3CA6A0"/>
    <circle cx="72" cy="32" r="6.5" fill="#fff" stroke="#FF7A59" stroke-width="4"/>
  </g>`;
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#134f49"/><stop offset="1" stop-color="#1b6b63"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1170" cy="30" r="170" fill="#8ee3d6" opacity="0.16"/>
  <circle cx="1060" cy="660" r="170" fill="#ff7a59" opacity="0.22"/>
  ${mark}
  <g font-family="Plus Jakarta Sans, DejaVu Sans, Arial, sans-serif" fill="#ffffff">
    <text x="440" y="250" font-size="84" font-weight="800">PathFinder <tspan fill="#ff9b80">AI</tspan></text>
    <text x="444" y="325" font-size="33" font-style="italic" fill="#d3f4ee">“Dari Mengawasi Menuju Memahami”</text>
    <text x="444" y="400" font-size="28" fill="#ebfaf7">Cegah burnout pelajar &amp; jembatani</text>
    <text x="444" y="440" font-size="28" fill="#ebfaf7">komunikasi orang tua dan remaja.</text>
    <rect x="444" y="485" width="250" height="52" rx="26" fill="#ff7a59"/>
    <text x="569" y="520" font-size="24" font-weight="700" text-anchor="middle">pathfind.my.id</text>
  </g>
</svg>`;
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og.png");
const m = await sharp("public/og.png").metadata();
console.log(`✓ public/og.png ${m.width}x${m.height}`);
