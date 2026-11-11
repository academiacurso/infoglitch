// Generador: descarga woff2 (subset latino, OFL) y los inlinea en src/fonts-data.ts
// Uso: node scripts/gen-fonts.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const SPECS = [
  { family: "Inter", pkg: "inter", slug: "inter", weights: [400, 600, 700, 800] },
  { family: "JetBrains Mono", pkg: "jetbrains-mono", slug: "jetbrains-mono", weights: [400, 700] },
];

const entries = [];
for (const spec of SPECS) {
  for (const w of spec.weights) {
    const url = `https://cdn.jsdelivr.net/npm/@fontsource/${spec.pkg}@5/files/${spec.slug}-latin-${w}-normal.woff2`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`FALLÓ ${url} -> ${res.status}`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    entries.push({ family: spec.family, weight: w, woff2: buf.toString("base64") });
    console.log(`✓ ${spec.family} ${w} (${buf.length} bytes)`);
  }
}

const out =
  `// AUTO-GENERADO por scripts/gen-fonts.mjs — no editar a mano.\n` +
  `// Inter y JetBrains Mono — SIL Open Font License 1.1 (ver fonts/OFL.txt).\n` +
  `export interface FontEntry { family: string; weight: number; woff2: string; }\n` +
  `export const FONTS: FontEntry[] = ${JSON.stringify(entries)};\n`;

writeFileSync(join(here, "..", "src", "fonts-data.ts"), out, "utf8");
console.log(`✓ fonts-data.ts: ${entries.length} fuentes`);
