import { describe, expect, it } from "vitest";
import { parseDsl, renderToString, stringify, type InfographicDoc } from "../src/index";

const DSL = `template pipeline-steps
theme dark-terminal
title Pipeline de CI/CD

section title
  text De commit a producción
  subtitle Cuatro etapas
  icon rocket

section steps
  heading Etapas
  - label Build
    desc Compila el proyecto
    icon package
  - label Test
    desc Corre la suite
    icon test
  - label Deploy
    desc Publica a prod
    icon rocket

section list
  - label Rápido
    tone pro
  - label Requiere setup
    tone con
`;

describe("DSL", () => {
  it("parsea secciones, ítems y campos", () => {
    const doc = parseDsl(DSL);
    expect(doc.template).toBe("pipeline-steps");
    expect(doc.theme).toBe("dark-terminal");
    expect(doc.title).toBe("Pipeline de CI/CD");

    const steps = doc.sections.find((s) => s.type === "steps");
    expect(steps).toBeTruthy();
    expect((steps as { items: unknown[] }).items).toHaveLength(3);

    const list = doc.sections.find((s) => s.type === "list") as {
      items: { label: string; tone: string }[];
    };
    expect(list.items[0]!.tone).toBe("pro");
    expect(list.items[1]!.tone).toBe("con");
  });

  it("es tolerante: nunca lanza y siempre produce SVG ante entrada parcial (streaming)", () => {
    // Simula streaming: cada prefijo del DSL debe renderizar sin romperse.
    for (let i = 1; i <= DSL.length; i += 7) {
      const partial = DSL.slice(0, i);
      expect(() => parseDsl(partial)).not.toThrow();
      const svg = renderToString(partial);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("</svg>");
    }
  });

  it("round-trip aproximado: stringify(parse(x)) vuelve a parsear a lo mismo", () => {
    const doc = parseDsl(DSL);
    const again = parseDsl(stringify(doc as InfographicDoc));
    expect(again.template).toBe(doc.template);
    expect(again.sections.length).toBe(doc.sections.length);
  });

  it("ignora tipos de sección desconocidos sin romper", () => {
    const doc = parseDsl("section noexiste\n  foo bar\nsection list\n  - label Ok\n");
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0]!.type).toBe("list");
  });
});
