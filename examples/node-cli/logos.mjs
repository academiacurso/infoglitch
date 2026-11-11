// Demo de logos de lenguajes/herramientas (Simple Icons) + export a PNG/PDF.
// Uso: node logos.mjs  ->  out/stack.png y out/stack.pdf
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { renderToString } from "@infoglitch/core";
import { registerSimpleIcons } from "@infoglitch/icons";
import { buildPdf, deflate, parseSvgSize, rgbaToRgb } from "@infoglitch/export";

// Registrar los logos con color de marca.
registerSimpleIcons({ brandColors: true });

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const doc = {
  template: "feature-list",
  theme: "light-docs",
  title: "Stack moderno de una app web",
  sections: [
    { type: "title", text: "Del lenguaje al deploy", subtitle: "Logos reales via Simple Icons (CC0)", icon: "rust" },
    {
      type: "steps",
      heading: "Toolchain",
      items: [
        { label: "TypeScript", desc: "Tipado estático", icon: "typescript" },
        { label: "Vite", desc: "Bundler/dev server", icon: "vite" },
        { label: "Docker", desc: "Contenedores", icon: "docker" },
        { label: "Kubernetes", desc: "Orquestación", icon: "kubernetes" },
      ],
    },
    {
      type: "comparison",
      heading: "Backend: elegí lenguaje",
      columns: [
        { title: "Rust", icon: "rust", points: ["Performance", "Memory safety", "Curva alta"] },
        { title: "Go", icon: "go", points: ["Simple", "Concurrencia", "Compila rápido"] },
        { title: "Python", icon: "python", points: ["Productividad", "ML/IA", "Más lento"] },
      ],
    },
    {
      type: "list",
      heading: "Infra",
      items: [
        { label: "PostgreSQL", icon: "postgresql", tone: "neutral" },
        { label: "Redis", icon: "redis", tone: "neutral" },
        { label: "GitHub Actions (CI)", icon: "githubactions", tone: "neutral" },
        { label: "Grafana + Prometheus", icon: "grafana", tone: "neutral" },
      ],
    },
  ],
};

const width = 960;
const scale = 2;
const svg = renderToString(doc, { width });
const { height } = parseSvgSize(svg);

const resvg = new Resvg(svg, { fitTo: { mode: "width", value: Math.round(width * scale) } });
const rendered = resvg.render();

writeFileSync(join(outDir, "stack.png"), rendered.asPng());
console.log(`✓ out/stack.png (${rendered.width}x${rendered.height})`);

const rgb = rgbaToRgb(rendered.pixels);
const compressed = await deflate(rgb);
const pdf = buildPdf({
  image: compressed ?? rgb,
  imgW: rendered.width,
  imgH: rendered.height,
  pageW: Math.round(width),
  pageH: Math.round(height),
  flate: Boolean(compressed),
});
writeFileSync(join(outDir, "stack.pdf"), pdf);
console.log(`✓ out/stack.pdf (página ${width}x${Math.round(height)}pt)`);
