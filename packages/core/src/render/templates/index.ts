import { makeStackTemplate, registerTemplate, type Template } from "../registry.js";

/**
 * Catálogo de plantillas del MVP, enfocado en temática de programación.
 *
 * Cada plantilla destaca (renderiza primero) ciertos tipos de sección, pero
 * todas renderizan el documento completo, de modo que cualquier `InfographicDoc`
 * se dibuja aunque la plantilla elegida no sea la "ideal".
 */
export const builtinTemplates: Template[] = [
  makeStackTemplate("stack", "Secciones en el orden dado, sin reordenar (para combinar tipos)"),
  makeStackTemplate("pipeline-steps", "Flujos CI/CD, build o release en pasos", ["title", "steps"]),
  makeStackTemplate("architecture-boxes", "Diagrama simple de arquitectura (nodos y aristas)", [
    "title",
    "architecture",
  ]),
  makeStackTemplate("stack-comparison", "Comparar tecnologías/frameworks lado a lado", [
    "title",
    "comparison",
  ]),
  makeStackTemplate("metrics-grid", "KPIs y benchmarks en grilla", ["title", "stat"]),
  makeStackTemplate("code-callout", "Snippet de código destacado con notas", [
    "title",
    "codeSnippet",
    "callout",
  ]),
  makeStackTemplate("timeline-roadmap", "Roadmap / versionado / historial", ["title", "timeline"]),
  makeStackTemplate("feature-list", "Lista de features / pros-contras con iconos", ["title", "list"]),
  makeStackTemplate("concept-hero", "Portada/título con subtítulo e icono principal", [
    "title",
    "callout",
  ]),
  makeStackTemplate("versus", "Comparación a dos columnas con columna central (A vs B)", [
    "title",
    "versus",
  ]),
  makeStackTemplate("flowchart", "Diagrama de flujo con decisiones (Sí/No)", ["title", "flow"]),
  makeStackTemplate("roadmap", "Ruta de aprendizaje serpenteante con pasos numerados", [
    "title",
    "roadmap",
  ]),
  makeStackTemplate("icon-grid", "Grilla de icono + concepto (secciones '¿Por qué…?')", [
    "title",
    "iconGrid",
  ]),
  makeStackTemplate("chart", "Gráfico de datos (barras, torta/dona, líneas)", ["title", "chart"]),
];

let registered = false;

/** Registra las plantillas integradas (idempotente). */
export function registerBuiltinTemplates(): void {
  if (registered) return;
  for (const template of builtinTemplates) registerTemplate(template);
  registered = true;
}
