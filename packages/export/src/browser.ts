import { buildPdf, deflate, rgbaToRgb } from "./pdf-build.js";

export interface RasterOptions {
  /** Factor de escala para la resolución del raster (default 2). */
  scale?: number;
  /** Color de fondo opcional (el SVG ya suele traer su propio fondo). */
  background?: string;
}

/** Extrae ancho/alto lógicos del atributo del `<svg>`. */
export function parseSvgSize(svg: string): { width: number; height: number } {
  const w = svg.match(/<svg[^>]*\bwidth="([\d.]+)"/);
  const h = svg.match(/<svg[^>]*\bheight="([\d.]+)"/);
  return {
    width: w ? parseFloat(w[1]!) : 960,
    height: h ? parseFloat(h[1]!) : 540,
  };
}

function ensureBrowser(): void {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("@infoglitch/export: el rasterizado requiere un entorno de navegador (document/canvas).");
  }
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("@infoglitch/export: no se pudo cargar el SVG como imagen."));
    };
    img.src = url;
  });
}

/** Rasteriza el SVG a un `<canvas>` (navegador). */
export async function svgToCanvas(svg: string, opts: RasterOptions = {}): Promise<HTMLCanvasElement> {
  ensureBrowser();
  const scale = opts.scale ?? 2;
  const { width, height } = parseSvgSize(svg);
  const img = await loadSvgImage(svg);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("@infoglitch/export: no se pudo obtener el contexto 2D.");

  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** SVG → Blob PNG (navegador). */
export async function svgToPngBlob(svg: string, opts: RasterOptions = {}): Promise<Blob> {
  const canvas = await svgToCanvas(svg, opts);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob() devolvió null"))), "image/png");
  });
}

/** SVG → data URL PNG (navegador). */
export async function svgToPngDataUrl(svg: string, opts: RasterOptions = {}): Promise<string> {
  const canvas = await svgToCanvas(svg, opts);
  return canvas.toDataURL("image/png");
}

/** SVG → Blob PDF (navegador). Imagen a página completa, tamaño = tamaño lógico del SVG. */
export async function svgToPdfBlob(svg: string, opts: RasterOptions = {}): Promise<Blob> {
  const { width, height } = parseSvgSize(svg);
  const canvas = await svgToCanvas(svg, opts);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("@infoglitch/export: no se pudo obtener el contexto 2D.");

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const rgb = rgbaToRgb(data);
  const compressed = await deflate(rgb);

  const pdf = buildPdf({
    image: compressed ?? rgb,
    imgW: canvas.width,
    imgH: canvas.height,
    pageW: Math.round(width),
    pageH: Math.round(height),
    flate: Boolean(compressed),
  });
  // Copia a un ArrayBuffer “limpio” para el Blob.
  return new Blob([pdf.slice()], { type: "application/pdf" });
}

/** Dispara la descarga de un Blob con el nombre dado (navegador). */
export function downloadBlob(blob: Blob, filename: string): void {
  ensureBrowser();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Descarga el SVG como PNG. */
export async function downloadPng(
  svg: string,
  filename = "infografia.png",
  opts: RasterOptions = {},
): Promise<void> {
  downloadBlob(await svgToPngBlob(svg, opts), filename);
}

/** Descarga el SVG como PDF. */
export async function downloadPdf(
  svg: string,
  filename = "infografia.pdf",
  opts: RasterOptions = {},
): Promise<void> {
  downloadBlob(await svgToPdfBlob(svg, opts), filename);
}

/** Descarga el SVG tal cual (sin rasterizar). */
export function downloadSvg(svg: string, filename = "infografia.svg"): void {
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);
}
