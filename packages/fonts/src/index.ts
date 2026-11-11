import type { FontEntry } from "./fonts-data.js";

/** Familias incluidas y sus pesos. */
export type { FontEntry } from "./fonts-data.js";

/**
 * Devuelve las reglas `@font-face` con las fuentes embebidas (base64 woff2),
 * para inyectar en el SVG (opción `fontCss` de `renderToString`) y así obtener
 * PNG/PDF idénticos en cualquier máquina.
 *
 * @example
 *   import { fontFaceCss } from "@infoglitch/fonts";
 *   import { renderToString } from "@infoglitch/core";
 *   const svg = renderToString(doc, { fontCss: await fontFaceCss() });
 */
export async function fontFaceCss(): Promise<string> {
  const { FONTS } = (await import("./fonts-data.js")) as { FONTS: FontEntry[] };
  return FONTS.map(
    (f) =>
      `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};` +
      `font-display:swap;src:url(data:font/woff2;base64,${f.woff2}) format('woff2');}`,
  ).join("");
}

/**
 * Devuelve los buffers de las fuentes (woff2 decodificado), para pasarlos a un
 * rasterizador en Node (ej. `@resvg/resvg-js` con `font.fontBuffers`).
 */
export async function fontBuffers(): Promise<Uint8Array[]> {
  const { FONTS } = (await import("./fonts-data.js")) as { FONTS: FontEntry[] };
  return FONTS.map((f) => {
    const bin = atob(f.woff2);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  });
}

/**
 * Registra las fuentes en el documento (navegador) vía FontFace API, para que el
 * rasterizado a canvas (`@infoglitch/export`) las use. Llamalo una vez al inicio.
 * No hace nada fuera del navegador.
 */
export async function loadFonts(): Promise<void> {
  const d = typeof document !== "undefined" ? document : undefined;
  if (!d || !("fonts" in d)) return;
  const { FONTS } = (await import("./fonts-data.js")) as { FONTS: FontEntry[] };
  await Promise.all(
    FONTS.map(async (f) => {
      try {
        const face = new FontFace(f.family, `url(data:font/woff2;base64,${f.woff2}) format('woff2')`, {
          weight: String(f.weight),
          style: "normal",
        });
        await face.load();
        (d as unknown as { fonts: { add(face: FontFace): void } }).fonts.add(face);
      } catch {
        /* ignora fallos de carga individual */
      }
    }),
  );
}

/** Nombres de familia incluidos. */
export const fontFamilies = ["Inter", "JetBrains Mono"] as const;
