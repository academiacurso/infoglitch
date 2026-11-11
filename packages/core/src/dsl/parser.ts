import type { InfographicDoc, Section, SectionType } from "../model/schema.js";

/**
 * Parser del DSL textual de infoglitch.
 *
 * Objetivos:
 *  - Basado en indentación, legible y fácil de emitir por un LLM.
 *  - TOLERANTE A FALLOS: nunca lanza. Ante entrada parcial (streaming) o líneas
 *    incompletas, ignora lo que no entiende y devuelve siempre un documento
 *    renderizable. Esto permite re-renderizar el buffer en cada chunk.
 *
 * Gramática (informal):
 *   template <id>
 *   theme <id>
 *   title <texto>
 *   section <tipo>
 *     <campo> <valor>            # campo a nivel de sección
 *     - <campo> <valor>          # nuevo ítem de la lista de la sección
 *       <campo> <valor>          # campo del ítem (más indentado)
 */

const KNOWN_TYPES = new Set<SectionType>([
  "title",
  "steps",
  "comparison",
  "stat",
  "codeSnippet",
  "architecture",
  "timeline",
  "list",
  "callout",
  "versus",
  "flow",
  "roadmap",
  "iconGrid",
  "columns",
  "chart",
  "quote",
  "kpi",
  "table",
  "progress",
]);

const FLOW_KINDS = new Set(["start", "process", "decision", "end"]);

// alias de tipos para ser tolerante con la IA / tipeos
const TYPE_ALIASES: Record<string, SectionType> = {
  title: "title",
  header: "title",
  steps: "steps",
  step: "steps",
  pipeline: "steps",
  comparison: "comparison",
  compare: "comparison",
  stat: "stat",
  stats: "stat",
  metrics: "stat",
  code: "codeSnippet",
  codesnippet: "codeSnippet",
  snippet: "codeSnippet",
  architecture: "architecture",
  arch: "architecture",
  diagram: "architecture",
  timeline: "timeline",
  roadmap: "roadmap",
  ruta: "roadmap",
  path: "roadmap",
  list: "list",
  features: "list",
  callout: "callout",
  note: "callout",
  versus: "versus",
  vs: "versus",
  flow: "flow",
  flowchart: "flow",
  icongrid: "iconGrid",
  grid: "iconGrid",
  columns: "columns",
  cols: "columns",
  columnas: "columns",
  chart: "chart",
  grafico: "chart",
  grafica: "chart",
  quote: "quote",
  cita: "quote",
  testimonial: "quote",
  kpi: "kpi",
  metric: "kpi",
  bignumber: "kpi",
  table: "table",
  tabla: "table",
  progress: "progress",
  progreso: "progress",
  bars: "progress",
};

interface RawSection {
  type: SectionType;
  [key: string]: unknown;
}

function newSection(type: SectionType): RawSection {
  switch (type) {
    case "comparison":
      return { type, columns: [] };
    case "architecture":
      return { type, nodes: [], edges: [] };
    case "callout":
      return { type, text: "", tone: "info" };
    case "codeSnippet":
      return { type, code: "" };
    case "title":
      return { type, text: "" };
    case "versus":
      return { type, left: { title: "" }, right: { title: "" }, rows: [] };
    case "columns":
      return { type, columns: [] };
    case "chart":
      return { type, chart: "bar", items: [] };
    case "quote":
      return { type, text: "" };
    case "kpi":
      return { type, value: "", trend: "flat" };
    case "table":
      return { type, columns: [], rows: [] };
    default:
      return { type, items: [] };
  }
}

function indentOf(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1]!.replace(/\t/g, "  ").length : 0;
}

function splitKv(trimmed: string): { key: string; value: string } {
  const idx = trimmed.search(/\s/);
  if (idx === -1) return { key: trimmed.toLowerCase(), value: "" };
  return { key: trimmed.slice(0, idx).toLowerCase(), value: trimmed.slice(idx + 1).trim() };
}

