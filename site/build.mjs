// Regenera los assets del sitio: el bundle self-hosted y los SVG de la galería.
// Uso (desde la raíz del repo, tras `pnpm build`): node site/build.mjs
import { execSync } from "node:child_process";
import { cpSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString } from "@infoglitch/core";
import { registerSimpleIcons, registerDevicon } from "@infoglitch/icons";
import { fontFaceCss } from "@infoglitch/fonts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
mkdirSync(here, { recursive: true });

// 1) Bundle self-contained de @infoglitch/core (incluye zod) vía tsup.
console.log("• bundleando @infoglitch/core …");
execSync("pnpm --filter @infoglitch/core exec tsup --config tsup.standalone.config.ts", {
  cwd: root,
  stdio: "inherit",
});
cpSync(join(root, "packages/core/standalone/infoglitch-core.js"), join(here, "infoglitch-core.js"));
console.log("✓ infoglitch-core.js");

// 2) SVGs de la galería (con fuentes embebidas, se ven idénticos en cualquier lado).
registerSimpleIcons({ brandColors: true });
await registerDevicon();
const fontCss = await fontFaceCss();

const EXAMPLES = {
  versus: `template versus\ntheme blueprint\nsection title\n  text WordPress vs Desarrollo a medida\n  icon wordpress\nsection versus\n  left WordPress\n  lefticon wordpress\n  right A medida\n  righticon code\n  - label Tiempo\n    l Rápido\n    r Lento\n    ltone pro\n    rtone con\n  - label Costo\n    l Accesible\n    r Elevado\n    ltone pro\n    rtone con\nfooter Para el 90% de los proyectos, WordPress gana\nfootericon rocket`,
  flow: `template flowchart\ntheme neon-night\nsection flow\n  heading Evaluación de la nota\n  - start Inicio\n  - process $nota = 75\n  - decision ¿$nota >= 60?\n    branch echo "Reprobado"\n  - process echo "Aprobado"\n  - end Fin`,
  roadmap: `template roadmap\ntheme neon-night\nsection roadmap\n  - label Fundamentos\n    icon python\n    point Sintaxis\n    point Variables\n  - label Estructuras\n    icon database\n    point Listas\n    point Diccionarios\n  - label Proyectos\n    icon rocket\n    point APIs`,
  charts: `template stack\ntheme neon-night\nsection columns\n  ratio 1 1\n  col\n    section chart\n      chart bar\n      heading Lenguajes (%)\n      unit %\n      - label JavaScript\n        value 62\n      - label Python\n        value 51\n      - label Rust\n        value 13\n  col\n    section chart\n      chart donut\n      heading Tiempo\n      - label Código\n        value 55\n      - label Reuniones\n        value 25\n      - label Testing\n        value 20`,
  icongrid: `template icon-grid\ntheme cyber\nsection iconGrid\n  heading Tecnologías\n  columns 4\n  - icon python\n    label Python\n  - icon react\n    label React\n  - icon docker\n    label Docker\n  - icon postgresql\n    label PostgreSQL\n  - icon rust\n    label Rust\n  - icon go\n    label Go\n  - icon redis\n    label Redis\n  - icon kubernetes\n    label Kubernetes`,
  code: `template stack\ntheme neon-night\nsection columns\n  ratio 1 1\n  col\n    section codeSnippet\n      heading if / else\n      language javascript\n      code const nota = 75;\n      code if (nota >= 60) {\n      code   console.log("Aprobado");\n      code } else {\n      code   console.log("Reprobado");\n      code }\n  col\n    section list\n      heading Buenas prácticas\n      - label if/else para decisiones simples\n        tone pro\n      - label Evitá anidar demasiado\n        tone con`,
};

for (const [name, dsl] of Object.entries(EXAMPLES)) {
  writeFileSync(join(here, `ex-${name}.svg`), renderToString(dsl, { width: 900, fontCss }), "utf8");
  console.log(`✓ ex-${name}.svg`);
}
console.log("Listo. Serví site/ por HTTP (npx serve site) o deployalo.");
