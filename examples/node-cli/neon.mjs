// Demo de temas estilo póster (neón) + código resaltado + logos.
// Uso: node neon.mjs  ->  out/neon-night.png y out/cyber.png
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
  template: "code-callout",
  title: "Sentencias condicionales en JS",
  sections: [
    { type: "title", text: "Controlá el flujo de tu código", subtitle: "if / else / switch, con ejemplos", icon: "javascript" },
    { type: "callout", text: "Las condicionales ejecutan distintos bloques según si una condición es verdadera o falsa.", tone: "info" },
    {
      type: "codeSnippet",
      heading: "if / else",
      language: "javascript",
      code: [
        "const nota = 75;",
        "",
        "if (nota >= 60) {",
        '  console.log("Aprobado"); // 👍',
        "} else {",
        '  console.log("Reprobado");',
        "}",
      ].join("\n"),
      annotations: ["La condición devuelve true o false"],
    },
    {
      type: "comparison",
      heading: "Operadores de comparación",
      columns: [
        { title: "Igualdad", icon: "code", points: ["== igual", "=== igual y tipo", "!= distinto"] },
        { title: "Relación", icon: "zap", points: ["> mayor", "< menor", ">= / <= o igual"] },
      ],
    },
    {
      type: "stat",
      heading: "Valores falsy en JS",
      items: [
        { value: "false", label: "booleano" },
        { value: "0", label: "número cero" },
        { value: '""', label: "string vacío" },
        { value: "null", label: "nulo" },
      ],
    },
    {
      type: "list",
      heading: "Buenas prácticas",
      items: [
        { label: "Usá if/else para decisiones simples", tone: "pro" },
        { label: "Usá switch para muchos casos de un valor", tone: "pro" },
        { label: "Evitá anidar demasiados if", tone: "con" },
      ],
    },
  ],
};

for (const theme of ["neon-night", "cyber"]) {
  const svg = renderToString({ ...doc, theme }, { width: 960 });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1600 } });
  const png = resvg.render().asPng();
  writeFileSync(join(outDir, `${theme}.png`), png);
  console.log(`✓ out/${theme}.png (${png.length} bytes)`);
}
