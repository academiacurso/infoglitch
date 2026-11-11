// Genera docs/index.html: landing + galería de ejemplos (SVG inline, fuentes embebidas).
// Uso: node build-docs.mjs  ->  ../../docs/index.html
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "@infoglitch/core";
import { registerSimpleIcons, registerDevicon } from "@infoglitch/icons";
import { fontFaceCss } from "@infoglitch/fonts";

registerSimpleIcons({ brandColors: true });
await registerDevicon();
const fontCss = await fontFaceCss();

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "..", "docs");
mkdirSync(outDir, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Cada ejemplo es DSL (así la galería también enseña la sintaxis).
const EXAMPLES = [
  {
    title: "Versus — WordPress vs Medida",
    dsl: `template versus
theme blueprint
title WordPress vs Desarrollo a medida
section title
  text ¿Cuál conviene?
  icon wordpress
section versus
  left WordPress
  lefticon wordpress
  right A medida
  righticon code
  - label Tiempo
    l Rápido
    r Lento
    ltone pro
    rtone con
  - label Costo
    l Accesible
    r Elevado
    ltone pro
    rtone con
footer Para el 90% de los casos, WordPress gana
footericon rocket`,
  },
  {
    title: "Flowchart — if / else",
    dsl: `template flowchart
theme neon-night
title Condicionales
section flow
  heading Evaluación
  - start Inicio
  - decision ¿edad >= 18?
    branch Menor
  - process Mayor
  - end Fin`,
  },
  {
    title: "Roadmap serpenteante",
    dsl: `template roadmap
theme neon-night
title Roadmap Python
section roadmap
  - label Fundamentos
    icon python
    point Sintaxis
    point Variables
  - label Estructuras
    icon database
    point Listas
    point Dicts
  - label Proyectos
    icon rocket
    point APIs
    point Scraping`,
  },
  {
    title: "Charts — barras + dona + líneas",
    dsl: `template stack
theme neon-night
title Datos
section columns
  ratio 1 1
  col
    section chart
      chart bar
      heading Lenguajes (%)
      unit %
      - label JS
        value 62
      - label Python
        value 51
      - label Rust
        value 13
  col
    section chart
      chart donut
      heading Tiempo
      - label Código
        value 50
      - label Reuniones
        value 20
      - label Testing
        value 30`,
  },
  {
    title: "Grid de conceptos + logos a color",
    dsl: `template icon-grid
theme cyber
title Stack
section iconGrid
  heading Tecnologías
  columns 4
  - icon python
    label Python
    desc Backend e IA
  - icon react
    label React
    desc UI
  - icon docker
    label Docker
    desc Contenedores
  - icon postgresql
    label PostgreSQL
    desc Datos`,
  },
  {
    title: "Código con highlighting + notas",
    dsl: `template code-callout
theme glitch
title if / else en JS
section codeSnippet
  heading Ejemplo
  language javascript
  code const nota = 75;
  code if (nota >= 60) {
  code   console.log("Aprobado");
  code } else {
  code   console.log("Reprobado");
  code }
section list
  heading Tips
  - label Usá if/else para decisiones simples
    tone pro
  - label Evitá anidar demasiado
    tone con`,
  },
];

const cards = EXAMPLES.map((ex) => {
  const svg = renderToString(ex.dsl, { width: 720 });
  return `<article class="card">
    <h3>${esc(ex.title)}</h3>
    <div class="art">${svg}</div>
    <details><summary>Ver DSL</summary><pre><code>${esc(ex.dsl)}</code></pre></details>
  </article>`;
}).join("\n");

const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>infoglitch — galería</title>
<style>
${fontCss}
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#070a12;color:#eaf2ff;font-family:'Inter',system-ui,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:40px 20px}
header h1{font-size:40px;margin:0 0 6px;background:linear-gradient(90deg,#4f8cff,#c792ea);-webkit-background-clip:text;background-clip:text;color:transparent}
header p{color:#8ea0c0;font-size:18px;margin:0 0 18px}
code,pre{font-family:'JetBrains Mono',ui-monospace,monospace}
.install{background:#0e1420;border:1px solid #1e2a44;border-radius:10px;padding:12px 16px;display:inline-block;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;margin-top:28px}
.card{background:#0e1420;border:1px solid #1e2a44;border-radius:14px;padding:16px;overflow:hidden}
.card h3{margin:0 0 10px;font-size:16px}
.art svg{width:100%;height:auto;border-radius:8px;display:block}
details{margin-top:10px}
summary{cursor:pointer;color:#8ea0c0;font-size:13px}
pre{background:#060810;border:1px solid #1e2a44;border-radius:8px;padding:10px;overflow:auto;font-size:12px;max-height:280px}
footer{margin-top:40px;color:#8ea0c0;font-size:13px;border-top:1px solid #1e2a44;padding-top:20px}
a{color:#4f8cff}
</style></head>
<body><div class="wrap">
<header>
  <h1>infoglitch</h1>
  <p>Framework para infografías de programación, con IA opcional. SVG nativo, temas neón, charts, logos.</p>
  <span class="install">npm i @infoglitch/core</span>
</header>
<section class="grid">
${cards}
</section>
<footer>
  Generado con infoglitch. Tipos de sección: title, steps, comparison, stat, codeSnippet, architecture,
  timeline, list, callout, versus, flow, roadmap, iconGrid, chart, columns. Temas: dark-terminal,
  light-docs, glitch, neon-night, blueprint, cyber. · Licencia MIT.
</footer>
</div></body></html>`;

writeFileSync(join(outDir, "index.html"), html, "utf8");
console.log(`✓ docs/index.html (${html.length} bytes, ${EXAMPLES.length} ejemplos)`);
