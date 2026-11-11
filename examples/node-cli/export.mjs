// Ejemplo de export en Node: SVG -> PNG y PDF.
// Rasteriza con @resvg/resvg-js y arma el PDF con buildPdf (función pura del paquete).
// Uso: node export.mjs  ->  escribe out/infografia.png y out/infografia.pdf
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { renderToString } from "@infoglitch/core";
import { buildPdf, deflate, parseSvgSize, rgbaToRgb } from "@infoglitch/export";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const doc = {
  template: "pipeline-steps",
  theme: "dark-terminal",
  title: "Pipeline de CI/CD",
  sections: [
    { type: "title", text: "De commit a producción", subtitle: "4 etapas", icon: "rocket" },
    {
      type: "steps",
      heading: "Etapas",
      items: [
        { label: "Build", desc: "Compila y empaqueta", icon: "package" },
        { label: "Test", desc: "Corre la suite", icon: "test" },
        { label: "Scan", desc: "Seguridad y lint", icon: "shield" },
        { label: "Deploy", desc: "Publica a prod", icon: "rocket" },
      ],
    },
    {
      type: "stat",
      heading: "SLA objetivo",
      items: [
        { value: "<8", label: "min de pipeline", unit: "min" },
        { value: "99.9", label: "uptime", unit: "%" },
        { value: "0", label: "downtime deploy" },
      ],
    },
    {
      type: "list",
      heading: "Checklist",
      items: [
        { label: "Tests en verde", tone: "pro" },
        { label: "Sin secretos en el repo", tone: "pro" },
        { label: "Rollback manual", tone: "con" },
      ],
    },
  ],
};

const width = 960;
const scale = 2;
const svg = renderToString(doc, { width });
const { height } = parseSvgSize(svg);

// Rasterizar el SVG (resvg carga fuentes del sistema por defecto).
const resvg = new Resvg(svg, { fitTo: { mode: "width", value: Math.round(width * scale) } });
const rendered = resvg.render();

// PNG: resvg lo produce directo.
const png = rendered.asPng();
writeFileSync(join(outDir, "infografia.png"), png);
console.log(`✓ out/infografia.png (${png.length} bytes, ${rendered.width}x${rendered.height})`);

// PDF: píxeles RGBA -> RGB -> deflate -> buildPdf (imagen a página completa).
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
writeFileSync(join(outDir, "infografia.pdf"), pdf);
console.log(`✓ out/infografia.pdf (${pdf.length} bytes, página ${width}x${Math.round(height)}pt)`);
