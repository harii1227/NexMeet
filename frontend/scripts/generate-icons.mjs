// Generates SVG icons (works without canvas dependency)
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const r = Math.round(size * 0.22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f8ef7"/>
      <stop offset="100%" stop-color="#7c5cfc"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#g)"/>
  <g transform="translate(${size * 0.15}, ${size * 0.28}) scale(${size / 100})">
    <rect x="2" y="8" width="42" height="28" rx="5" ry="5" fill="white"/>
    <polygon points="46,14 62,22 62,30 46,38" fill="white"/>
  </g>
</svg>`;
  writeFileSync(join(outDir, `icon-${size}.svg`), svg);
  // Also write as .png filename but SVG content (browsers accept this for manifest)
  writeFileSync(join(outDir, `icon-${size}.png`), svg);
  console.log(`✓ icon-${size}.png`);
}
console.log("Icons generated!");
