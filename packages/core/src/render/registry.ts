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
