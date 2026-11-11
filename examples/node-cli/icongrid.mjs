// Demo de iconGrid (grilla "icono + concepto", estilo "¿Por qué…?").
// Uso: node icongrid.mjs  ->  out/icongrid.png
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { renderToString } from "@infoglitch/core";
import { registerSimpleIconsAll } from "@infoglitch/icons";

await registerSimpleIconsAll({ brandColors: true });

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const doc = {
  template: "icon-grid",
  theme: "neon-night",
  title: "¿Por qué aprender Python?",
  sections: [
    { type: "title", text: "Un lenguaje para todo", subtitle: "De scripting a IA", icon: "python" },
    {
      type: "iconGrid",
      heading: "Razones principales",
      columns: 4,
      items: [
        { icon: "python", label: "Fácil de aprender", desc: "Sintaxis clara y legible, ideal para empezar." },
        { icon: "pytorch", label: "IA y Machine Learning", desc: "El estándar para data science y modelos." },
        { icon: "flask", label: "Desarrollo web", desc: "Django y FastAPI para backends rápidos." },
        { icon: "pandas", label: "Análisis de datos", desc: "NumPy, Pandas y Matplotlib." },
      ],
    },
    {
      type: "iconGrid",
      heading: "Dónde se usa",
      columns: 5,
      items: [
        { icon: "netflix", label: "Streaming", desc: "Backends y recomendación." },
        { icon: "spotify", label: "Audio", desc: "Procesamiento de datos." },
        { icon: "google", label: "Búsqueda", desc: "Infra y ML." },
        { icon: "nasa", label: "Ciencia", desc: "Simulaciones." },
        { icon: "openai", label: "IA", desc: "Modelos y tooling." },
      ],
    },
  ],
};

const svg = renderToString(doc, { width: 1000 });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1600 } }).render().asPng();
writeFileSync(join(outDir, "icongrid.png"), png);
console.log(`✓ out/icongrid.png (${png.length} bytes)`);