function setSectionField(section: RawSection, key: string, value: string): void {
  // Estilo inline: `accent <color>` sobrescribe el acento de CUALQUIER sección.
  if (key === "accent") {
    if (value) section.accent = value;
    return;
  }
  switch (section.type) {
    case "title":
      if (key === "text" || key === "subtitle" || key === "icon") section[key] = value;
      break;
    case "callout":
      if (key === "text") section.text = value;
      else if (key === "tone") section.tone = value;
      break;
    case "codeSnippet":
      if (key === "language" || key === "lang") section.language = value;
      else if (key === "heading") section.heading = value;
      else if (key === "code") section.code = section.code ? `${section.code}\n${value}` : value;
      else if (key === "note" || key === "annotation") {
        const list = (section.annotations as string[] | undefined) ?? [];
        list.push(value);
        section.annotations = list;
      }
      break;
    case "versus": {
      const left = section.left as Record<string, unknown>;
      const right = section.right as Record<string, unknown>;
      if (key === "heading") section.heading = value;
      else if (key === "left" || key === "lefttitle") left.title = value;
      else if (key === "right" || key === "righttitle") right.title = value;
      else if (key === "lefticon") left.icon = value;
      else if (key === "righticon") right.icon = value;
      else if (key === "leftcolor") left.color = value;
      else if (key === "rightcolor") right.color = value;
      break;
    }
    case "quote":
      if (key === "text" || key === "quote") section.text = value;
      else if (key === "author" || key === "by") section.author = value;
      else if (key === "role") section.role = value;
      else if (key === "icon") section.icon = value;
      break;
    case "kpi":
      if (key === "value") section.value = value;
      else if (key === "label") section.label = value;
      else if (key === "delta" || key === "change") section.delta = value;
      else if (key === "trend") section.trend = value;
      else if (key === "icon") section.icon = value;
      break;
    case "table": {
      const cells = (v: string): string[] => v.split("|").map((c) => c.trim());
      if (key === "heading") section.heading = value;
      else if (key === "cols" || key === "columns" || key === "header") section.columns = cells(value);
      else if (key === "row") (section.rows as string[][]).push(cells(value));
      break;
    }
    default:
      if (key === "heading") section.heading = value;
      else if (key === "unit" && section.type === "progress") section.unit = value;
      else if (key === "columns" && section.type === "iconGrid") {
        const num = Number(value);
        if (Number.isFinite(num)) section.columns = num;
      } else if (section.type === "chart" && (key === "chart" || key === "type2" || key === "kind")) {
        section.chart = value;
      } else if (section.type === "chart" && key === "unit") {
        section.unit = value;
      }
      break;
  }
}

function addItem(section: RawSection, key: string, value: string): Record<string, unknown> | null {
  if (section.type === "comparison") {
    const col: Record<string, unknown> = { title: "", icon: undefined, points: [] };
    if (key === "title" || key === "label") col.title = value;
    else if (key === "icon") col.icon = value;
    (section.columns as unknown[]).push(col);
    return col;
  }
  if (section.type === "architecture") {
    if (key === "node") {
      const { key: id, value: label } = splitKv(value);
      const node: Record<string, unknown> = { id, label: label || id };
      (section.nodes as unknown[]).push(node);
      return node;
    }
    if (key === "edge") {
      const parts = value.split(/\s+/);
      const edge: Record<string, unknown> = {
        from: parts[0] ?? "",
        to: parts[1] ?? "",
        label: parts.slice(2).join(" ") || undefined,
      };
      (section.edges as unknown[]).push(edge);
      return edge;
    }
    return null;
  }
  if (section.type === "versus") {
    const row: Record<string, unknown> = { label: "", leftTone: "neutral", rightTone: "neutral" };
    if (key === "label" || key === "row") row.label = value;
    else applyItemField("versus", row, key, value);
    (section.rows as unknown[]).push(row);
    return row;
  }
  if (section.type === "flow") {
    const kind = FLOW_KINDS.has(key) ? key : "process";
    const item: Record<string, unknown> = { kind, label: key === "label" ? value : value || "" };
    (section.items as unknown[]).push(item);
    return item;
  }
  // tipos con lista "items"
  const item: Record<string, unknown> = {};
  applyItemField(section.type, item, key, value);
  (section.items as unknown[]).push(item);
  return item;
}

function applyItemField(
  type: SectionType,
  item: Record<string, unknown>,
  key: string,
  value: string,
): void {
  if (type === "comparison") {
    if (key === "point" || key === "-") (item.points as string[]).push(value);
    else if (key === "title" || key === "label") item.title = value;
    else if (key === "icon") item.icon = value;
    return;
  }
  if (type === "versus") {
    if (key === "label") item.label = value;
    else if (key === "l" || key === "left") item.left = value;
    else if (key === "r" || key === "right") item.right = value;
    else if (key === "ltone" || key === "lefttone") item.leftTone = value;
    else if (key === "rtone" || key === "righttone") item.rightTone = value;
    else if (key === "icon") item.icon = value;
    return;
  }
  if (type === "flow") {
    if (key === "label") item.label = value;
    else if (key === "branch" || key === "no") item.branch = value;
    else if (key === "kind") item.kind = value;
    return;
  }
  if (type === "roadmap") {
    if (key === "label") item.label = value;
    else if (key === "desc") item.desc = value;
    else if (key === "icon") item.icon = value;
    else if (key === "point" || key === "learn") {
      const arr = (item.points as string[]) ?? [];
      arr.push(value);
      item.points = arr;
    }
    return;
  }
  if (type === "iconGrid") {
    if (key === "label" || key === "desc" || key === "icon") item[key] = value;
    return;
  }
  if (type === "chart") {
    if (key === "label" || key === "color") item[key] = value;
    else if (key === "value") item.value = Number(value);
    return;
  }
  if (type === "progress") {
    if (key === "label" || key === "icon") item[key] = value;
    else if (key === "value") item.value = Number(String(value).replace("%", ""));
    return;
  }
  // steps/stat/list/timeline
  const allowed = ["label", "desc", "icon", "tone", "value", "unit", "date"];
  if (allowed.includes(key)) item[key] = value;
}

