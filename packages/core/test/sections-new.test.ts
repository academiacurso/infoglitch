import { describe, expect, it } from "vitest";
import { parseDoc, parseDsl, renderToString, safeParseDoc, stringify, templateIds } from "../src/index";

describe("versus", () => {
  const dsl = `template versus
section versus
  left WordPress
  right A medida
  - label Tiempo
    l Rapido
    r Lento
    ltone pro
    rtone con
  - label Costo
    l Barato
    r Caro
    ltone pro
    rtone con
`;

  it("parsea columnas y filas", () => {
    const doc = parseDsl(dsl);
    const v = doc.sections.find((s) => s.type === "versus") as {
      left: { title: string };
      right: { title: string };
      rows: { label: string; leftTone: string }[];
    };
    expect(v.left.title).toBe("WordPress");
    expect(v.right.title).toBe("A medida");
    expect(v.rows).toHaveLength(2);
    expect(v.rows[0]!.leftTone).toBe("pro");
  });

  it("renderiza con etiquetas de fila", () => {
    const svg = renderToString(dsl);
    expect(svg).toContain("Tiempo");
    expect(svg).toContain("Rapido");
    expect(svg).toContain("Lento");
  });
});

describe("flow", () => {
  const dsl = `template flowchart
section flow
  - start Inicio
  - decision Condicion
    branch Reprobado
  - process Aprobado
  - end Fin
`;

  it("parsea nodos con kind y branch", () => {
    const doc = parseDsl(dsl);
    const f = doc.sections.find((s) => s.type === "flow") as {
      items: { label: string; kind: string; branch?: string }[];
    };
    expect(f.items).toHaveLength(4);
    expect(f.items[0]!.kind).toBe("start");
    const dec = f.items.find((n) => n.kind === "decision")!;
    expect(dec.branch).toBe("Reprobado");
  });

  it("renderiza diamante de decisión y ramas", () => {
    const svg = renderToString(dsl);
    expect(svg).toContain("<polygon"); // diamante
    expect(svg).toContain("Reprobado");
    expect(svg).toContain(">Sí<");
    expect(svg).toContain(">No<");
  });
});

describe("roadmap", () => {
  const dsl = `template roadmap
section roadmap
  - label Fundamentos
    desc Base solida
    icon python
    point Sintaxis
    point Variables
  - label POO
    point Herencia
`;

  it("parsea pasos con desc, icon y points", () => {
    const doc = parseDsl(dsl);
    const r = doc.sections.find((s) => s.type === "roadmap") as {
      items: { label: string; desc?: string; points: string[] }[];
    };
    expect(r.items).toHaveLength(2);
    expect(r.items[0]!.desc).toBe("Base solida");
    expect(r.items[0]!.points).toEqual(["Sintaxis", "Variables"]);
  });

  it("renderiza nodos numerados y camino punteado", () => {
    const svg = renderToString(dsl);
    expect(svg).toContain("Fundamentos");
    expect(svg).toContain("stroke-dasharray"); // el camino serpenteante
    expect(svg).toContain(">1<"); // nodo numerado
  });
});

describe("iconGrid", () => {
  const dsl = `template icon-grid
section iconGrid
  columns 3
  - icon python
    label Facil
    desc Sintaxis clara
  - icon docker
    label Contenedores
`;

  it("parsea columns e ítems", () => {
    const doc = parseDsl(dsl);
    const g = doc.sections.find((s) => s.type === "iconGrid") as {
      columns?: number;
      items: { icon?: string; label: string }[];
    };
    expect(g.columns).toBe(3);
    expect(g.items).toHaveLength(2);
    expect(g.items[0]!.icon).toBe("python");
    expect(g.items[0]!.label).toBe("Facil");
  });

  it("renderiza las celdas", () => {
    const svg = renderToString(dsl);
    expect(svg).toContain("Facil");
    expect(svg).toContain("Contenedores");
  });
});

