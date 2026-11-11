import { parseDoc, type InfographicDoc } from "../model/schema.js";
import { parseDsl } from "../dsl/parser.js";
import { getTheme, type Theme } from "../theme/index.js";
import { getTemplate } from "./registry.js";
import { registerBuiltinTemplates } from "./templates/index.js";
import { icon, rect, text, wrapText } from "./svg.js";

registerBuiltinTemplates();

const DEFAULT_WIDTH = 960;
const PAD = 32;

/** Construye el bloque <defs> (gradientes y filtro glow) según el tema. */
function buildDefs(theme: Theme, width: number): string {
  let defs = "";

  if (theme.backgroundGradient) {
    const g = theme.backgroundGradient;
    if (g.type === "radial") {
      defs +=
        `<radialGradient id="ig-bg" cx="50%" cy="34%" r="90%">` +
        `<stop offset="0%" stop-color="${g.from}"/><stop offset="100%" stop-color="${g.to}"/></radialGradient>`;
    } else {
      const a = ((g.angle ?? 135) * Math.PI) / 180;
      const x1 = (50 - Math.cos(a) * 50).toFixed(2);
      const y1 = (50 - Math.sin(a) * 50).toFixed(2);
      const x2 = (50 + Math.cos(a) * 50).toFixed(2);
      const y2 = (50 + Math.sin(a) * 50).toFixed(2);
      defs +=
        `<linearGradient id="ig-bg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">` +
        `<stop offset="0%" stop-color="${g.from}"/><stop offset="100%" stop-color="${g.to}"/></linearGradient>`;
    }
  }

  if (theme.titleGradient) {
    defs +=
      `<linearGradient id="ig-title" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${width}" y2="0">` +
      `<stop offset="0%" stop-color="${theme.titleGradient[0]}"/>` +
      `<stop offset="100%" stop-color="${theme.titleGradient[1]}"/></linearGradient>`;
  }

  if (theme.glow) {
    defs +=
      `<filter id="ig-glow" x="-30%" y="-30%" width="160%" height="160%">` +
      `<feGaussianBlur stdDeviation="3.5" result="b"/>` +
      `<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  return defs; // contenido interno de <defs> (sin envolver)
}

export interface RenderOptions {
  /** ancho del lienzo en px (default 960) */
  width?: number;
  /** id de tema; si el doc trae `theme`, éste tiene prioridad salvo override */
  theme?: string;
  /**
   * CSS a inyectar en `<defs><style>` (típicamente reglas `@font-face` con fuentes
   * embebidas, de `@infoglitch/fonts`) para que PNG/PDF se vean igual en todas partes.
   */
  fontCss?: string;
}

/** Normaliza la entrada (JSON/doc | DSL) a un `InfographicDoc`. */
export function toDoc(input: string | InfographicDoc | unknown): InfographicDoc {
  if (typeof input === "string") {
    // DSL textual (tolerante). El parser ya produce un doc con estructura válida.
    return parseDsl(input);
  }
  // Camino JSON: fuente de verdad, validado estrictamente.
  return parseDoc(input);
}

/**
 * Renderiza un documento (o DSL) a una cadena SVG completa y autocontenida.
 * No requiere DOM: funciona en Node y en el navegador.
 */
export function renderToString(input: string | InfographicDoc | unknown, opts: RenderOptions = {}): string {
  const doc = toDoc(input);
  const theme: Theme = getTheme(opts.theme ?? doc.theme);
  const width = opts.width ?? DEFAULT_WIDTH;
  const contentWidth = width - PAD * 2;

  let cursorY = PAD;
  let header = "";
  if (doc.title) {
    header = text({
      x: PAD,
      y: cursorY + 24,
      text: doc.title,
      size: 24,
      weight: 800,
      fill: theme.titleGradient ? "url(#ig-title)" : theme.text,
      family: theme.fontFamily,
    });
    cursorY += 44;
  }

  const template = getTemplate(doc.template);
  const body = template.render(doc, theme, { x: PAD, y: cursorY, width: contentWidth });
  const contentBottom = cursorY + body.height;

  // Footer opcional: barra full-bleed al pie.
  let footerSvg = "";
  let height = contentBottom + PAD;
  if (doc.footer) {
    const bandTop = contentBottom + PAD;
    const textLines = wrapText(doc.footer.text, width - PAD * 2 - 60, 18).slice(0, 2);
    const noteLines = doc.footer.note ? wrapText(doc.footer.note, width - PAD * 2 - 60, 13).slice(0, 2) : [];
    const contentH = textLines.length * 24 + (noteLines.length ? noteLines.length * 18 + 4 : 0);
    const footerH = Math.max(76, contentH + 40);
    const cxp = width / 2;

    footerSvg += rect({ x: 0, y: bandTop, width, height: footerH, fill: theme.surfaceAlt });
    footerSvg += rect({ x: 0, y: bandTop, width, height: 3, fill: theme.accent });
    if (doc.footer.icon) footerSvg += icon(doc.footer.icon, PAD + 8, bandTop + footerH / 2 - 14, 28, theme.accent);

    let ty = bandTop + (footerH - contentH) / 2 + 18;
    textLines.forEach((ln, k) =>
      (footerSvg += text({
        x: cxp,
        y: ty + k * 24,
        text: ln,
        size: 18,
        weight: 800,
        fill: theme.titleGradient ? "url(#ig-title)" : theme.accent,
        anchor: "middle",
        family: theme.fontFamily,
      })),
    );
    ty += textLines.length * 24 + 4;
    noteLines.forEach((ln, k) =>
      (footerSvg += text({ x: cxp, y: ty + k * 18, text: ln, size: 13, fill: theme.textMuted, anchor: "middle", family: theme.fontFamily })),
    );

    height = bandTop + footerH;
  }

  const innerDefs = buildDefs(theme, width);
  const fontStyle = opts.fontCss ? `<style>${opts.fontCss}</style>` : "";
  const defs = innerDefs || fontStyle ? `<defs>${fontStyle}${innerDefs}</defs>` : "";
  const background = rect({
    x: 0,
    y: 0,
    width,
    height,
    fill: theme.backgroundGradient ? "url(#ig-bg)" : theme.background,
  });

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" font-family="${theme.fontFamily}" role="img">` +
    defs +
    background +
    header +
    body.svg +
    footerSvg +
    `</svg>`
  );
}

