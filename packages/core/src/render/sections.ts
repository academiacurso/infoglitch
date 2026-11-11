import type {
  ArchitectureSection,
  CalloutSection,
  ChartSection,
  CodeSnippetSection,
  ColumnsSection,
  ComparisonSection,
  FlowSection,
  IconGridSection,
  ListSection,
  RoadmapSection,
  Section,
  StatSection,
  StepsSection,
  TimelineSection,
  TitleSection,
  VersusSection,
} from "../model/schema.js";
import type { Theme } from "../theme/index.js";
import { themeAccents } from "../theme/index.js";
import { highlightLine } from "./highlight.js";
import { el, icon, line, paragraph, rect, text, wrapText } from "./svg.js";

export interface Block {
  svg: string;
  height: number;
}

/** Estilo por sección: acento (neón), si el panel es neón y la ref del filtro glow. */
export interface SectionStyle {
  accent: string;
  neon: boolean;
  glow: string | undefined;
}

export function styleFor(theme: Theme): SectionStyle {
  return { accent: theme.accent, neon: theme.panelStyle === "neon", glow: undefined };
}

const GAP = 20;

function card(
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  style: SectionStyle,
  alt = false,
): string {
  let out = "";
  if (style.neon && style.glow) {
    out += el("rect", {
      x,
      y,
      width: w,
      height: h,
      rx: theme.radius,
      fill: "none",
      stroke: style.accent,
      "stroke-width": 2,
      filter: style.glow,
      opacity: 0.85,
    });
  }
  out += rect({
    x,
    y,
    width: w,
    height: h,
    rx: theme.radius,
    fill: alt ? theme.surfaceAlt : theme.surface,
    stroke: style.neon ? style.accent : theme.border,
    strokeWidth: style.neon ? 1.5 : 1,
  });
  return out;
}

function heading(section: { heading?: string }, x: number, y: number, theme: Theme, style: SectionStyle): Block {
  if (!section.heading) return { svg: "", height: 0 };
  return {
    svg: text({
      x,
      y: y + 18,
      text: section.heading,
      size: 18,
      weight: 700,
      fill: style.accent,
      family: theme.fontFamily,
    }),
    height: 32,
  };
}

/* ------------------------------- title ---------------------------------- */
function renderTitle(s: TitleSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const hasIcon = Boolean(s.icon);
  const padX = 28;
  const textX = x + padX + (hasIcon ? 68 : 0);
  const titleFill = theme.titleGradient ? "url(#ig-title)" : theme.text;
  const title = paragraph({
    x: textX,
    y: y + 26,
    text: s.text,
    maxWidth: w - padX * 2 - (hasIcon ? 68 : 0),
    size: 30,
    weight: 800,
    fill: titleFill,
    family: theme.fontFamily,
    maxLines: 2,
  });
  let sub: Block = { svg: "", height: 0 };
  if (s.subtitle) {
    sub = paragraph({
      x: textX,
      y: y + 26 + title.height + 6,
      text: s.subtitle,
      maxWidth: w - padX * 2 - (hasIcon ? 68 : 0),
      size: 16,
      fill: theme.textMuted,
      family: theme.fontFamily,
      maxLines: 2,
    });
  }
  const inner = 52 + title.height + (sub.height ? sub.height + 6 : 0);
  const h = Math.max(96, inner);
  const iconSvg = hasIcon ? icon(s.icon, x + padX, y + (h - 44) / 2, 44, style.accent) : "";
  const accentBar = rect({ x, y, width: 6, height: h, rx: 0, fill: style.accent });
  return { svg: card(x, y, w, h, theme, style) + accentBar + iconSvg + title.svg + sub.svg, height: h };
}

