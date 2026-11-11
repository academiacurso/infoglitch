import { resolveIcon } from "../icons/index.js";

/** Escapa texto para contenido/atributos XML. Tolerante: coacciona no-strings a "". */
export function escapeXml(value: string): string {
  if (typeof value !== "string") return value == null ? "" : String(value);
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type AttrValue = string | number | undefined | null | false;

/** Serializa un mapa de atributos (ignora undefined/null/false). */
export function attrs(map: Record<string, AttrValue>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(map)) {
    if (value === undefined || value === null || value === false) continue;
    parts.push(`${key}="${escapeXml(String(value))}"`);
  }
  return parts.length ? " " + parts.join(" ") : "";
}

/** Crea un elemento SVG como string. */
export function el(tag: string, attrMap: Record<string, AttrValue>, children = ""): string {
  if (children === "") return `<${tag}${attrs(attrMap)} />`;
  return `<${tag}${attrs(attrMap)}>${children}</${tag}>`;
}

export function rect(opts: {
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}): string {
  return el("rect", {
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    rx: opts.rx,
    fill: opts.fill,
    stroke: opts.stroke,
    "stroke-width": opts.strokeWidth,
  });
}

export function line(x1: number, y1: number, x2: number, y2: number, stroke: string, width = 1.5): string {
  return el("line", { x1, y1, x2, y2, stroke, "stroke-width": width, "stroke-linecap": "round" });
}

export interface TextOpts {
  x: number;
  y: number;
  text: string;
  size?: number;
  fill?: string;
  weight?: number | string;
  family?: string;
  anchor?: "start" | "middle" | "end";
}

export function text(opts: TextOpts): string {
  return el(
    "text",
    {
      x: opts.x,
      y: opts.y,
      "font-size": opts.size ?? 14,
      fill: opts.fill ?? "#000",
      "font-weight": opts.weight,
      "font-family": opts.family,
      "text-anchor": opts.anchor ?? "start",
    },
    escapeXml(opts.text),
  );
}

/** Ancho aproximado de carácter para una fuente sans/mono. */
export function charWidth(fontSize: number): number {
  return fontSize * 0.56;
}

/** Parte un texto en líneas que caben en `maxWidth` (aprox). */
export function wrapText(value: string, maxWidth: number, fontSize: number): string[] {
  const cw = charWidth(fontSize);
  const maxChars = Math.max(1, Math.floor(maxWidth / cw));
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (word.length > maxChars) {
        // palabra más larga que la línea: cortar duro
        let rest = word;
        while (rest.length > maxChars) {
          lines.push(rest.slice(0, maxChars));
          rest = rest.slice(maxChars);
        }
        current = rest;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/** Bloque de texto multilínea. Devuelve `{ svg, height }`. */
export function paragraph(opts: {
  x: number;
  y: number;
  text: string;
  maxWidth: number;
  size?: number;
  lineHeight?: number;
  fill?: string;
  family?: string;
  weight?: number | string;
  maxLines?: number;
}): { svg: string; height: number } {
  const size = opts.size ?? 14;
  const lh = opts.lineHeight ?? size * 1.4;
  let lines = wrapText(opts.text, opts.maxWidth, size);
  if (opts.maxLines && lines.length > opts.maxLines) {
    lines = lines.slice(0, opts.maxLines);
    const last = lines.length - 1;
    lines[last] = lines[last]!.replace(/.{1}$/, "…");
  }
  const svg = lines
    .map((ln, i) =>
      text({
        x: opts.x,
        y: opts.y + size + i * lh,
        text: ln,
        size,
        fill: opts.fill,
        family: opts.family,
        weight: opts.weight,
      }),
    )
    .join("");
  return { svg, height: lines.length * lh };
}

/**
 * Renderiza un icono resuelto por nombre, escalado a `size` px y posicionado
 * en (x, y) (esquina superior izquierda).
 */
export function icon(name: string | undefined, x: number, y: number, size: number, color: string): string {
  const resolved = resolveIcon(name);
  const vb = resolved.def.viewBox ?? "0 0 24 24";
  const vbW = parseFloat(vb.split(/\s+/)[2] ?? "24") || 24;
  const scale = size / vbW;
  const transform = `translate(${x}, ${y}) scale(${scale})`;
  const mode = resolved.def.mode ?? "stroke";

  // 'raw': preserva los colores/fills propios del icono (ej. Devicon multicolor).
  if (mode === "raw") {
    return el("g", { transform }, resolved.def.body);
  }

  const paint = resolved.def.color ?? color;
  const filled = mode === "fill";
  return el(
    "g",
    {
      transform,
      fill: filled ? paint : "none",
      stroke: filled ? undefined : paint,
      "stroke-width": filled ? undefined : 2,
      "stroke-linecap": filled ? undefined : "round",
      "stroke-linejoin": filled ? undefined : "round",
    },
    resolved.def.body,
  );
}
