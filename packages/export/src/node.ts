/**
 * Rasterizado server-side (Node) de infografías SVG → PNG/PDF.
 *
 * Usa `@resvg/resvg-js` (dependencia opcional, binario nativo) y respeta las
 * **fuentes embebidas** vía `fontBuffers` — porque resvg NO honra las reglas
 * `@font-face` dentro del SVG; hay que pasarle los buffers de fuente aparte
 * (ver `@infoglitch/fonts` → `fontBuffers()`).
 *
 * Entry separado (`@infoglitch/export/node`) para que los bundles de navegador
 * nunca arrastren el binario nativo.
 */
import { buildPdf, deflate, rgbaToRgb } from "./pdf-build.js";

export interface NodeRasterOptions {
  /** Ancho objetivo en px; resvg escala manteniendo el aspecto. Default: ancho del SVG. */
  width?: number;
  /** Color de fondo (ej. "#ffffff" o "transparent"). Default: lo que traiga el SVG. */
  background?: string;
  /** Buffers de fuentes a cargar (de `@infoglitch/fonts` → `fontBuffers()`). */
  fontBuffers?: Uint8Array[];
  /** Rutas de archivos de fuente a cargar, como alternativa/complemento a `fontBuffers`. */
  fontFiles?: string[];
  /** Cargar las fuentes del sistema. Default: false (render determinista). */
  loadSystemFonts?: boolean;
}

// Carga perezosa de resvg: así `@infoglitch/export` (entry browser) no lo exige.
type ResvgCtor = new (svg: string, opts?: unknown) => {
  render(): { asPng(): Uint8Array; pixels: Uint8Array; width: number; height: number };
};
let ResvgCached: ResvgCtor | null = null;

async function loadResvg(): Promise<ResvgCtor> {
  if (ResvgCached) return ResvgCached;
  try {
    const mod = (await import("@resvg/resvg-js")) as { Resvg: ResvgCtor };
    ResvgCached = mod.Resvg;
    return ResvgCached;
  } catch {
    throw new Error(
      "[@infoglitch/export/node] Falta '@resvg/resvg-js'. Instalalo:\n" +
        "  pnpm add @resvg/resvg-js   (o npm i / yarn add)\n" +
        "Es una dependencia opcional porque es un binario nativo solo para Node.",
    );
  }
}

function resvgOptions(opts: NodeRasterOptions): Record<string, unknown> {
  const o: Record<string, unknown> = {
    font: {
      loadSystemFonts: opts.loadSystemFonts ?? false,
      fontBuffers: opts.fontBuffers ?? [],
      ...(opts.fontFiles ? { fontFiles: opts.fontFiles } : {}),
    },
  };
  if (opts.width) o.fitTo = { mode: "width", value: opts.width };
  if (opts.background) o.background = opts.background;
  return o;
}

/** Lee `width`/`height` lógicos del SVG (para dimensionar la página del PDF en puntos). */
function svgLogicalSize(svg: string): { w: number; h: number } {
  const w = Number(/\bwidth="([\d.]+)"/.exec(svg)?.[1]);
  const h = Number(/\bheight="([\d.]+)"/.exec(svg)?.[1]);
  if (w > 0 && h > 0) return { w, h };
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  return { w: Number(vb?.[1]) || 960, h: Number(vb?.[2]) || 540 };
}

/** Rasteriza el SVG a PNG. Devuelve los bytes del PNG. */
export async function renderPng(svg: string, opts: NodeRasterOptions = {}): Promise<Uint8Array> {
  const Resvg = await loadResvg();
  return new Resvg(svg, resvgOptions(opts)).render().asPng();
}

/** Rasteriza y devuelve PNG + dimensiones en píxeles del render. */
export async function renderPngInfo(
  svg: string,
  opts: NodeRasterOptions = {},
): Promise<{ png: Uint8Array; width: number; height: number }> {
  const Resvg = await loadResvg();
  const r = new Resvg(svg, resvgOptions(opts)).render();
  return { png: r.asPng(), width: r.width, height: r.height };
}

/**
 * Rasteriza el SVG y lo embebe en un PDF de una página (imagen a página completa).
 * La página toma el tamaño lógico del SVG (en puntos), preservando el aspecto.
 */
export async function renderPdf(svg: string, opts: NodeRasterOptions = {}): Promise<Uint8Array> {
  const Resvg = await loadResvg();
  const r = new Resvg(svg, resvgOptions(opts)).render();
  const rgb = rgbaToRgb(r.pixels);
  const compressed = await deflate(rgb);
  const { w, h } = svgLogicalSize(svg);
  return buildPdf({
    image: compressed ?? rgb,
    imgW: r.width,
    imgH: r.height,
    pageW: w,
    pageH: h,
    flate: compressed != null,
  });
}

export { buildPdf, rgbaToRgb, deflate, type BuildPdfInput } from "./pdf-build.js";
