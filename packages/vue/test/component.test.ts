import { describe, expect, it } from "vitest";
import { Infographic, useStreamingInfographic, renderToString } from "../src/index";

describe("@infoglitch/vue", () => {
  it("exporta el componente Infographic (objeto de componente Vue)", () => {
    expect(Infographic).toBeTypeOf("object");
    expect((Infographic as { name?: string }).name).toBe("Infographic");
  });

  it("declara las props esperadas", () => {
    const props = (Infographic as { props?: Record<string, unknown> }).props ?? {};
    expect(Object.keys(props).sort()).toEqual(["doc", "fontCss", "source", "theme", "width"]);
  });

  it("exporta el composable useStreamingInfographic", () => {
    expect(useStreamingInfographic).toBeTypeOf("function");
  });

  it("re-exporta renderToString del core y produce un SVG", () => {
    const svg = renderToString("template stack\nsection title\n  text Hola", { width: 400 });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
  });
});
