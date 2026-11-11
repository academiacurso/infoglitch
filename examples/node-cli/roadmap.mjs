// Demo del roadmap serpenteante (estilo "ruta para aprender Python").
// Uso: node roadmap.mjs  ->  out/roadmap.png
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { renderToString } from "@infoglitch/core";
import { registerSimpleIcons } from "@infoglitch/icons";

registerSimpleIcons({ brandColors: true });

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const doc = {
  template: "roadmap",
  theme: "neon-night",
  title: "Roadmap para aprender Python",
  sections: [
    { type: "title", text: "Tu ruta paso a paso", subtitle: "De cero a desarrollador Python", icon: "python" },
    {
      type: "roadmap",
      items: [
        { label: "Fundamentos", icon: "python", desc: "Construí una base sólida.", points: ["Sintaxis básica", "Variables y tipos", "Operadores", "Entrada/salida"] },
        { label: "Estructuras de control", icon: "branch", desc: "Decisiones y repetición.", points: ["if / elif / else", "for, while", "break, continue"] },
        { label: "Estructuras de datos", icon: "database", desc: "Almacená y organizá datos.", points: ["Listas y tuplas", "Sets y diccionarios", "Comprensiones"] },
        { label: "Funciones", icon: "code", desc: "Código reutilizable y limpio.", points: ["Parámetros y *args", "Valores por defecto", "Scope"] },
        { label: "Manejo de errores", icon: "bug", desc: "Anticipá y manejá fallos.", points: ["try / except / finally", "Excepciones propias", "Debugging"] },
        { label: "POO", icon: "layers", desc: "Clases y objetos.", points: ["Herencia", "Polimorfismo", "Encapsulamiento"] },
        { label: "Módulos y librerías", icon: "package", desc: "Potenciá tu código.", points: ["pip y venv", "NumPy, Pandas", "Matplotlib"] },
        { label: "Proyectos reales", icon: "rocket", desc: "Aplicá todo lo aprendido.", points: ["Web scraping", "Análisis de datos", "APIs"] },
      ],
    },
  ],
};

const svg = renderToString(doc, { width: 960 });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1500 } }).render().asPng();
writeFileSync(join(outDir, "roadmap.png"), png);
console.log(`✓ out/roadmap.png (${png.length} bytes)`);
