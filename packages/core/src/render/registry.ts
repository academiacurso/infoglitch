import type { InfographicDoc, Section, SectionType } from "../model/schema.js";
import type { Theme } from "../theme/index.js";
import { themeAccents } from "../theme/index.js";
import { GAP, renderSection, type Block, type SectionStyle } from "./sections.js";

export interface TemplateRenderOpts {
  x: number;
  y: number;
  width: number;
}

export interface Template {
  id: string;
  /** descripción corta (para catálogo/UX) */
  description?: string;
  /** tipos de sección que la plantilla destaca (se renderizan primero) */
  primary?: SectionType[];
  /** renderiza el cuerpo del documento; devuelve svg + alto total */
  render(doc: InfographicDoc, theme: Theme, opts: TemplateRenderOpts): Block;
}

/** Apila secciones verticalmente con separación uniforme. */
export function stackSections(
  sections: Section[],
  theme: Theme,
  x: number,
  y: number,
  width: number,
): Block {
  const accents = themeAccents(theme);
  const neon = theme.panelStyle === "neon";
  const glow = neon && theme.glow ? "url(#ig-glow)" : undefined;

  let cursor = y;
  let svg = "";
  let accentIdx = 0;
  sections.forEach((section, i) => {
    // Un acento por sección (los títulos/callouts no consumen turno de la paleta).
    const accent = accents[accentIdx % accents.length]!;
    if (section.type !== "title" && section.type !== "callout") accentIdx++;
    const style: SectionStyle = { accent, neon, glow };
    const block = renderSection(section, theme, x, cursor, width, style);
    svg += block.svg;
    cursor += block.height;
    if (i < sections.length - 1) cursor += GAP;
  });
  return { svg, height: cursor - y };
}

/** Ordena poniendo primero las secciones de los tipos "primary". */
function prioritize(sections: Section[], primary?: SectionType[]): Section[] {
  if (!primary || primary.length === 0) return sections;
  const set = new Set(primary);
  const first = sections.filter((s) => set.has(s.type));
  const rest = sections.filter((s) => !set.has(s.type));
  return [...first, ...rest];
}

/** Crea una plantilla basada en apilado, destacando ciertos tipos. */
export function makeStackTemplate(
  id: string,
  description: string,
  primary?: SectionType[],
): Template {
  return {
    id,
    description,
    primary,
    render(doc, theme, opts) {
      const ordered = prioritize(doc.sections, primary);
      return stackSections(ordered, theme, opts.x, opts.y, opts.width);
    },
  };
}

/** Tipos de sección anchos por naturaleza: no entran bien en una columna angosta. */
export const WIDE_SECTION_TYPES: SectionType[] = [
  "title",
  "steps",
  "flow",
  "architecture",
  "versus",
  "columns",
  "table",
];

export interface ColumnsTemplateOptions {
  /** cantidad de columnas (default 2). */
  columns?: number;
  /**
   * Tipos que se renderizan a ancho completo **en su lugar** (vaciando las
   * columnas): el resto fluye en N columnas. Default: `WIDE_SECTION_TYPES`.
   */
  fullWidthTypes?: SectionType[];
  /** tipos a destacar primero (como en las plantillas de apilado). */
  primary?: SectionType[];
}

/**
 * Crea una plantilla de **layout multi-columna intercalado**: las secciones
 * angostas fluyen en N columnas balanceando por altura (cada una va a la
 * columna más corta), y las secciones anchas (`steps`, `flow`, `title`, …) se
 * dibujan a ancho completo en su posición, vaciando las columnas antes y
 * reanudándolas después. Un layout de verdad, distinto del apilado vertical,
 * que nunca desborda una sección ancha en una columna angosta.
 */
export function makeColumnsTemplate(
  id: string,
  description: string,
  options: ColumnsTemplateOptions = {},
): Template {
  const columns = Math.max(1, options.columns ?? 2);
  const fullWidthTypes = new Set<SectionType>(options.fullWidthTypes ?? WIDE_SECTION_TYPES);

  return {
    id,
    description,
    primary: options.primary,
    render(doc, theme, opts) {
      const accents = themeAccents(theme);
      const neon = theme.panelStyle === "neon";
      const glow = neon && theme.glow ? "url(#ig-glow)" : undefined;
      let accentIdx = 0;
      const nextStyle = (type: SectionType): SectionStyle => {
        const accent = accents[accentIdx % accents.length]!;
        if (type !== "title" && type !== "callout") accentIdx++;
        return { accent, neon, glow };
      };

      const ordered = prioritize(doc.sections, options.primary);
      const colGap = GAP;
      const colW = (opts.width - colGap * (columns - 1)) / columns;
      const colX = Array.from({ length: columns }, (_, c) => opts.x + c * (colW + colGap));

      let svg = "";
      let cursor = opts.y; // borde inferior del contenido a ancho completo ya colocado
      let placedAny = false;

      // Estado de columnas activas (null = no hay tanda de columnas abierta).
      let colY: number[] | null = null;
      const flushColumns = (): void => {
        if (colY) {
          cursor = Math.max(cursor, ...colY);
          colY = null;
        }
      };

      for (const section of ordered) {
        if (fullWidthTypes.has(section.type)) {
          flushColumns();
          if (placedAny) cursor += GAP;
          const block = renderSection(section, theme, opts.x, cursor, opts.width, nextStyle(section.type));
          svg += block.svg;
          cursor += block.height;
          placedAny = true;
        } else {
          if (!colY) {
            if (placedAny) cursor += GAP;
            colY = Array.from({ length: columns }, () => cursor);
          }
          // Columna más corta (ante empate, la primera).
          let c = 0;
          for (let k = 1; k < columns; k++) if (colY[k]! < colY[c]!) c = k;
          if (colY[c]! > cursor) colY[c]! += GAP; // separar de la sección previa de ESA columna
          const block = renderSection(section, theme, colX[c]!, colY[c]!, colW, nextStyle(section.type));
          svg += block.svg;
          colY[c]! += block.height;
          placedAny = true;
        }
      }
      flushColumns();

      return { svg, height: cursor - opts.y };
    },
  };
}

const registry = new Map<string, Template>();

export const FALLBACK_TEMPLATE = "feature-list";

/** Registra (o reemplaza) una plantilla. Permite extender sin tocar el core. */
export function registerTemplate(template: Template): void {
  registry.set(template.id, template);
}

/** Obtiene una plantilla por id, con fallback tolerante a `feature-list`. */
export function getTemplate(id?: string): Template {
  if (id && registry.has(id)) return registry.get(id)!;
  return registry.get(FALLBACK_TEMPLATE)!;
}

/** Lista los ids de plantillas registradas. */
export function templateIds(): string[] {
  return [...registry.keys()];
}

/** Catálogo (id + descripción) de las plantillas registradas. */
export function templateCatalog(): { id: string; description?: string }[] {
  return [...registry.values()].map((t) => ({ id: t.id, description: t.description }));
}
