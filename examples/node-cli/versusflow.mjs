// Demo de 'versus' (2 columnas pro/con) y 'flow' (flowchart Sí/No).
// Uso: node versusflow.mjs  ->  out/versus.png y out/flow.png
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

const versus = {
  template: "versus",
  theme: "blueprint",
  title: "WordPress vs Desarrollo a medida",
  sections: [
    { type: "title", text: "¿Cuál es la mejor opción para tu web?", subtitle: "Comparación clara para decidir", icon: "wordpress" },
    {
      type: "versus",
      left: { title: "WordPress", icon: "wordpress", color: "#2f81f7" },
      right: { title: "Desarrollo a medida", icon: "code" },
      rows: [
        { label: "Tiempo", left: "Lanzamiento rápido: días o semanas", right: "Lento: meses o más", leftTone: "pro", rightTone: "con" },
        { label: "Costo", left: "Menor inversión y mantenimiento", right: "Costo elevado", leftTone: "pro", rightTone: "con" },
        { label: "Flexibilidad", left: "Miles de plugins y temas", right: "Cada cambio requiere desarrollo", leftTone: "pro", rightTone: "con" },
        { label: "Mantenimiento", left: "Simple desde el panel", right: "Depende del desarrollador", leftTone: "pro", rightTone: "con" },
        { label: "SEO", left: "Plugins como Yoast", right: "Config manual", leftTone: "pro", rightTone: "con" },
        { label: "Control", left: "100% tuyo", right: "Puede quedar en terceros", leftTone: "pro", rightTone: "con" },
      ],
    },
    { type: "callout", text: "Para el 90% de los proyectos, WordPress es la mejor opción.", tone: "success" },
  ],
};

const flow = {
  template: "flowchart",
  theme: "neon-night",
  title: "if / else en PHP",
  sections: [
    { type: "title", text: "Flujo de una condición", subtitle: "Cómo se decide qué bloque ejecutar", icon: "php" },
    {
      type: "flow",
      heading: "Evaluación de la nota",
      items: [
        { kind: "start", label: "Inicio" },
        { kind: "process", label: "$nota = 75" },
        { kind: "decision", label: "¿$nota >= 60?", branch: 'echo "Reprobado"' },
        { kind: "process", label: 'echo "Aprobado"' },
        { kind: "end", label: "Fin" },
      ],
    },
    { type: "callout", text: "La condición devuelve true o false; la rama No sale por el lateral.", tone: "info" },
  ],
};

for (const [name, doc] of [["versus", versus], ["flow", flow]]) {
  const svg = renderToString(doc, { width: 960 });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1600 } }).render().asPng();
  writeFileSync(join(outDir, `${name}.png`), png);
  console.log(`✓ out/${name}.png (${png.length} bytes)`);
}