/** Elimina ítems/sección claramente incompletos para no romper el render. */
function sanitize(sections: RawSection[]): Section[] {
  const out: RawSection[] = [];
  for (const s of sections) {
    if (s.type === "title") {
      if (s.text) out.push(s);
    } else if (s.type === "callout") {
      if (s.text) out.push(s);
    } else if (s.type === "codeSnippet") {
      if (s.code) out.push(s);
    } else if (s.type === "comparison") {
      const cols = (s.columns as Record<string, unknown>[]).filter((c) => c.title);
      if (cols.length >= 1) out.push({ ...s, columns: cols });
    } else if (s.type === "architecture") {
      const nodes = (s.nodes as Record<string, unknown>[]).filter((nNode) => nNode.id && nNode.label);
      if (nodes.length >= 1) out.push({ ...s, nodes });
    } else if (s.type === "versus") {
      const left = s.left as Record<string, unknown>;
      const right = s.right as Record<string, unknown>;
      const rows = (s.rows as Record<string, unknown>[]).filter((r) => r.label);
      if (left.title && right.title && rows.length >= 1) out.push({ ...s, rows });
    } else if (s.type === "flow") {
      const items = (s.items as Record<string, unknown>[]).filter((it) => it.label);
      if (items.length >= 1) out.push({ ...s, items });
    } else if (s.type === "columns") {
      const cols = (s.columns as { sections: RawSection[] }[])
        .map((c) => ({ sections: sanitize(c.sections) }))
        .filter((c) => c.sections.length >= 1);
      if (cols.length >= 2) out.push({ ...s, columns: cols });
    } else if (s.type === "chart") {
      const items = (s.items as Record<string, unknown>[]).filter(
        (it) => it.label && Number.isFinite(it.value as number),
      );
      if (items.length >= 1) out.push({ ...s, items });
    } else if (s.type === "quote") {
      if (s.text) out.push(s);
    } else if (s.type === "kpi") {
      if (s.value) out.push(s);
    } else if (s.type === "table") {
      const cols = (s.columns as string[]).filter(Boolean);
      const rows = (s.rows as string[][]).filter((r) => r.some((c) => c));
      if (cols.length >= 1 && rows.length >= 1) out.push({ ...s, columns: cols, rows });
    } else if (s.type === "progress") {
      const items = (s.items as Record<string, unknown>[]).filter(
        (it) => it.label && Number.isFinite(it.value as number),
      );
      if (items.length >= 1) out.push({ ...s, items });
    } else {
      const items = (s.items as Record<string, unknown>[]).filter(
        (it) => it.label || it.value || it.date,
      );
      if (items.length >= 1) out.push({ ...s, items });
    }
  }
  return out as unknown as Section[];
}

/**
 * Parsea el DSL a un `InfographicDoc`. Nunca lanza; devuelve el mejor documento
 * posible con la entrada disponible.
 */
