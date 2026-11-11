import { describe, expect, it } from "vitest";
import { resolveIcon, renderToString } from "@infoglitch/core";
import {
  registerDevicon,
  registerSimpleIcons,
  registerSimpleIconsAll,
  simpleIconNames,
  simpleIconsSource,
} from "../src/index";

registerSimpleIcons();

describe("@infoglitch/icons (Simple Icons)", () => {
  it("resuelve un logo de lenguaje como icono de relleno", () => {
    const r = resolveIcon("typescript");
    expect(r.fallback).toBe(false);
    expect(r.def.mode).toBe("fill");
    expect(r.def.body).toContain("<path");
    expect(r.def.body).toContain('d="');
  });

  it("resuelve por alias comunes", () => {
    expect(resolveIcon("nodejs").fallback).toBe(false); // -> nodedotjs
    expect(resolveIcon("k8s").fallback).toBe(false); // -> kubernetes
    expect(resolveIcon("golang").fallback).toBe(false); // -> go
    expect(resolveIcon("csharp").fallback).toBe(false); // -> dotnet
  });

  it("cae al set integrado para nombres no-marca", () => {
    // 'rocket' no es un logo de marca; debe seguir resolviendo al genérico.
    const r = resolveIcon("rocket");
    expect(r.name).toBe("rocket");
  });

  it("expone nombres para el prompt de la IA", () => {
    const names = simpleIconNames();
    expect(names).toContain("javascript");
    expect(names).toContain("docker");
    expect(names.length).toBeGreaterThan(80);
  });

  it("brandColors activa el color de marca", () => {
    const src = simpleIconsSource({ brandColors: true });
    const def = src("typescript", "typescript");
    expect(def?.color).toMatch(/^#[0-9a-fA-F]{3,6}$/);
  });

  it("registerSimpleIconsAll resuelve slugs fuera del set curado", async () => {
    const count = await registerSimpleIconsAll();
    expect(count).toBeGreaterThan(1000);
    expect(resolveIcon("fortran").fallback).toBe(false);
    expect(resolveIcon("netflix").fallback).toBe(false);
  });

  it("registerDevicon carga logos a color (mode raw, viewBox 128)", async () => {
    const count = await registerDevicon();
    expect(count).toBeGreaterThan(50);
    const java = resolveIcon("java");
    expect(java.fallback).toBe(false);
    expect(java.def.mode).toBe("raw");
    expect(java.def.viewBox).toContain("128");
    // alias
    expect(resolveIcon("node").fallback).toBe(false); // -> nodejs
  });

  it("render incluye el logo como grupo de relleno", () => {
    const svg = renderToString({
      template: "feature-list",
      sections: [
        { type: "list", items: [{ label: "Backend en Rust", icon: "rust", tone: "neutral" }] },
      ],
    } as never);
    expect(svg).toContain("<path");
    expect(svg).toContain("fill=");
  });
});
