import { z } from "zod";

/**
 * Modelo de documento de infoglitch.
 *
 * El JSON validado por estos esquemas es la FUENTE DE VERDAD: a partir de un
 * `InfographicDoc` el renderer produce el SVG sin necesidad de IA. La capa de IA
 * (`@infoglitch/ai`) sólo es un productor opcional de documentos válidos.
 */

const iconRef = z
  .string()
  .min(1)
  .describe("Nombre de icono a resolver (ej. 'typescript', 'docker', 'rocket').");

/** Portada / encabezado destacado. */
export const titleSectionSchema = z.object({
  type: z.literal("title"),
  text: z.string().min(1),
  subtitle: z.string().optional(),
  icon: iconRef.optional(),
});

/** Pasos de un flujo/pipeline (CI/CD, build, proceso). */
export const stepsSectionSchema = z.object({
  type: z.literal("steps"),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        desc: z.string().optional(),
        icon: iconRef.optional(),
      }),
    )
    .min(1),
});

/** Comparación de tecnologías/opciones lado a lado. */
export const comparisonSectionSchema = z.object({
  type: z.literal("comparison"),
  heading: z.string().optional(),
  columns: z
    .array(
      z.object({
        title: z.string().min(1),
        icon: iconRef.optional(),
        points: z.array(z.string()).default([]),
      }),
    )
    .min(2),
});

/** Métricas / KPIs / benchmarks. */
export const statSectionSchema = z.object({
  type: z.literal("stat"),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
        unit: z.string().optional(),
        icon: iconRef.optional(),
      }),
    )
    .min(1),
});

/** Snippet de código destacado. */
export const codeSnippetSectionSchema = z.object({
  type: z.literal("codeSnippet"),
  heading: z.string().optional(),
  language: z.string().optional(),
  code: z.string().min(1),
  annotations: z.array(z.string()).optional(),
});

/** Diagrama simple de arquitectura (nodos + aristas). */
export const architectureSectionSchema = z.object({
  type: z.literal("architecture"),
  heading: z.string().optional(),
  nodes: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        icon: iconRef.optional(),
      }),
    )
    .min(1),
  edges: z
    .array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
        label: z.string().optional(),
      }),
    )
    .default([]),
});

/** Línea de tiempo / roadmap / historial de versiones. */
export const timelineSectionSchema = z.object({
  type: z.literal("timeline"),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        date: z.string().min(1),
        label: z.string().min(1),
        desc: z.string().optional(),
      }),
    )
    .min(1),
});

/** Lista de features / pros-contras con iconos. */
export const listSectionSchema = z.object({
  type: z.literal("list"),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        desc: z.string().optional(),
        icon: iconRef.optional(),
        tone: z.enum(["pro", "con", "neutral"]).default("neutral"),
      }),
    )
    .min(1),
});

/** Nota/aviso destacado. */
export const calloutSectionSchema = z.object({
  type: z.literal("callout"),
  text: z.string().min(1),
  tone: z.enum(["info", "warn", "success"]).default("info"),
});

/** Comparación "versus" a dos columnas con columna central de etiquetas. */
export const versusSectionSchema = z.object({
  type: z.literal("versus"),
  heading: z.string().optional(),
  left: z.object({
    title: z.string().min(1),
    icon: iconRef.optional(),
    color: z.string().optional(),
  }),
  right: z.object({
    title: z.string().min(1),
    icon: iconRef.optional(),
    color: z.string().optional(),
  }),
  rows: z
    .array(
      z.object({
        label: z.string().min(1),
        icon: iconRef.optional(),
        left: z.string().optional(),
        right: z.string().optional(),
        leftTone: z.enum(["pro", "con", "neutral"]).default("neutral"),
        rightTone: z.enum(["pro", "con", "neutral"]).default("neutral"),
      }),
    )
    .min(1),
});

/** Diagrama de flujo vertical con nodos de proceso/decisión (ramas Sí/No). */
export const flowSectionSchema = z.object({
  type: z.literal("flow"),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        kind: z.enum(["start", "process", "decision", "end"]).default("process"),
        /** Para 'decision': texto de la rama "No" (lateral). */
        branch: z.string().optional(),
      }),
    )
    .min(1),
});

/** Ruta de aprendizaje serpenteante: pasos numerados con checklist por paso. */
export const roadmapSectionSchema = z.object({
  type: z.literal("roadmap"),
  heading: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        desc: z.string().optional(),
        icon: iconRef.optional(),
        /** "qué aprenderás": checklist del paso. */
        points: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});

/** Grilla de "icono + concepto" (ej. secciones "¿Por qué…?" con varias columnas). */
export const iconGridSectionSchema = z.object({
  type: z.literal("iconGrid"),
  heading: z.string().optional(),
  columns: z.number().int().min(2).max(6).optional(),
  items: z
    .array(
      z.object({
        icon: iconRef.optional(),
        label: z.string().min(1),
        desc: z.string().optional(),
      }),
    )
    .min(1),
});

/** Gráfico de datos: barras, torta, dona o líneas. */
export const chartSectionSchema = z.object({
  type: z.literal("chart"),
  heading: z.string().optional(),
  chart: z.enum(["bar", "pie", "donut", "line"]).default("bar"),
  unit: z.string().optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.number(),
        color: z.string().optional(),
      }),
    )
    .min(1),
});

/** Cita / testimonio destacado, con autor opcional. */
export const quoteSectionSchema = z.object({
  type: z.literal("quote"),
  text: z.string().min(1),
  author: z.string().optional(),
  role: z.string().optional(),
  icon: iconRef.optional(),
});

