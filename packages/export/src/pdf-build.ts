/**
 * Ensamblador mínimo de PDF que embebe una sola imagen RGB a página completa.
 * Función PURA (no usa DOM): recibe los bytes de la imagen y las dimensiones, y
 * devuelve los bytes del PDF. Testeable en Node.
 */

export interface BuildPdfInput {
  /** Muestras de la imagen, RGB de 8 bits por canal (3 bytes/píxel), por filas. */
  image: Uint8Array;
  /** Ancho de la imagen en píxeles. */
  imgW: number;
  /** Alto de la imagen en píxeles. */
  imgH: number;
  /** Ancho de la página en puntos (típicamente el ancho lógico del SVG). */
  pageW: number;
  /** Alto de la página en puntos. */
  pageH: number;
  /** true si `image` está comprimida con zlib/deflate (FlateDecode). */
  flate: boolean;
}

const ascii = (s: string): Uint8Array => {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
};

const pad10 = (n: number): string => String(n).padStart(10, "0");

/** Construye los bytes de un PDF con la imagen a página completa. */
export function buildPdf(input: BuildPdfInput): Uint8Array {
  const { image, imgW, imgH, pageW, pageH, flate } = input;

  const chunks: Uint8Array[] = [];
  let length = 0;
  const push = (u: Uint8Array) => {
    chunks.push(u);
    length += u.length;
  };
  const text = (s: string) => push(ascii(s));

  // offsets[n] = byte offset del inicio del objeto n
  const offsets: number[] = [];
  const startObj = (n: number) => {
    offsets[n] = length;
    text(`${n} 0 obj\n`);
  };

  // Cabecera + marcador binario (recomendado por la spec)
  text("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xff, 0xff, 0xff, 0xff, 0x0a]));

  // 1: Catalog
  startObj(1);
  text("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // 2: Pages
  startObj(2);
  text("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // 3: Page
  startObj(3);
  text(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
  );

  // 4: Image XObject
  startObj(4);
  const filter = flate ? " /Filter /FlateDecode" : "";
  text(
    `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8${filter} /Length ${image.length} >>\nstream\n`,
  );
  push(image);
  text("\nendstream\nendobj\n");

  // 5: Contents — coloca la imagen cubriendo toda la página
  startObj(5);
  const content = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = ascii(content);
  text(`<< /Length ${contentBytes.length} >>\nstream\n`);
  push(contentBytes);
  text("endstream\nendobj\n");

  // xref
  const xrefStart = length;
  const count = 6; // objetos 0..5
  text(`xref\n0 ${count}\n`);
  text("0000000000 65535 f \n");
  for (let n = 1; n < count; n++) {
    text(`${pad10(offsets[n] ?? 0)} 00000 n \n`);
  }

  // trailer
  text(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  // Concatenar
  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}

/** Convierte RGBA (4 bytes/píxel) a RGB (3 bytes/píxel), descartando alfa. */
export function rgbaToRgb(rgba: Uint8ClampedArray | Uint8Array): Uint8Array {
  const px = rgba.length / 4;
  const rgb = new Uint8Array(px * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i]!;
    rgb[j + 1] = rgba[i + 1]!;
    rgb[j + 2] = rgba[i + 2]!;
  }
  return rgb;
}

/** Comprime con deflate (zlib) si `CompressionStream` está disponible; si no, null. */
export async function deflate(data: Uint8Array): Promise<Uint8Array | null> {
  const CS = (globalThis as { CompressionStream?: typeof CompressionStream }).CompressionStream;
  if (typeof CS === "undefined") return null;
  const cs = new CS("deflate");
  const writer = cs.writable.getWriter();
  void writer.write(data as BufferSource);
  void writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}