export function parseDsl(source: string): InfographicDoc {
  const doc: {
    template: string;
    theme?: string;
    title?: string;
    sections: Section[];
    footer?: { text: string; note?: string; icon?: string };
  } = {
    template: "feature-list",
    sections: [],
  };
  if (!source || typeof source !== "string") return doc;

  const rawSections: RawSection[] = [];
  let section: RawSection | null = null;
  let currentItem: Record<string, unknown> | null = null;
  let itemIndent = -1;
  // Contexto de columnas (anidamiento de secciones).
  let columnsSection: RawSection | null = null;
  let currentColumn: { sections: RawSection[] } | null = null;

  const resolveType = (value: string): SectionType | null => {
    const typeKey = value.toLowerCase().replace(/[^a-z]/g, "");
    const type = TYPE_ALIASES[typeKey];
    return type && KNOWN_TYPES.has(type) ? type : null;
  };

  for (const rawLine of source.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const indent = indentOf(rawLine);
    const trimmed = rawLine.trim();

    // nivel documento
    if (indent === 0) {
      const { key, value } = splitKv(trimmed);
      columnsSection = null;
      currentColumn = null;
      if (key === "template") doc.template = value || "feature-list";
      else if (key === "theme") doc.theme = value || undefined;
      else if (key === "title") doc.title = value;
      else if (key === "footer") doc.footer = { ...(doc.footer ?? {}), text: value };
      else if (key === "footernote" || key === "footnote")
        doc.footer = { text: "", ...(doc.footer ?? {}), note: value };
      else if (key === "footericon")
        doc.footer = { text: "", ...(doc.footer ?? {}), icon: value };
      else if (key === "section") {
        const type = resolveType(value);
        if (type) {
          section = newSection(type);
          rawSections.push(section);
          if (type === "columns") columnsSection = section;
        } else {
          section = null;
        }
        currentItem = null;
        itemIndent = -1;
      }
      continue;
    }

    // dentro de un bloque de columnas: estructura (ratio / col / section anidada)
    if (columnsSection) {
      const { key, value } = splitKv(trimmed);
      if (trimmed === "col" || trimmed.startsWith("col ")) {
        currentColumn = { sections: [] };
        (columnsSection.columns as { sections: RawSection[] }[]).push(currentColumn);
        section = null;
        currentItem = null;
        itemIndent = -1;
        continue;
      }
      if (key === "ratio") {
        columnsSection.ratio = value
          .split(/[\s,]+/)
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0);
        continue;
      }
      if (key === "section") {
        const type = resolveType(value);
        if (type && type !== "columns" && currentColumn) {
          section = newSection(type);
          currentColumn.sections.push(section);
        } else {
          section = null;
        }
        currentItem = null;
        itemIndent = -1;
        continue;
      }
      // si no es estructura, cae al manejo normal de la sección anidada activa
    }

    if (!section) continue;

    // nuevo ítem
    if (trimmed.startsWith("- ") || trimmed === "-") {
      const body = trimmed.replace(/^-\s*/, "");
      const { key, value } = body ? splitKv(body) : { key: "label", value: "" };
      currentItem = addItem(section, key || "label", value);
      itemIndent = indent;
      continue;
    }

    // campo
    const { key, value } = splitKv(trimmed);
    if (currentItem && indent > itemIndent) {
      applyItemField(section.type, currentItem, key, value);
    } else {
      currentItem = null;
      setSectionField(section, key, value);
    }
  }

  doc.sections = sanitize(rawSections);
  return doc;
}

/* ------------------------------ stringify -------------------------------- */

function emitItem(prefix: string, fields: [string, unknown][]): string {
  const [first, ...rest] = fields.filter(([, v]) => v !== undefined && v !== "");
  if (!first) return "";
  let out = `${prefix}- ${first[0]} ${first[1]}\n`;
  for (const [k, v] of rest) out += `${prefix}    ${k} ${v}\n`;
  return out;
}

