import { describe, expect, it } from "vitest";
import { formatFromOut, parseArgs } from "../src/cli.js";

describe("parseArgs", () => {
  it("toma positional + opciones cortas y largas", () => {
    const a = parseArgs(["render", "deck.dsl", "-o", "out.png", "--theme", "cyber", "-w", "1200"]);
    expect(a.positional).toEqual(["render", "deck.dsl"]);
    expect(a.out).toBe("out.png");
    expect(a.theme).toBe("cyber");
    expect(a.width).toBe(1200);
  });

  it("defaults: iconos simple, fuentes activadas", () => {
    const a = parseArgs(["render", "deck.dsl"]);
    expect(a.icons).toBe("simple");
    expect(a.fonts).toBe(true);
  });

  it("--no-fonts e --icons", () => {
    const a = parseArgs(["render", "deck.dsl", "--no-fonts", "--icons", "all"]);
    expect(a.fonts).toBe(false);
    expect(a.icons).toBe("all");
  });
});

describe("formatFromOut", () => {
  it("infiere el formato de la extensión", () => {
    expect(formatFromOut("x.png")).toBe("png");
    expect(formatFromOut("x.pdf")).toBe("pdf");
    expect(formatFromOut("x.svg")).toBe("svg");
  });
  it("default svg si no hay --out o extensión desconocida", () => {
    expect(formatFromOut(undefined)).toBe("svg");
    expect(formatFromOut("x.txt")).toBe("svg");
  });
});
