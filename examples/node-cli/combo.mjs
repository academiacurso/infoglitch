// Demo: UNA infografía que combina varios tipos de sección en orden.
// Uso: node combo.mjs  ->  out/combo.png
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
  template: "stack", // respeta el orden de las secciones, no reordena
  theme: "neon-night",
  title: "Guía express de Python",
  sections: [
    { type: "title", text: "Todo en una sola infografía", subtitle: "grid + flow + roadmap + versus", icon: "python" },

    // GRID
    {
      type: "iconGrid",
      heading: "¿Por qué Python?",
      columns: 3,
      items: [
        { icon: "python", label: "Fácil", desc: "Sintaxis clara y legible." },
        { icon: "pytorch", label: "IA/ML", desc: "El estándar para datos." },
        { icon: "flask", label: "Web", desc: "Django y FastAPI." },
      ],
    },

    // FLOW
    {
      type: "flow",
      heading: "if / else",
      items: [
        { kind: "start", label: "Inicio" },
        { kind: "decision", label: "¿edad >= 18?", branch: 'print("Menor")' },
        { kind: "process", label: 'print("Mayor")' },
        { kind: "end", label: "Fin" },
      ],
    },

    // ROADMAP
    {
      type: "roadmap",
      heading: "Ruta de aprendizaje",
      items: [
        { label: "Fundamentos", icon: "python", desc: "Base sólida.", points: ["Sintaxis", "Variables"] },
        { label: "Estructuras", icon: "database", desc: "Datos y control.", points: ["Listas", "if / for"] },
        { label: "Proyectos", icon: "rocket", desc: "Aplicá todo.", points: ["APIs", "Scraping"] },
      ],
    },

    // VERSUS
    {
      type: "versus",
      heading: "Python vs otro lenguaje",
      left: { title: "Python", icon: "python", color: "#4f8cff" },
      right: { title: "Verboso", icon: "code" },
      rows: [
        { label: "Sintaxis", left: "Limpia y corta", right: "Más larga", leftTone: "pro", rightTone: "con" },
        { label: "Aprendizaje", left: "Muy fácil", right: "Más empinada", leftTone: "pro", rightTone: "con" },
      ],
    },

    { type: "callout", text: "Una sola infografía puede mezclar todas las formas que necesites.", tone: "success" },
  ],
};

const svg = renderToString(doc, { width: 1000 });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1400 } }).render().asPng();
writeFileSync(join(outDir, "combo.png"), png);
console.log(`✓ out/combo.png (${png.length} bytes)`);
