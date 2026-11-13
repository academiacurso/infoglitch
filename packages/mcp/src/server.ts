/**
 * Servidor MCP de infoglitch (stdio).
 *
 * Expone las capacidades de infoglitch como herramientas MCP para que cualquier
 * cliente (Claude Desktop, IDEs, agentes) genere y renderice infografías:
 *   - render_infographic   DSL/JSON → SVG o PNG
 *   - generate_infographic prompt → infografía (requiere API key en el entorno)
 *   - list_themes / list_templates / list_sections / dsl_reference  (discovery)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, resolve } from "node:path";
import { argv } from "node:process";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { renderToString, templateIds, themes } from "@infoglitch/core";
import { fontBuffers, fontFaceCss } from "@infoglitch/fonts";

const require = createRequire(import.meta.url);
const VERSION: string = (() => {
  try {
    return (require("../package.json") as { version: string }).version;
  } catch {
    return "0.0.0";
  }
})();

const SECTION_TYPES = [
  "title", "steps", "comparison", "stat", "codeSnippet", "architecture",
  "timeline", "list", "callout", "versus", "flow", "roadmap", "iconGrid",
  "chart", "quote", "kpi", "table", "progress", "columns",
];

const DSL_REFERENCE = `DSL de infoglitch (tolerante a fallos, basado en indentación):

  template <id>          # layout (list con 'infoglitch templates')
  theme <id>             # tema (list con 'infoglitch themes')
  title <texto>          # título del documento
  section <tipo>         # un bloque por sección (list con 'infoglitch sections')
    <campo> <valor>      # campo de la sección (heading, etc.)
    accent <#color>      # (opcional) acento inline de esta sección
    - <campo> <valor>    # ítem de la lista de la sección
      <campo> <valor>    # campo del ítem (más indentado)
  footer <texto>         # barra de cierre opcional

Ejemplo:
  template two-column
  theme cyber
  title Estado del servicio
  section kpi
    value 99.9%
    label Uptime
    delta +0.4%
    trend up
  section progress
    heading Cobertura
    - label Tests
      value 82
    - label Docs
      value 45
  section steps
    heading Pipeline
    - label Build
    - label Deploy
  footer Hecho con infoglitch

Tipos destacados: kpi (value/label/delta/trend), progress (items label/value),
quote (text/author/role), table (cols "A | B", row "x | y"), chart (chart bar|pie|donut|line),
steps, flow, versus, timeline, roadmap, iconGrid, codeSnippet, stat, list, callout, columns.`;

let iconsReady = false;
async function ensureIcons(): Promise<void> {
  if (iconsReady) return;
  const icons = await import("@infoglitch/icons");
  icons.registerSimpleIcons({ brandColors: true });
  iconsReady = true;
}

const textResult = (text: string) => ({ content: [{ type: "text" as const, text }] });

/** Construye el servidor MCP con todas las herramientas registradas. */
export function createServer(): McpServer {
  const server = new McpServer({ name: "infoglitch", version: VERSION });

  server.registerTool(
    "render_infographic",
    {
      title: "Renderizar infografía",
      description:
        "Renderiza un documento de infoglitch (DSL textual o JSON) a SVG o PNG. " +
        "Usá 'dsl_reference' para la sintaxis y 'list_themes'/'list_templates' para los ids.",
      inputSchema: {
        source: z.string().describe("DSL textual o JSON de infoglitch (InfographicDoc)."),
        theme: z.string().optional().describe("Id de tema (override del doc)."),
        width: z.number().optional().describe("Ancho del lienzo en px (default 960)."),
        format: z.enum(["svg", "png"]).optional().describe("Formato de salida (default svg)."),
        background: z.string().optional().describe("Color de fondo para PNG (ej. '#ffffff')."),
      },
    },
    async ({ source, theme, width, format, background }) => {
      await ensureIcons();
      const fontCss = await fontFaceCss();
      const svg = renderToString(source, { theme, width, fontCss });
      if ((format ?? "svg") === "svg") return textResult(svg);

      let node: typeof import("@infoglitch/export/node");
      try {
        node = await import("@infoglitch/export/node");
      } catch {
        return {
          content: [{ type: "text" as const, text: "Para PNG hace falta '@resvg/resvg-js' (dependencia opcional)." }],
          isError: true,
        };
      }
      const png = await node.renderPng(svg, { fontBuffers: await fontBuffers(), width, background });
      const data = Buffer.from(png).toString("base64");
      return { content: [{ type: "image" as const, data, mimeType: "image/png" }] };
    },
  );

  server.registerTool(
    "save_infographic",
    {
      title: "Guardar infografía en disco",
      description:
        "Renderiza un documento de infoglitch (DSL textual o JSON) y lo escribe a un archivo. " +
        "El formato se infiere de la extensión (.svg/.png/.pdf) salvo que se indique 'format'. " +
        "Crea los directorios padre si no existen.",
      inputSchema: {
        source: z.string().describe("DSL textual o JSON de infoglitch (InfographicDoc)."),
        path: z.string().describe("Ruta del archivo de salida (ej. './docs/ci.svg'). Relativa al cwd del server."),
        theme: z.string().optional().describe("Id de tema (override del doc)."),
        width: z.number().optional().describe("Ancho del lienzo en px (default 960)."),
        format: z.enum(["svg", "png", "pdf"]).optional().describe("Formato de salida; por defecto, el de la extensión."),
        background: z.string().optional().describe("Color de fondo para PNG/PDF (ej. '#ffffff')."),
      },
    },
    async ({ source, path, theme, width, format, background }) => {
      await ensureIcons();
      const ext = extname(path).toLowerCase();
      const fmt = format ?? (ext === ".png" ? "png" : ext === ".pdf" ? "pdf" : "svg");

      const fontCss = await fontFaceCss();
      const svg = renderToString(source, { theme, width, fontCss });

      let bytes: Uint8Array | string = svg;
      if (fmt !== "svg") {
        let node: typeof import("@infoglitch/export/node");
        try {
          node = await import("@infoglitch/export/node");
        } catch {
          return {
            content: [{ type: "text" as const, text: `Para ${fmt.toUpperCase()} hace falta '@resvg/resvg-js' (dependencia opcional).` }],
            isError: true,
          };
        }
        const fonts = await fontBuffers();
        bytes = fmt === "pdf"
          ? await node.renderPdf(svg, { fontBuffers: fonts, width, background })
          : await node.renderPng(svg, { fontBuffers: fonts, width, background });
      }

      const abs = resolve(path);
      await mkdir(dirname(abs), { recursive: true });
      const buf = typeof bytes === "string" ? Buffer.from(bytes, "utf8") : Buffer.from(bytes);
      await writeFile(abs, buf);
      return textResult(`Guardado ${fmt.toUpperCase()} en ${abs} (${buf.length} bytes).`);
    },
  );

  server.registerTool(
    "generate_infographic",
    {
      title: "Generar infografía con IA",
      description:
        "Genera una infografía a partir de un prompt en lenguaje natural usando IA, y la devuelve como SVG. " +
        "Requiere una API key en el entorno (ej. ANTHROPIC_API_KEY).",
      inputSchema: {
        prompt: z.string().describe("Qué infografía querés (ej. 'pipeline de CI/CD en 4 pasos')."),
        theme: z.string().optional(),
        width: z.number().optional(),
        provider: z.enum(["anthropic", "openai", "openrouter", "gemini"]).optional(),
      },
    },
    async ({ prompt, theme, width, provider }) => {
      await ensureIcons();
      try {
        const ai = await import("@infoglitch/ai");
        const prov = provider ?? (process.env.INFOGLITCH_PROVIDER as typeof provider) ?? "anthropic";
        const adapter = ai.createAdapter(prov ?? "anthropic");
        const { doc } = await ai.generateInfographic(adapter, { prompt }, { theme, width });
        const fontCss = await fontFaceCss();
        return textResult(renderToString(doc, { theme, width, fontCss }));
      } catch (e) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error generando con IA: ${e instanceof Error ? e.message : String(e)}. ` +
                `¿Configuraste la API key del proveedor (ej. ANTHROPIC_API_KEY)?`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "list_themes",
    { title: "Listar temas", description: "Ids de temas disponibles." },
    async () => textResult(Object.keys(themes).join("\n")),
  );
  server.registerTool(
    "list_templates",
    { title: "Listar plantillas", description: "Ids de plantillas de layout disponibles." },
    async () => textResult(templateIds().join("\n")),
  );
  server.registerTool(
    "list_sections",
    { title: "Listar tipos de sección", description: "Tipos de sección soportados." },
    async () => textResult(SECTION_TYPES.join("\n")),
  );
  server.registerTool(
    "dsl_reference",
    { title: "Referencia del DSL", description: "Sintaxis del DSL de infoglitch con un ejemplo." },
    async () => textResult(DSL_REFERENCE),
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Mensaje a stderr (stdout está reservado para el protocolo MCP).
  process.stderr.write(`infoglitch MCP v${VERSION} escuchando por stdio\n`);
}

// Ejecutar sólo como binario (no al importar en tests).
const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((e: unknown) => {
    process.stderr.write(`infoglitch-mcp: ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  });
}
