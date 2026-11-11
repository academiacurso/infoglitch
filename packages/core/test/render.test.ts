import { describe, expect, it } from "vitest";
import {
  Infographic,
  renderToString,
  templateIds,
  type InfographicDoc,
} from "../src/index";

const doc: InfographicDoc = {
  template: "metrics-grid",
  theme: "glitch",
  title: "Benchmark del servicio",
  sections: [
    { type: "title", text: "API v2", subtitle: "Resultados de carga", icon: "rocket" },
    {
      type: "stat",
      items: [
        { value: "12k", label: "req/s" },
        { value: "38", label: "latencia", unit: "ms" },
        { value: "99.98", label: "uptime", unit: "%" },
      ],
    },
  ],
} as InfographicDoc;

describe("render JSON -> SVG (sin IA)", () => {
  it("produce un SVG válido desde un documento JSON", () => {
    const svg = renderToString(doc);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox=");
    expect(svg).toContain("12k");
    expect(svg).toContain("Benchmark del servicio");
    // alto > 0
    const m = svg.match(/height="(\d+)"/);
    expect(Number(m?.[1])).toBeGreaterThan(100);
  });

  it("la clase Infographic expone toSVGString()", () => {
    const ig = new Infographic({ theme: "dark-terminal" });
    ig.render(doc);
    expect(ig.toSVGString()).toContain("<svg");
  });

  it("registra las 8 plantillas del catálogo", () => {
    const ids = templateIds();
    for (const id of [
      "pipeline-steps",
      "architecture-boxes",
      "stack-comparison",
      "metrics-grid",
      "code-callout",
      "timeline-roadmap",
      "feature-list",
      "concept-hero",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("usa fallback de plantilla ante un id inexistente", () => {
    const svg = renderToString({ ...doc, template: "no-existe" });
    expect(svg.startsWith("<svg")).toBe(true);
  });
});
