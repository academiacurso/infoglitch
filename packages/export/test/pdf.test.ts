import { describe, expect, it } from "vitest";
import { buildPdf, deflate, parseSvgSize, rgbaToRgb } from "../src/index";

function decode(bytes: Uint8Array, start: number, len: number): string {
  return String.fromCharCode(...bytes.slice(start, start + len));
}

describe("buildPdf (puro)", () => {
  const image = new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255]); // 3 píxeles RGB
  const pdf = buildPdf({ image, imgW: 3, imgH: 1, pageW: 300, pageH: 100, flate: false });
  const head = decode(pdf, 0, 8);

  it("empieza con la cabecera %PDF", () => {
    expect(head).toBe("%PDF-1.4");
  });

  it("termina con %%EOF", () => {
    const tail = decode(pdf, pdf.length - 6, 6);
    expect(tail).toBe("%%EOF\n");
  });

  it("contiene el XObject de imagen y el MediaBox correcto", () => {
    const full = String.fromCharCode(...pdf);
    expect(full).toContain("/Subtype /Image");
    expect(full).toContain("/MediaBox [0 0 300 100]");
    expect(full).toContain("/Width 3");
    expect(full).toContain("/Height 1");
  });

  it("el offset de startxref apunta a la tabla xref real", () => {
    const full = String.fromCharCode(...pdf);
    const xrefPos = full.indexOf("xref\n0 6");
    const m = full.match(/startxref\n(\d+)/);
    expect(m).toBeTruthy();
    expect(Number(m![1])).toBe(xrefPos);
  });

  it("marca /FlateDecode sólo cuando flate=true", () => {
    const compressed = buildPdf({ image, imgW: 3, imgH: 1, pageW: 10, pageH: 10, flate: true });
    expect(String.fromCharCode(...compressed)).toContain("/Filter /FlateDecode");
    expect(String.fromCharCode(...pdf)).not.toContain("/FlateDecode");
  });
});

describe("rgbaToRgb", () => {
  it("descarta el canal alfa", () => {
    const rgba = new Uint8Array([10, 20, 30, 255, 40, 50, 60, 128]);
    expect(Array.from(rgbaToRgb(rgba))).toEqual([10, 20, 30, 40, 50, 60]);
  });
});

describe("deflate", () => {
  it("comprime y se puede descomprimir (round-trip)", async () => {
    const data = new Uint8Array(1000).fill(7);
    const out = await deflate(data);
    expect(out).not.toBeNull();
    // inflar de vuelta con DecompressionStream
    const ds = new DecompressionStream("deflate");
    const w = ds.writable.getWriter();
    void w.write(out!);
    void w.close();
    const back = new Uint8Array(await new Response(ds.readable).arrayBuffer());
    expect(back.length).toBe(1000);
    expect(back[0]).toBe(7);
  });
});

describe("parseSvgSize", () => {
  it("lee width/height del <svg>", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="768.4" viewBox="0 0 960 768.4">`;
    expect(parseSvgSize(svg)).toEqual({ width: 960, height: 768.4 });
  });
});