/* ------------------------------- steps ---------------------------------- */
function renderSteps(s: StepsSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const n = s.items.length;
  const arrow = 26;
  const cardH = 150;
  const cardW = Math.max(120, (w - arrow * (n - 1)) / n);
  let parts = head.svg;

  s.items.forEach((item, i) => {
    const cx = x + i * (cardW + arrow);
    parts += card(cx, top, cardW, cardH, theme, style, true);
    parts += el("circle", { cx: cx + 22, cy: top + 24, r: 13, fill: style.accent });
    parts += text({
      x: cx + 22,
      y: top + 29,
      text: String(i + 1),
      size: 14,
      weight: 700,
      fill: "#fff",
      anchor: "middle",
      family: theme.fontFamily,
    });
    if (item.icon) parts += icon(item.icon, cx + cardW - 40, top + 12, 24, theme.accent2);
    const label = paragraph({
      x: cx + 16,
      y: top + 42,
      text: item.label,
      maxWidth: cardW - 32,
      size: 15,
      weight: 700,
      fill: theme.text,
      family: theme.fontFamily,
      maxLines: 2,
    });
    parts += label.svg;
    if (item.desc) {
      parts += paragraph({
        x: cx + 16,
        y: top + 42 + label.height + 6,
        text: item.desc,
        maxWidth: cardW - 32,
        size: 12.5,
        fill: theme.textMuted,
        family: theme.fontFamily,
        maxLines: 4,
      }).svg;
    }
    if (i < n - 1) {
      const ay = top + cardH / 2;
      const ax = cx + cardW + 5;
      parts += line(ax, ay, ax + arrow - 10, ay, theme.textMuted, 2);
      parts += el("path", {
        d: `M${ax + arrow - 14} ${ay - 5} L${ax + arrow - 6} ${ay} L${ax + arrow - 14} ${ay + 5}`,
        fill: "none",
        stroke: theme.textMuted,
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
    }
  });

  return { svg: parts, height: head.height + cardH };
}

/* ---------------------------- comparison -------------------------------- */
function renderComparison(s: ComparisonSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const n = s.columns.length;
  const gap = 16;
  const colW = (w - gap * (n - 1)) / n;
  const lineH = 22;
  const headerH = 48;

  const maxPoints = Math.max(1, ...s.columns.map((c) => c.points.length));
  const bodyH = maxPoints * lineH + 16;
  const colH = headerH + bodyH;

  let parts = head.svg;
  s.columns.forEach((col, i) => {
    const cx = x + i * (colW + gap);
    parts += card(cx, top, colW, colH, theme, style);
    parts += rect({ x: cx, y: top, width: colW, height: headerH, rx: theme.radius, fill: theme.surfaceAlt });
    parts += rect({ x: cx, y: top + headerH - theme.radius, width: colW, height: theme.radius, fill: theme.surfaceAlt });
    if (col.icon) parts += icon(col.icon, cx + 14, top + 12, 24, style.accent);
    parts += text({
      x: cx + (col.icon ? 46 : 16),
      y: top + 30,
      text: col.title,
      size: 16,
      weight: 700,
      fill: theme.text,
      family: theme.fontFamily,
    });
    col.points.forEach((p, j) => {
      const py = top + headerH + 20 + j * lineH;
      parts += el("circle", { cx: cx + 18, cy: py - 4, r: 3, fill: style.accent });
      parts += text({
        x: cx + 30,
        y: py,
        text: p,
        size: 13,
        fill: theme.textMuted,
        family: theme.fontFamily,
      });
    });
  });

  return { svg: parts, height: head.height + colH };
}

/* ------------------------------- stat ----------------------------------- */
function renderStat(s: StatSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const perRow = Math.min(4, Math.max(1, s.items.length));
  const gap = 16;
  const cardW = (w - gap * (perRow - 1)) / perRow;
  const cardH = 110;
  const rows = Math.ceil(s.items.length / perRow);

  let parts = head.svg;
  s.items.forEach((item, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    const cx = x + c * (cardW + gap);
    const cy = top + r * (cardH + gap);
    parts += card(cx, cy, cardW, cardH, theme, style, true);
    if (item.icon) parts += icon(item.icon, cx + 16, cy + 16, 22, style.accent);
    parts += text({
      x: cx + 20,
      y: cy + 68,
      text: item.value + (item.unit ? ` ${item.unit}` : ""),
      size: 30,
      weight: 800,
      fill: style.accent,
      family: theme.monoFamily,
    });
    parts += text({
      x: cx + 20,
      y: cy + 92,
      text: item.label,
      size: 13,
      fill: theme.textMuted,
      family: theme.fontFamily,
    });
  });

  const h = rows * cardH + (rows - 1) * gap;
  return { svg: parts, height: head.height + h };
}

/* ---------------------------- codeSnippet ------------------------------- */
function renderCode(s: CodeSnippetSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const lines = s.code.replace(/\t/g, "  ").split("\n");
  const lineH = 20;
  const padTop = 44;
  const padBottom = 16;
  const codeH = padTop + lines.length * lineH + padBottom;
  const pal = theme.code ?? {
    bg: "#0a0e14",
    text: "#d7dee8",
    keyword: "#ff7b72",
    string: "#a5d6ff",
    comment: "#8b949e",
    number: "#79c0ff",
    fn: "#d2a8ff",
    punct: "#c9d1d9",
  };

  let parts = head.svg;
  parts += rect({ x, y: top, width: w, height: codeH, rx: theme.radius, fill: pal.bg, stroke: style.neon ? style.accent : theme.border, strokeWidth: 1 });
  ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((color, i) => {
    parts += el("circle", { cx: x + 20 + i * 18, cy: top + 20, r: 5, fill: color });
  });
  if (s.language) {
    parts += text({
      x: x + w - 16,
      y: top + 24,
      text: s.language,
      size: 12,
      fill: pal.comment,
      anchor: "end",
      family: theme.monoFamily,
    });
  }
  lines.forEach((ln, i) => {
    parts += highlightLine(ln, s.language, pal, x + 20, top + padTop + i * lineH, theme.monoFamily, 13);
  });
  let h = head.height + codeH;
  if (s.annotations?.length) {
    let ay = top + codeH + 10;
    for (const note of s.annotations) {
      const p = paragraph({
        x: x + 4,
        y: ay,
        text: `// ${note}`,
        maxWidth: w - 8,
        size: 12.5,
        fill: theme.textMuted,
        family: theme.monoFamily,
        maxLines: 2,
      });
      parts += p.svg;
      ay += p.height + 4;
    }
    h += ay - (top + codeH + 10) + 10;
  }
  return { svg: parts, height: h };
}

/* --------------------------- architecture ------------------------------- */
function renderArchitecture(s: ArchitectureSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const n = s.nodes.length;
  const perRow = Math.min(4, Math.max(1, n));
  const gap = 28;
  const nodeW = (w - gap * (perRow - 1)) / perRow;
  const nodeH = 72;
  const rowGap = 56;
  const rows = Math.ceil(n / perRow);

  const centers = new Map<string, { cx: number; cy: number }>();
  let nodesSvg = "";
  s.nodes.forEach((node, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    const nx = x + c * (nodeW + gap);
    const ny = top + r * (nodeH + rowGap);
    centers.set(node.id, { cx: nx + nodeW / 2, cy: ny + nodeH / 2 });
    nodesSvg += card(nx, ny, nodeW, nodeH, theme, style, true);
    if (node.icon) nodesSvg += icon(node.icon, nx + 14, ny + nodeH / 2 - 11, 22, style.accent);
    nodesSvg += text({
      x: nx + (node.icon ? 46 : 16),
      y: ny + nodeH / 2 + 5,
      text: node.label,
      size: 14,
      weight: 600,
      fill: theme.text,
      family: theme.fontFamily,
    });
  });

  let edgesSvg = "";
  for (const edge of s.edges) {
    const a = centers.get(edge.from);
    const b = centers.get(edge.to);
    if (!a || !b) continue;
    edgesSvg += line(a.cx, a.cy, b.cx, b.cy, theme.border, 2);
    if (edge.label) {
      edgesSvg += text({
        x: (a.cx + b.cx) / 2,
        y: (a.cy + b.cy) / 2 - 4,
        text: edge.label,
        size: 11,
        fill: theme.textMuted,
        anchor: "middle",
        family: theme.fontFamily,
      });
    }
  }

  const h = rows * nodeH + (rows - 1) * rowGap;
  return { svg: head.svg + edgesSvg + nodesSvg, height: head.height + h };
}

/* ------------------------------ timeline -------------------------------- */
function renderTimeline(s: TimelineSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const railX = x + 16;
  const itemGap = 18;
  let cy = top + 8;
  let items = "";

  s.items.forEach((item, i) => {
    const labelP = paragraph({
      x: railX + 28,
      y: cy - 6,
      text: item.label,
      maxWidth: w - 44,
      size: 15,
      weight: 700,
      fill: theme.text,
      family: theme.fontFamily,
      maxLines: 2,
    });
    const dateSvg = text({
      x: railX + 28,
      y: cy + labelP.height + 8,
      text: item.date,
      size: 12,
      weight: 700,
      fill: style.accent,
      family: theme.monoFamily,
    });
    let descBlock: Block = { svg: "", height: 0 };
    if (item.desc) {
      descBlock = paragraph({
        x: railX + 28,
        y: cy + labelP.height + 14,
        text: item.desc,
        maxWidth: w - 44,
        size: 13,
        fill: theme.textMuted,
        family: theme.fontFamily,
        maxLines: 3,
      });
    }
    items += el("circle", { cx: railX, cy: cy + 2, r: 6, fill: style.accent, stroke: theme.background, "stroke-width": 2 });
    items += labelP.svg + dateSvg + descBlock.svg;
    const blockH = labelP.height + 16 + descBlock.height + itemGap;
    if (i < s.items.length - 1) {
      items += line(railX, cy + 10, railX, cy + blockH, theme.border, 2);
    }
    cy += blockH;
  });

  return { svg: head.svg + items, height: head.height + (cy - top) };
}

/* -------------------------------- list ---------------------------------- */
function renderList(s: ListSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const rowGap = 14;
  let cy = top;
  let items = "";

  const toneColor = (tone: "pro" | "con" | "neutral") =>
    tone === "pro" ? theme.accent2 : tone === "con" ? "#f85149" : style.accent;
  const toneIcon = (tone: "pro" | "con" | "neutral", custom?: string) =>
    custom ?? (tone === "pro" ? "check" : tone === "con" ? "x" : "arrowRight");

  for (const item of s.items) {
    const labelP = paragraph({
      x: x + 44,
      y: cy,
      text: item.label,
      maxWidth: w - 56,
      size: 15,
      weight: 600,
      fill: theme.text,
      family: theme.fontFamily,
      maxLines: 2,
    });
    let descBlock: Block = { svg: "", height: 0 };
    if (item.desc) {
      descBlock = paragraph({
        x: x + 44,
        y: cy + labelP.height + 2,
        text: item.desc,
        maxWidth: w - 56,
        size: 13,
        fill: theme.textMuted,
        family: theme.fontFamily,
        maxLines: 3,
      });
    }
    const rowH = Math.max(28, labelP.height + descBlock.height + 4);
    items += icon(toneIcon(item.tone, item.icon), x + 10, cy + 2, 24, toneColor(item.tone));
    items += labelP.svg + descBlock.svg;
    cy += rowH + rowGap;
  }

  return { svg: head.svg + items, height: head.height + (cy - top) };
}

/* ------------------------------ callout --------------------------------- */
function renderCallout(s: CalloutSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const color = s.tone === "warn" ? "#d29922" : s.tone === "success" ? theme.accent2 : style.accent;
  const padX = 48;
  const body = paragraph({
    x: x + padX,
    y: y + 16,
    text: s.text,
    maxWidth: w - padX - 20,
    size: 15,
    fill: theme.text,
    family: theme.fontFamily,
    maxLines: 6,
  });
  const h = Math.max(56, body.height + 32);
  const iconName = s.tone === "warn" ? "flag" : s.tone === "success" ? "check" : "zap";
  let svg = "";
  if (style.neon && style.glow) {
    svg += el("rect", { x, y, width: w, height: h, rx: theme.radius, fill: "none", stroke: color, "stroke-width": 2, filter: style.glow, opacity: 0.85 });
  }
  svg +=
    rect({ x, y, width: w, height: h, rx: theme.radius, fill: theme.surface, stroke: color, strokeWidth: 1 }) +
    rect({ x, y, width: 6, height: h, fill: color }) +
    icon(iconName, x + 18, y + (h - 24) / 2, 24, color) +
    body.svg;
  return { svg, height: h };
}

/* ------------------------------ versus ---------------------------------- */
function toneColorOf(t: "pro" | "con" | "neutral", theme: Theme, accent: string): string {
  return t === "pro" ? theme.accent2 : t === "con" ? "#f85149" : accent;
}
function toneIconOf(t: "pro" | "con" | "neutral"): string {
  return t === "pro" ? "check" : t === "con" ? "x" : "arrowRight";
}

function renderVersus(s: VersusSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const centerW = 148;
  const gap = 12;
  const sideW = (w - centerW - gap * 2) / 2;
  const centerX = x + sideW + gap;
  const rightX = centerX + centerW + gap;
  const headerH = 58;
  const leftColor = s.left.color ?? style.accent;
  const rightColor = s.right.color ?? theme.accent2;
  const lineH = 18;

  const columnHeader = (hx: number, color: string, col: { title: string; icon?: string }, dark: boolean) => {
    let o = rect({ x: hx, y: top, width: sideW, height: headerH, rx: theme.radius, fill: dark ? theme.surfaceAlt : color, stroke: dark ? color : undefined, strokeWidth: dark ? 1.5 : undefined });
    if (col.icon) o += icon(col.icon, hx + 16, top + headerH / 2 - 12, 24, dark ? color : "#ffffff");
    o += text({ x: hx + (col.icon ? 48 : 16), y: top + headerH / 2 + 6, text: col.title, size: 17, weight: 800, fill: dark ? theme.text : "#ffffff", family: theme.fontFamily });
    return o;
  };

  let parts = head.svg;
  parts += columnHeader(x, leftColor, s.left, false);
  parts += columnHeader(rightX, rightColor, s.right, true);

  let cy = top + headerH + 12;
  for (const row of s.rows) {
    const leftLines = row.left ? wrapText(row.left, sideW - 56, 13).slice(0, 3) : [];
    const rightLines = row.right ? wrapText(row.right, sideW - 56, 13).slice(0, 3) : [];
    const rowH = Math.max(52, Math.max(leftLines.length, rightLines.length, 1) * lineH + 28);

    parts += card(x, cy, sideW, rowH, theme, style, true);
    parts += icon(toneIconOf(row.leftTone), x + 14, cy + rowH / 2 - 11, 22, toneColorOf(row.leftTone, theme, style.accent));
    leftLines.forEach((ln, i) =>
      (parts += text({ x: x + 46, y: cy + rowH / 2 - (leftLines.length - 1) * (lineH / 2) + i * lineH + 4, text: ln, size: 13, fill: theme.text, family: theme.fontFamily })),
    );

    parts += card(rightX, cy, sideW, rowH, theme, style, true);
    parts += icon(toneIconOf(row.rightTone), rightX + 14, cy + rowH / 2 - 11, 22, toneColorOf(row.rightTone, theme, style.accent));
    rightLines.forEach((ln, i) =>
      (parts += text({ x: rightX + 46, y: cy + rowH / 2 - (rightLines.length - 1) * (lineH / 2) + i * lineH + 4, text: ln, size: 13, fill: theme.text, family: theme.fontFamily })),
    );

    const chipH = 38;
    const chipY = cy + rowH / 2 - chipH / 2;
    parts += rect({ x: centerX, y: chipY, width: centerW, height: chipH, rx: chipH / 2, fill: theme.surfaceAlt, stroke: style.accent, strokeWidth: 1.5 });
    if (row.icon) parts += icon(row.icon, centerX + 12, chipY + chipH / 2 - 9, 18, style.accent);
    parts += text({ x: centerX + centerW / 2 + (row.icon ? 10 : 0), y: chipY + chipH / 2 + 5, text: row.label, size: 12.5, weight: 700, fill: theme.text, anchor: "middle", family: theme.fontFamily });

    cy += rowH + 10;
  }

  return { svg: parts, height: head.height + (cy - top) };
}

/* -------------------------------- flow ---------------------------------- */
function renderFlow(s: FlowSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const cx = x + w * 0.34;
  const gap = 30;
  const green = theme.accent2;
  const red = "#f85149";
  let cy = top + 6;
  let parts = head.svg;

  s.items.forEach((item, i) => {
    if (item.kind === "decision") {
      const dw = 152;
      const dh = 86;
      const hw = dw / 2;
      const hh = dh / 2;
      const centerY = cy + hh;
      if (style.glow) {
        parts += el("polygon", { points: `${cx},${centerY - hh} ${cx + hw},${centerY} ${cx},${centerY + hh} ${cx - hw},${centerY}`, fill: "none", stroke: style.accent, "stroke-width": 2, filter: style.glow, opacity: 0.8 });
      }
      parts += el("polygon", { points: `${cx},${centerY - hh} ${cx + hw},${centerY} ${cx},${centerY + hh} ${cx - hw},${centerY}`, fill: theme.surface, stroke: style.accent, "stroke-width": 2 });
      const lines = wrapText(item.label, dw - 28, 12).slice(0, 3);
      lines.forEach((ln, k) =>
        (parts += text({ x: cx, y: centerY - (lines.length - 1) * 8 + k * 16 + 4, text: ln, size: 12, weight: 600, fill: theme.text, anchor: "middle", family: theme.fontFamily })),
      );
      if (item.branch) {
        const bx = cx + hw + 48;
        const bw = x + w - bx;
        if (bw > 70) {
          const bh = 46;
          const by = centerY - bh / 2;
          parts += line(cx + hw, centerY, bx, centerY, red, 2);
          parts += el("path", { d: `M${bx - 8} ${centerY - 5} L${bx} ${centerY} L${bx - 8} ${centerY + 5}`, fill: "none", stroke: red, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
          parts += text({ x: (cx + hw + bx) / 2, y: centerY - 8, text: "No", size: 12, weight: 700, fill: red, anchor: "middle", family: theme.fontFamily });
          parts += rect({ x: bx, y: by, width: bw, height: bh, rx: 8, fill: theme.surfaceAlt, stroke: red, strokeWidth: 1.5 });
          const bl = wrapText(item.branch, bw - 20, 12.5).slice(0, 2);
          bl.forEach((ln, k) =>
            (parts += text({ x: bx + 12, y: by + bh / 2 - (bl.length - 1) * 8 + k * 16 + 4, text: ln, size: 12.5, fill: theme.text, family: theme.fontFamily })),
          );
        }
      }
      cy += dh;
    } else {
      const nw = 240;
      const nh = 56;
      const nx = cx - nw / 2;
      const terminal = item.kind === "start" || item.kind === "end";
      const rx = terminal ? nh / 2 : theme.radius;
      const stroke = item.kind === "start" ? green : style.accent;
      if (style.glow) parts += el("rect", { x: nx, y: cy, width: nw, height: nh, rx, fill: "none", stroke, "stroke-width": 2, filter: style.glow, opacity: 0.8 });
      parts += rect({ x: nx, y: cy, width: nw, height: nh, rx, fill: theme.surface, stroke, strokeWidth: 1.6 });
      const lines = wrapText(item.label, nw - 28, 14).slice(0, 2);
      lines.forEach((ln, k) =>
        (parts += text({ x: cx, y: cy + nh / 2 - (lines.length - 1) * 9 + k * 18 + 5, text: ln, size: 14, weight: 600, fill: theme.text, anchor: "middle", family: theme.fontFamily })),
      );
      cy += nh;
    }

    if (i < s.items.length - 1) {
      const ay1 = cy;
      const ay2 = cy + gap;
      parts += line(cx, ay1, cx, ay2 - 8, theme.textMuted, 2);
      parts += el("path", { d: `M${cx - 5} ${ay2 - 13} L${cx} ${ay2 - 5} L${cx + 5} ${ay2 - 13}`, fill: "none", stroke: theme.textMuted, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
      if (item.kind === "decision") parts += text({ x: cx + 10, y: ay1 + 15, text: "Sí", size: 12, weight: 700, fill: green, family: theme.fontFamily });
      cy += gap;
    }
  });

  return { svg: parts, height: head.height + (cy - top) };
}

/* ------------------------------ roadmap --------------------------------- */
function renderRoadmap(s: RoadmapSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const accents = themeAccents(theme);
  const cx = x + w / 2;
  const centerCol = 96;
  const cardW = (w - centerCol) / 2 - 8;
  const pad = 16;
  const rowGap = 34;

  const blocks = s.items.map((item) => {
    const points = item.points ?? [];
    const labelLines = wrapText(item.label, cardW - pad * 2 - 28, 16).slice(0, 2);
    const descLines = item.desc ? wrapText(item.desc, cardW - pad * 2, 13).slice(0, 3) : [];
    const h =
      pad * 2 + labelLines.length * 22 + (descLines.length ? descLines.length * 17 + 6 : 0) + (points.length ? points.length * 20 + 6 : 0);
    return { item, points, labelLines, descLines, h: Math.max(84, h) };
  });

  const nodeYs: number[] = [];
  let body = "";
  let cursor = top + 10;

  blocks.forEach((b, i) => {
    const accent = accents[i % accents.length]!;
    const left = i % 2 === 0;
    const cardX = left ? x : x + w - cardW;
    const cardY = cursor;
    const nodeY = cardY + b.h / 2;
    nodeYs.push(nodeY);

    body += card(cardX, cardY, cardW, b.h, theme, { accent, neon: style.neon, glow: style.glow }, false);
    const linkFrom = left ? cardX + cardW : cardX;
    body += line(linkFrom, nodeY, cx + (left ? -22 : 22), nodeY, accent, 2);

    let ty = cardY + pad + 15;
    const labelX = cardX + pad + (b.item.icon ? 30 : 0);
    if (b.item.icon) body += icon(b.item.icon, cardX + pad - 2, cardY + pad, 22, accent);
    b.labelLines.forEach((ln, k) =>
      (body += text({ x: labelX, y: ty + k * 22, text: ln, size: 16, weight: 800, fill: accent, family: theme.fontFamily })),
    );
    ty += b.labelLines.length * 22 + 2;
    b.descLines.forEach((ln, k) =>
      (body += text({ x: cardX + pad, y: ty + k * 17, text: ln, size: 13, fill: theme.textMuted, family: theme.fontFamily })),
    );
    ty += b.descLines.length > 0 ? b.descLines.length * 17 + 8 : 4;
    b.points.forEach((pt, k) => {
      const py = ty + k * 20;
      body += icon("check", cardX + pad, py - 12, 16, theme.accent2);
      body += text({ x: cardX + pad + 22, y: py, text: pt, size: 12.5, fill: theme.text, family: theme.fontFamily });
    });

    cursor += b.h + rowGap;
  });

  // Camino serpenteante (detrás de las tarjetas y los nodos).
  let road = "";
  for (let i = 0; i < nodeYs.length - 1; i++) {
    const y1 = nodeYs[i]!;
    const y2 = nodeYs[i + 1]!;
    const swing = (i % 2 === 0 ? 1 : -1) * 54;
    const d = `M${cx} ${y1} C${cx + swing} ${y1 + (y2 - y1) * 0.35} ${cx - swing} ${y1 + (y2 - y1) * 0.65} ${cx} ${y2}`;
    road += el("path", { d, fill: "none", stroke: theme.surfaceAlt, "stroke-width": 14, "stroke-linecap": "round" });
    road += el("path", { d, fill: "none", stroke: theme.textMuted, "stroke-width": 2, "stroke-dasharray": "2 10", "stroke-linecap": "round", opacity: 0.7 });
  }

  // Nodos numerados (al frente).
  let nodes = "";
  nodeYs.forEach((ny, i) => {
    const accent = accents[i % accents.length]!;
    if (style.glow) nodes += el("circle", { cx, cy: ny, r: 22, fill: "none", stroke: accent, "stroke-width": 2, filter: style.glow, opacity: 0.8 });
    nodes += el("circle", { cx, cy: ny, r: 20, fill: theme.surface, stroke: accent, "stroke-width": 2.5 });
    nodes += text({ x: cx, y: ny + 6, text: String(i + 1), size: 18, weight: 800, fill: accent, anchor: "middle", family: theme.fontFamily });
  });

  return { svg: head.svg + road + body + nodes, height: head.height + (cursor - rowGap - top) + 10 };
}

/* ------------------------------ iconGrid -------------------------------- */
function renderIconGrid(s: IconGridSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const accents = themeAccents(theme);
  const n = s.items.length;
  const cols = Math.max(2, Math.min(6, s.columns ?? (n <= 3 ? n : n === 4 ? 4 : n % 3 === 0 ? 3 : 4)));
  const gap = 14;
  const cellW = (w - gap * (cols - 1)) / cols;
  const pad = 16;
  const iconSize = 40;

  const cells = s.items.map((it) => {
    const labelLines = wrapText(it.label, cellW - pad * 2, 15).slice(0, 2);
    const descLines = it.desc ? wrapText(it.desc, cellW - pad * 2, 12.5).slice(0, 4) : [];
    const ch = pad + iconSize + 16 + labelLines.length * 20 + (descLines.length ? descLines.length * 16 + 4 : 0) + pad;
    return { it, labelLines, descLines, ch };
  });
  const cellH = Math.max(100, ...cells.map((c) => c.ch));
  const rows = Math.ceil(n / cols);

  let body = "";
  cells.forEach((c, i) => {
    const r = Math.floor(i / cols);
    const col = i % cols;
    const cxp = x + col * (cellW + gap);
    const cyp = top + r * (cellH + gap);
    const accent = accents[i % accents.length]!;
    body += card(cxp, cyp, cellW, cellH, theme, { accent, neon: style.neon, glow: style.glow }, true);
    const centerX = cxp + cellW / 2;
    body += icon(c.it.icon, centerX - iconSize / 2, cyp + pad, iconSize, accent);
    let ty = cyp + pad + iconSize + 18;
    c.labelLines.forEach((ln, k) =>
      (body += text({ x: centerX, y: ty + k * 20, text: ln, size: 15, weight: 700, fill: theme.text, anchor: "middle", family: theme.fontFamily })),
    );
    ty += c.labelLines.length * 20 + 2;
    c.descLines.forEach((ln, k) =>
      (body += text({ x: centerX, y: ty + k * 16, text: ln, size: 12.5, fill: theme.textMuted, anchor: "middle", family: theme.fontFamily })),
    );
  });

  return { svg: head.svg + body, height: head.height + rows * cellH + (rows - 1) * gap };
}

/* ------------------------------ columns --------------------------------- */
function renderColumns(s: ColumnsSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const n = s.columns.length;
  const ratio = s.ratio && s.ratio.length === n ? s.ratio : s.columns.map(() => 1);
  const sum = ratio.reduce((a, b) => a + b, 0) || n;
  const gap = 16;
  const avail = w - gap * (n - 1);
  const accents = themeAccents(theme);

  let cx = x;
  let maxH = 0;
  let svg = "";
  let accentIdx = 0;

  s.columns.forEach((col, ci) => {
    const cw = avail * ((ratio[ci] ?? 1) / sum);
    let cursor = y;
    col.sections.forEach((sec, i) => {
      const accent = accents[accentIdx % accents.length]!;
      if (sec.type !== "title" && sec.type !== "callout") accentIdx++;
      const st: SectionStyle = { accent, neon: style.neon, glow: style.glow };
      const block = renderSection(sec, theme, cx, cursor, cw, st);
      svg += block.svg;
      cursor += block.height;
      if (i < col.sections.length - 1) cursor += GAP;
    });
    maxH = Math.max(maxH, cursor - y);
    cx += cw + gap;
  });

  return { svg, height: maxH };
}

/* ------------------------------- chart ---------------------------------- */
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function fmtNum(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

function renderChart(s: ChartSection, theme: Theme, x: number, y: number, w: number, style: SectionStyle): Block {
  const head = heading(s, x, y, theme, style);
  const top = y + head.height;
  const accents = themeAccents(theme);
  const data = s.items;
  const kind = s.chart ?? "bar";
  const colorOf = (i: number, d: { color?: string }) => d.color ?? accents[i % accents.length]!;
  let svg = head.svg;

  if (kind === "bar") {
    const max = Math.max(1, ...data.map((d) => d.value));
    const rowH = 30;
    const gap = 12;
    const labelW = Math.min(180, w * 0.3);
    const valueW = 60;
    const barX = x + labelW + 10;
    const barMax = Math.max(40, w - labelW - 10 - valueW);
    data.forEach((d, i) => {
      const cy = top + i * (rowH + gap);
      svg += text({ x, y: cy + rowH / 2 + 4, text: d.label, size: 13, fill: theme.text, family: theme.fontFamily });
      const bw = Math.max(2, barMax * (d.value / max));
      if (style.glow) svg += el("rect", { x: barX, y: cy, width: bw, height: rowH, rx: 6, fill: "none", stroke: colorOf(i, d), "stroke-width": 2, filter: style.glow, opacity: 0.5 });
      svg += rect({ x: barX, y: cy, width: bw, height: rowH, rx: 6, fill: colorOf(i, d) });
      svg += text({ x: barX + bw + 8, y: cy + rowH / 2 + 4, text: fmtNum(d.value) + (s.unit ? ` ${s.unit}` : ""), size: 13, weight: 700, fill: theme.text, family: theme.monoFamily });
    });
    return { svg, height: head.height + data.length * (rowH + gap) - gap };
  }

  if (kind === "pie" || kind === "donut") {
    const size = Math.min(w * 0.46, 220);
    const cx = x + size / 2;
    const cyc = top + size / 2;
    const r = size / 2 - 2;
    const totalV = data.reduce((a, b) => a + Math.max(0, b.value), 0) || 1;
    let a0 = -90;
    data.forEach((d, i) => {
      const frac = Math.max(0, d.value) / totalV;
      const a1 = a0 + frac * 360;
      if (frac >= 0.999) {
        svg += el("circle", { cx, cy: cyc, r, fill: colorOf(i, d) });
      } else if (frac > 0) {
        const p0 = polar(cx, cyc, r, a0);
        const p1 = polar(cx, cyc, r, a1);
        const large = a1 - a0 > 180 ? 1 : 0;
        svg += el("path", { d: `M${cx} ${cyc} L${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`, fill: colorOf(i, d), stroke: theme.background, "stroke-width": 2 });
      }
      a0 = a1;
    });
    if (kind === "donut") svg += el("circle", { cx, cy: cyc, r: r * 0.58, fill: theme.backgroundGradient ? theme.surface : theme.background });
    const lx = x + size + 24;
    let ly = top + 8;
    data.forEach((d, i) => {
      const pct = Math.round((Math.max(0, d.value) / totalV) * 100);
      svg += rect({ x: lx, y: ly, width: 12, height: 12, rx: 3, fill: colorOf(i, d) });
      svg += text({ x: lx + 20, y: ly + 11, text: `${d.label} — ${pct}%`, size: 13, fill: theme.text, family: theme.fontFamily });
      ly += 24;
    });
    return { svg, height: head.height + Math.max(size, data.length * 24 + 8) };
  }

  // line
  const chartH = 190;
  const padL = 44;
  const padB = 30;
  const padT = 10;
  const plotX = x + padL;
  const plotW = Math.max(40, w - padL - 10);
  const plotTop = top + padT;
  const plotBottom = top + chartH - padB;
  const plotH = plotBottom - plotTop;
  const vals = data.map((d) => d.value);
  const max = Math.max(...vals);
  const min = Math.min(0, ...vals);
  const range = max - min || 1;
  const n = data.length;
  const px = (i: number) => (n === 1 ? plotX + plotW / 2 : plotX + i * (plotW / (n - 1)));
  const py = (v: number) => plotBottom - ((v - min) / range) * plotH;

  for (let g = 0; g <= 3; g++) {
    const gy = plotTop + (plotH / 3) * g;
    svg += line(plotX, gy, plotX + plotW, gy, theme.border, g === 3 ? 1.5 : 1);
  }
  const pts = data.map((d, i) => `${px(i).toFixed(1)},${py(d.value).toFixed(1)}`).join(" ");
  svg += el("polyline", { points: pts, fill: "none", stroke: style.accent, "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round", filter: style.glow });
  data.forEach((d, i) => {
    svg += el("circle", { cx: px(i), cy: py(d.value), r: 4, fill: style.accent, stroke: theme.background, "stroke-width": 2 });
    svg += text({ x: px(i), y: plotBottom + 16, text: d.label, size: 11, fill: theme.textMuted, anchor: "middle", family: theme.fontFamily });
    svg += text({ x: px(i), y: py(d.value) - 10, text: fmtNum(d.value), size: 11, weight: 700, fill: theme.text, anchor: "middle", family: theme.monoFamily });
  });
  return { svg, height: head.height + chartH };
}

/* ------------------------------ dispatch -------------------------------- */
export function renderSection(
  section: Section,
  theme: Theme,
  x: number,
  y: number,
  w: number,
  style: SectionStyle = styleFor(theme),
): Block {
  switch (section.type) {
    case "title":
      return renderTitle(section, theme, x, y, w, style);
    case "steps":
      return renderSteps(section, theme, x, y, w, style);
    case "comparison":
      return renderComparison(section, theme, x, y, w, style);
    case "stat":
      return renderStat(section, theme, x, y, w, style);
    case "codeSnippet":
      return renderCode(section, theme, x, y, w, style);
    case "architecture":
      return renderArchitecture(section, theme, x, y, w, style);
    case "timeline":
      return renderTimeline(section, theme, x, y, w, style);
    case "list":
      return renderList(section, theme, x, y, w, style);
    case "callout":
      return renderCallout(section, theme, x, y, w, style);
    case "versus":
      return renderVersus(section, theme, x, y, w, style);
    case "flow":
      return renderFlow(section, theme, x, y, w, style);
    case "roadmap":
      return renderRoadmap(section, theme, x, y, w, style);
    case "iconGrid":
      return renderIconGrid(section, theme, x, y, w, style);
    case "chart":
      return renderChart(section, theme, x, y, w, style);
    case "columns":
      return renderColumns(section, theme, x, y, w, style);
    default: {
      const _never: never = section;
      void _never;
      return { svg: "", height: 0 };
    }
  }
}

export { GAP };