describe("columns (layout 50/50)", () => {
  const doc = {
    template: "stack",
    sections: [
      {
        type: "columns",
        ratio: [1, 1],
        columns: [
          { sections: [{ type: "list", items: [{ label: "Izquierda", tone: "neutral" }] }] },
          { sections: [{ type: "list", items: [{ label: "Derecha", tone: "neutral" }] }] },
        ],
      },
    ],
  };

  it("valida con parseDoc y renderiza ambas columnas", () => {
    const valid = parseDoc(doc);
    expect(valid.sections[0]!.type).toBe("columns");
    const svg = renderToString(doc as never);
    expect(svg).toContain("Izquierda");
    expect(svg).toContain("Derecha");
  });

  it("rechaza columns anidado dentro de una columna (sólo hojas)", () => {
    const nested = {
      sections: [
        {
          type: "columns",
          columns: [
            { sections: [{ type: "columns", columns: [] }] },
            { sections: [] },
          ],
        },
      ],
    };
    expect(safeParseDoc(nested).success).toBe(false);
  });
});

describe("columns DSL (anidado)", () => {
  const dsl = `template stack
section columns
  ratio 2 1
  col
    section flow
      heading Flujo
      - start Inicio
      - decision Condicion
  col
    section list
      - label Aizq
      - label Bder
`;

  it("parsea columnas con secciones anidadas y ratio", () => {
    const doc = parseDsl(dsl);
    const c = doc.sections.find((s) => s.type === "columns") as {
      ratio?: number[];
      columns: { sections: { type: string }[] }[];
    };
    expect(c.ratio).toEqual([2, 1]);
    expect(c.columns).toHaveLength(2);
    expect(c.columns[0]!.sections[0]!.type).toBe("flow");
    expect(c.columns[1]!.sections[0]!.type).toBe("list");
  });

  it("renderiza el contenido de ambas columnas", () => {
    const svg = renderToString(dsl);
    expect(svg).toContain("Inicio");
    expect(svg).toContain("Aizq");
  });

  it("round-trip: stringify vuelve a parsear a columns", () => {
    const doc = parseDsl(dsl);
    const again = parseDsl(stringify(doc));
    const c = again.sections.find((s) => s.type === "columns") as { columns: unknown[] };
    expect(c.columns).toHaveLength(2);
  });
});

describe("chart", () => {
  const dsl = `template chart
section chart
  chart bar
  heading Datos
  unit %
  - label A
    value 60
  - label B
    value 40
`;

  it("parsea tipo, unit y valores numéricos", () => {
    const doc = parseDsl(dsl);
    const c = doc.sections.find((s) => s.type === "chart") as {
      chart: string;
      unit?: string;
      items: { label: string; value: number }[];
    };
    expect(c.chart).toBe("bar");
    expect(c.unit).toBe("%");
    expect(c.items).toHaveLength(2);
    expect(c.items[0]!.value).toBe(60);
    expect(typeof c.items[0]!.value).toBe("number");
  });

  it("renderiza cada tipo con su primitiva SVG", () => {
    expect(renderToString(dsl)).toContain("<rect"); // barras
    expect(renderToString("section chart\n  chart line\n  - label x\n    value 1\n  - label y\n    value 2\n")).toContain("<polyline");
    expect(renderToString("section chart\n  chart donut\n  - label a\n    value 1\n  - label b\n    value 1\n")).toContain("<path");
  });

  it("descarta ítems sin valor numérico", () => {
    const doc = parseDsl("section chart\n  - label sinvalor\n  - label ok\n    value 5\n");
    const c = doc.sections.find((s) => s.type === "chart") as { items: unknown[] };
    expect(c.items).toHaveLength(1);
  });
});

describe("footer", () => {
  const dsl = `template stack
footer Domina las condicionales
footernote Practica y constancia
footericon rocket
section list
  - label Ok
`;

  it("parsea el footer", () => {
    const doc = parseDsl(dsl);
    expect(doc.footer?.text).toBe("Domina las condicionales");
    expect(doc.footer?.note).toBe("Practica y constancia");
    expect(doc.footer?.icon).toBe("rocket");
  });

  it("renderiza la barra de footer", () => {
    const svg = renderToString(dsl);
    expect(svg).toContain("Domina las condicionales");
    expect(svg).toContain("Practica y constancia");
  });
});

describe("catálogo", () => {
  it("incluye las plantillas nuevas", () => {
    const ids = templateIds();
    expect(ids).toContain("versus");
    expect(ids).toContain("flowchart");
    expect(ids).toContain("roadmap");
    expect(ids).toContain("icon-grid");
  });
});