/** Serializa el cuerpo de una sección con el prefijo de indentación dado. */
function emitSectionBody(s: Section, p: string): string {
  let out = "";
  switch (s.type) {
      case "title":
        out += `${p}text ${s.text}\n`;
        if (s.subtitle) out += `${p}subtitle ${s.subtitle}\n`;
        if (s.icon) out += `${p}icon ${s.icon}\n`;
        break;
      case "callout":
        out += `${p}text ${s.text}\n${p}tone ${s.tone}\n`;
        break;
      case "codeSnippet":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        if (s.language) out += `${p}language ${s.language}\n`;
        for (const ln of s.code.split("\n")) out += `${p}code ${ln}\n`;
        for (const note of s.annotations ?? []) out += `${p}note ${note}\n`;
        break;
      case "comparison":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        for (const col of s.columns) {
          out += `${p}- title ${col.title}\n`;
          if (col.icon) out += `${p}    icon ${col.icon}\n`;
          for (const pt of col.points) out += `${p}    point ${pt}\n`;
        }
        break;
      case "architecture":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        for (const node of s.nodes) out += `${p}- node ${node.id} ${node.label}\n`;
        for (const edge of s.edges) out += `${p}- edge ${edge.from} ${edge.to}${edge.label ? " " + edge.label : ""}\n`;
        break;
      case "stat":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        for (const it of s.items)
          out += emitItem(p, [
            ["value", it.value],
            ["label", it.label],
            ["unit", it.unit],
            ["icon", it.icon],
          ]);
        break;
      case "timeline":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        for (const it of s.items)
          out += emitItem(p, [
            ["date", it.date],
            ["label", it.label],
            ["desc", it.desc],
          ]);
        break;
      case "versus":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        out += `${p}left ${s.left.title}\n`;
        if (s.left.icon) out += `${p}lefticon ${s.left.icon}\n`;
        out += `${p}right ${s.right.title}\n`;
        if (s.right.icon) out += `${p}righticon ${s.right.icon}\n`;
        for (const row of s.rows) {
          out += `${p}- label ${row.label}\n`;
          if (row.left) out += `${p}    l ${row.left}\n`;
          if (row.right) out += `${p}    r ${row.right}\n`;
          if (row.leftTone !== "neutral") out += `${p}    ltone ${row.leftTone}\n`;
          if (row.rightTone !== "neutral") out += `${p}    rtone ${row.rightTone}\n`;
        }
        break;
      case "flow":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        for (const it of s.items) {
          out += `${p}- ${it.kind} ${it.label}\n`;
          if (it.branch) out += `${p}    branch ${it.branch}\n`;
        }
        break;
      case "roadmap":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        for (const it of s.items) {
          out += `${p}- label ${it.label}\n`;
          if (it.desc) out += `${p}    desc ${it.desc}\n`;
          if (it.icon) out += `${p}    icon ${it.icon}\n`;
          for (const pt of it.points) out += `${p}    point ${pt}\n`;
        }
        break;
      case "iconGrid":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        if (s.columns) out += `${p}columns ${s.columns}\n`;
        for (const it of s.items)
          out += emitItem(p, [
            ["icon", it.icon],
            ["label", it.label],
            ["desc", it.desc],
          ]);
        break;
      case "chart":
        out += `${p}chart ${s.chart}\n`;
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        if (s.unit) out += `${p}unit ${s.unit}\n`;
        for (const it of s.items)
          out += emitItem(p, [
            ["label", it.label],
            ["value", it.value],
            ["color", it.color],
          ]);
        break;
      case "quote":
        out += `${p}text ${s.text}\n`;
        if (s.author) out += `${p}author ${s.author}\n`;
        if (s.role) out += `${p}role ${s.role}\n`;
        if (s.icon) out += `${p}icon ${s.icon}\n`;
        break;
      case "kpi":
        out += `${p}value ${s.value}\n`;
        if (s.label) out += `${p}label ${s.label}\n`;
        if (s.delta) out += `${p}delta ${s.delta}\n`;
        if (s.trend && s.trend !== "flat") out += `${p}trend ${s.trend}\n`;
        if (s.icon) out += `${p}icon ${s.icon}\n`;
        break;
      case "table":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        out += `${p}cols ${s.columns.join(" | ")}\n`;
        for (const row of s.rows) out += `${p}row ${row.join(" | ")}\n`;
        break;
      case "progress":
        if (s.heading) out += `${p}heading ${s.heading}\n`;
        if (s.unit && s.unit !== "%") out += `${p}unit ${s.unit}\n`;
        for (const it of s.items)
          out += emitItem(p, [
            ["label", it.label],
            ["value", it.value],
            ["icon", it.icon],
          ]);
        break;
      case "columns":
        if (s.ratio) out += `${p}ratio ${s.ratio.join(" ")}\n`;
        for (const col of s.columns) {
          out += `${p}col\n`;
          for (const sec of col.sections) {
            out += `${p}  section ${sec.type}\n`;
            out += emitSectionBody(sec, `${p}    `);
          }
        }
        break;
      default:
        if ("heading" in s && s.heading) out += `${p}heading ${s.heading}\n`;
        for (const it of s.items)
          out += emitItem(p, [
            ["label", it.label],
            ["desc", it.desc],
            ["icon", it.icon],
            ["tone", "tone" in it ? it.tone : undefined],
          ]);
        break;
    }
  const acc = (s as { accent?: string }).accent;
  if (acc) out += `${p}accent ${acc}\n`;
  return out;
}

/** Serializa un `InfographicDoc` al DSL textual (round-trip aproximado). */
export function stringify(doc: InfographicDoc): string {
  let out = `template ${doc.template}\n`;
  if (doc.theme) out += `theme ${doc.theme}\n`;
  if (doc.title) out += `title ${doc.title}\n`;
  if (doc.footer) {
    out += `footer ${doc.footer.text}\n`;
    if (doc.footer.note) out += `footernote ${doc.footer.note}\n`;
    if (doc.footer.icon) out += `footericon ${doc.footer.icon}\n`;
  }

  for (const s of doc.sections) {
    out += `\nsection ${s.type}\n`;
    out += emitSectionBody(s, "  ");
  }
  return out;
}
