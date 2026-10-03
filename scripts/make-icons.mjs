// Membuat ikon PWA (PNG) dari logo SVG. Jalankan: node scripts/make-icons.mjs
import sharp from "sharp";
import fs from "node:fs";

const mark = (bg, rx, scale = 1) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${rx}" fill="${bg}"/>
  <g transform="translate(${50 - 50 * scale} ${50 - 50 * scale}) scale(${scale})">
    <circle cx="50" cy="50" r="34" fill="none" stroke="#B9D8D4" stroke-width="5"/>
    <path d="M30 66 C 38 52, 42 58, 52 46 S 64 34, 72 32" fill="none" stroke="#8C5A44" stroke-width="6" stroke-linecap="round"/>
    <circle cx="30" cy="66" r="6.5" fill="#1B6B63"/>
    <circle cx="51" cy="46" r="5" fill="#3CA6A0"/>
    <circle cx="72" cy="32" r="6.5" fill="#fff" stroke="#FF7A59" stroke-width="4"/>
  </g>
</svg>`;

fs.mkdirSync("public/icons", { recursive: true });
const out = [
  ["icon-192.png", 192, mark("#FFF4EA", 22)],
  ["icon-512.png", 512, mark("#FFF4EA", 22)],
  ["maskable-512.png", 512, mark("#FFF4EA", 0, 0.78)],
  ["apple-touch-icon.png", 180, mark("#FFF4EA", 0, 0.9)],
  ["favicon-32.png", 32, mark("#FFF4EA", 22)],
];
for (const [name, size, svg] of out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/${name}`);
  console.log("✓", name);
}
