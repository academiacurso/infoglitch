import { describe, expect, it } from "vitest";
import { renderToString, themes } from "../src/index";

/**
 * Snapshots de regresión visual: fijan el SVG generado para cada tipo de sección
 * y cada tema. Si un cambio altera el render, el diff del snapshot lo delata.
 * Deterministas: sin fuentes embebidas, ancho fijo, sin iconos registrados.
 */

const WIDTH = 800;

// Un DSL mínimo por tipo de sección.
const SECTION_DSL: Record<string, string> = {
  title: `template stack\nsection title\n  text Título de prueba\n  icon rocket`,
  steps: `template stack\nsection steps\n  heading Pasos\n  - label Uno\n  - label Dos\n  - label Tres`,
  comparison: `template stack\nsection comparison\n  heading Comparación\n  - label A\n    value 10\n  - label B\n    value 20`,
  stat: `template stack\nsection stat\n  heading Métricas\n  - label Req/s\n    value 1200\n  - label Latencia\n    value 35ms`,
  codeSnippet: `template stack\nsection codeSnippet\n  heading Código\n  language javascript\n  code const x = 1;\n  code console.log(x);`,
  architecture: `template stack\nsection architecture\n  heading Arquitectura\n  - id api\n    label API\n  - id db\n    label DB\n  edge api db`,
  timeline: `template stack\nsection timeline\n  heading Historia\n  - label v1\n    desc Inicio\n  - label v2\n    desc Mejora`,
  list: `template stack\nsection list\n  heading Lista\n  - label Pro\n    tone pro\n  - label Con\n    tone con`,
  callout: `template stack\nsection callout\n  text Nota importante\n  tone success`,
  versus: `template stack\nsection versus\n  left WordPress\n  right A medida\n  - label Costo\n    l Bajo\n    r Alto`,
  flow: `template stack\nsection flow\n  heading Flujo\n  - start Inicio\n  - process Paso\n  - end Fin`,
  roadmap: `template stack\nsection roadmap\n  - label Fase 1\n    point A\n    point B\n  - label Fase 2\n    point C`,
  iconGrid: `template stack\nsection iconGrid\n  heading Stack\n  columns 3\n  - icon python\n    label Python\n  - icon react\n    label React`,
  chart: `template stack\nsection chart\n  chart bar\n  heading Datos\n  - label A\n    value 30\n  - label B\n    value 70`,
  quote: `template stack\nsection quote\n  text El mejor código es el que no tenés que escribir\n  author Jeff Atwood\n  role cofundador`,
  kpi: `template stack\nsection kpi\n  value 99.9%\n  label Uptime\n  delta +0.4%\n  trend up`,
  table: `template stack\nsection table\n  heading Comparativa\n  cols Lenguaje | Tipado\n  row Python | Dinámico\n  row Rust | Estático`,
  progress: `template stack\nsection progress\n  heading Cobertura\n  - label Tests\n    value 82\n  - label Docs\n    value 45`,
  columns: `template stack\nsection columns\n  ratio 1 1\n  col\n    section callout\n      text Izquierda\n  col\n    section callout\n      text Derecha`,
};

describe("snapshots por tipo de sección (tema blueprint)", () => {
  for (const [type, dsl] of Object.entries(SECTION_DSL)) {
    it(`sección ${type}`, () => {
      expect(renderToString(dsl, { theme: "blueprint", width: WIDTH })).toMatchSnapshot();
    });
  }
});

describe("snapshots por tema (doc combinado)", () => {
  const combo = `template stack
section title
  text infoglitch
  icon rocket
section steps
  heading Pipeline
  - label Build
  - label Deploy
section chart
  chart donut
  heading Mix
  - label Código
    value 60
  - label Tests
    value 40
footer Hecho con infoglitch`;
  for (const id of Object.keys(themes)) {
    it(`tema ${id}`, () => {
      expect(renderToString(combo, { theme: id, width: WIDTH })).toMatchSnapshot();
    });
  }
});

describe("plantillas de layout multi-columna", () => {
  const doc = `section title
  text Guía
section stat
  heading Métricas
  - label Req/s
    value 1200
section list
  heading Prácticas
  - label Validá
    tone pro
section callout
  text Nota
section codeSnippet
  heading Código
  code const x = 1;
section steps
  heading Pipeline
  - label Build
  - label Test
  - label Deploy`;

  for (const tpl of ["two-column", "grid", "hero-split"]) {
    it(`plantilla ${tpl} renderiza sin romper`, () => {
      const svg = renderToString(`template ${tpl}\n${doc}`, { theme: "cyber", width: WIDTH });
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("</svg>");
      expect(svg).toMatchSnapshot();
    });
  }

  it("una sección ancha (steps) va a ancho completo y no se recorta en columna", () => {
    const svg = renderToString(`template grid\n${doc}`, { theme: "light-docs", width: WIDTH });
    // El tercer paso (Deploy) debe estar presente (no omitido por overflow).
    expect(svg).toContain("Deploy");
    expect(svg).toContain("Build");
    expect(svg).toContain("Test");
  });
});

describe("accesibilidad", () => {
  it("incluye <title>/<desc> y aria-labelledby derivados del doc", () => {
    const svg = renderToString(
      `template stack\nsection title\n  text Mi infografía\nsection steps\n  heading Pasos\n  - label Uno`,
      { width: WIDTH },
    );
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-labelledby="ig-title-a11y ig-desc-a11y"');
    expect(svg).toMatch(/<title id="ig-title-a11y">Mi infografía<\/title>/);
    expect(svg).toContain('<desc id="ig-desc-a11y">');
    expect(svg).toContain("Pasos");
  });

  it("escapa caracteres XML en el título accesible", () => {
    const svg = renderToString(`template stack\nsection title\n  text A & B <x>`, { width: WIDTH });
    expect(svg).toContain("A &amp; B &lt;x&gt;");
  });
});

describe("robustez (DSL tolerante → campos opcionales ausentes)", () => {
  it("timeline sin 'date' no crashea (regresión)", () => {
    const dsl = `template stack\nsection timeline\n  heading Hitos\n  - label v1\n    desc Primer release\n  - label v2`;
    expect(() => renderToString(dsl, { width: WIDTH })).not.toThrow();
    expect(renderToString(dsl, { width: WIDTH }).startsWith("<svg")).toBe(true);
  });
});
