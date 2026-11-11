import { describe, expect, it } from "vitest";
import { fontFaceCss, fontBuffers, fontFamilies } from "../src/index";

describe("@infoglitch/fonts", () => {
  it("fontFaceCss incluye @font-face de ambas familias", async () => {
    const css = await fontFaceCss();
    expect((css.match(/@font-face/g) ?? []).length).toBe(6);
    expect(css).toContain("'Inter'");
    expect(css).toContain("'JetBrains Mono'");
    expect(css).toContain("base64,");
  });

  it("fontBuffers devuelve woff2 válidos (firma wOF2)", async () => {
    const bufs = await fontBuffers();
    expect(bufs).toHaveLength(6);
    for (const b of bufs) {
      expect(b.length).toBeGreaterThan(1000);
      // firma woff2: 'wOF2'
      expect([b[0], b[1], b[2], b[3]]).toEqual([0x77, 0x4f, 0x46, 0x32]);
    }
  });

  it("expone las familias", () => {
    expect(fontFamilies).toContain("Inter");
    expect(fontFamilies).toContain("JetBrains Mono");
  });
});