function resolveContainer(container?: string | Element): Element | null {
  if (!container) return null;
  if (typeof container !== "string") return container;
  if (typeof document === "undefined") return null;
  return document.querySelector(container);
}

export interface InfographicOptions {
  container?: string | Element;
  width?: number;
  theme?: string;
  /** CSS `@font-face` a embeber (ver `@infoglitch/fonts`). */
  fontCss?: string;
}

/**
 * API con estado, al estilo `@antv/infographic`:
 *   const ig = new Infographic({ container: '#app' });
 *   ig.render(doc);            // o ig.render(dslString)
 *   const svg = ig.toSVGString();
 */
export class Infographic {
  private container: Element | null;
  private options: InfographicOptions;
  private svg = "";

  constructor(options: InfographicOptions = {}) {
    this.options = options;
    this.container = resolveContainer(options.container);
  }

  /** Renderiza un documento (JSON) o una cadena DSL. */
  render(input: string | InfographicDoc | unknown): this {
    this.svg = renderToString(input, {
      width: this.options.width,
      theme: this.options.theme,
      fontCss: this.options.fontCss,
    });
    if (this.container) this.container.innerHTML = this.svg;
    return this;
  }

  /** Alias de `render`, pensado para re-render en streaming. */
  update(input: string | InfographicDoc | unknown): this {
    return this.render(input);
  }

  /** Devuelve la última cadena SVG renderizada. */
  toSVGString(): string {
    return this.svg;
  }

  /** Limpia el contenedor y el estado. */
  destroy(): void {
    if (this.container) this.container.innerHTML = "";
    this.svg = "";
  }
}
