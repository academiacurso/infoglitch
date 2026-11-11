// Ejemplo Camino A: de un documento JSON (fuente de verdad) a SVG, SIN IA.
// Uso: node generate.mjs  ->  escribe out/pipeline.svg y out/from-dsl.svg
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToString, parseDsl } from "@infoglitch/core";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

// 1) Documento JSON escrito a mano (ninguna API key involucrada).
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

const svg = renderToString(doc, { width: 960 });
writeFileSync(join(outDir, "pipeline.svg"), svg, "utf8");
console.log(`✓ out/pipeline.svg (${svg.length} bytes)`);

// 2) Lo mismo, pero partiendo del DSL textual (tolerante).
const dsl = `template metrics-grid
theme glitch
title Benchmark

section title
  text API v2
  subtitle Resultados de carga
  icon zap

section stat
  - value 12k
    label req/s
  - value 38
    label latencia
    unit ms
  - value 99.98
    label uptime
    unit %
`;
const svg2 = renderToString(parseDsl(dsl), { width: 720 });
writeFileSync(join(outDir, "from-dsl.svg"), svg2, "utf8");
console.log(`✓ out/from-dsl.svg (${svg2.length} bytes)`);