/** Métrica estrella: un número grande con etiqueta y variación opcional. */
export const kpiSectionSchema = z.object({
  type: z.literal("kpi"),
  value: z.string().min(1).describe("Valor grande, ej. '99.9%', '1.2M', '35ms'."),
  label: z.string().optional(),
  delta: z.string().optional().describe("Variación, ej. '+12%'."),
  trend: z.enum(["up", "down", "flat"]).default("flat"),
  icon: iconRef.optional(),
});

/** Tabla simple: encabezados + filas de celdas. */
export const tableSectionSchema = z.object({
  type: z.literal("table"),
  heading: z.string().optional(),
  columns: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string())).min(1),
});

/** Barras de progreso / porcentaje (skill bars 0–100). */
export const progressSectionSchema = z.object({
  type: z.literal("progress"),
  heading: z.string().optional(),
  unit: z.string().default("%"),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.number().min(0).max(100),
        icon: iconRef.optional(),
      }),
    )
    .min(1),
});

/** Secciones "hoja" (todo menos `columns`): lo que puede ir dentro de una columna. */
export const leafSectionSchema = z.discriminatedUnion("type", [
  titleSectionSchema,
  stepsSectionSchema,
  comparisonSectionSchema,
  statSectionSchema,
  codeSnippetSectionSchema,
  architectureSectionSchema,
  timelineSectionSchema,
  listSectionSchema,
  calloutSectionSchema,
  versusSectionSchema,
  flowSectionSchema,
  roadmapSectionSchema,
  iconGridSectionSchema,
  chartSectionSchema,
  quoteSectionSchema,
  kpiSectionSchema,
  tableSectionSchema,
  progressSectionSchema,
]);

/** Layout en columnas: coloca varias columnas (cada una una pila) lado a lado. */
export const columnsSectionSchema = z.object({
  type: z.literal("columns"),
  /** Proporción de cada columna, ej. [1,1] = 50/50, [2,1] = 66/33. */
  ratio: z.array(z.number().positive()).optional(),
  columns: z
    .array(z.object({ sections: z.array(leafSectionSchema).default([]) }))
    .min(2)
    .max(4),
});

export const sectionSchema = z.discriminatedUnion("type", [
  titleSectionSchema,
  stepsSectionSchema,
  comparisonSectionSchema,
  statSectionSchema,
  codeSnippetSectionSchema,
  architectureSectionSchema,
  timelineSectionSchema,
  listSectionSchema,
  calloutSectionSchema,
  versusSectionSchema,
  flowSectionSchema,
  roadmapSectionSchema,
  iconGridSectionSchema,
  chartSectionSchema,
  quoteSectionSchema,
  kpiSectionSchema,
  tableSectionSchema,
  progressSectionSchema,
  columnsSectionSchema,
]);

/** Barra inferior opcional (conclusión / cierre), como en los pósters. */
export const footerSchema = z.object({
  text: z.string().min(1),
  note: z.string().optional(),
  icon: iconRef.optional(),
});

export const infographicDocSchema = z.object({
  template: z
    .string()
    .default("feature-list")
    .describe("Id de plantilla de layout. Si no existe, se usa 'feature-list'."),
  theme: z.string().optional().describe("Id de tema (ej. 'dark-terminal', 'glitch', 'light-docs')."),
  title: z.string().optional(),
  sections: z.array(sectionSchema).default([]),
  footer: footerSchema.optional(),
});

export type TitleSection = z.infer<typeof titleSectionSchema>;
export type StepsSection = z.infer<typeof stepsSectionSchema>;
export type ComparisonSection = z.infer<typeof comparisonSectionSchema>;
export type StatSection = z.infer<typeof statSectionSchema>;
export type CodeSnippetSection = z.infer<typeof codeSnippetSectionSchema>;
export type ArchitectureSection = z.infer<typeof architectureSectionSchema>;
export type TimelineSection = z.infer<typeof timelineSectionSchema>;
export type ListSection = z.infer<typeof listSectionSchema>;
export type CalloutSection = z.infer<typeof calloutSectionSchema>;
export type VersusSection = z.infer<typeof versusSectionSchema>;
export type FlowSection = z.infer<typeof flowSectionSchema>;
export type RoadmapSection = z.infer<typeof roadmapSectionSchema>;
export type IconGridSection = z.infer<typeof iconGridSectionSchema>;
export type ChartSection = z.infer<typeof chartSectionSchema>;
export type QuoteSection = z.infer<typeof quoteSectionSchema>;
export type KpiSection = z.infer<typeof kpiSectionSchema>;
export type TableSection = z.infer<typeof tableSectionSchema>;
export type ProgressSection = z.infer<typeof progressSectionSchema>;
export type ColumnsSection = z.infer<typeof columnsSectionSchema>;
export type LeafSection = z.infer<typeof leafSectionSchema>;
export type Footer = z.infer<typeof footerSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];
export type InfographicDoc = z.infer<typeof infographicDocSchema>;

/** Entrada laxa antes de aplicar defaults/validación. */
export type InfographicDocInput = z.input<typeof infographicDocSchema>;

/**
 * Valida y normaliza (aplica defaults) un documento.
 * Lanza `ZodError` si la entrada es inválida.
 */
export function parseDoc(input: unknown): InfographicDoc {
  return infographicDocSchema.parse(input);
}

/** Variante segura: devuelve `{ success, data | error }`. */
export function safeParseDoc(input: unknown) {
  return infographicDocSchema.safeParse(input);
}

/**
 * JSON Schema del documento, para guiar y validar la salida de los modelos
 * (tool use / structured output) sin duplicar tipos.
 */
export function toJsonSchema() {
  return z.toJSONSchema(infographicDocSchema, { target: "draft-2020-12" });
}
