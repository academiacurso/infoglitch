/**
 * CLI de infoglitch. Renderiza un DSL/JSON a SVG/PNG/PDF desde la terminal.
 *
 *   infoglitch render deck.dsl -o out.svg
 *   infoglitch render deck.dsl -o out.png --theme cyber --width 1200
 *   cat deck.dsl | infoglitch render - -f png > out.png
 *   infoglitch themes | templates | sections
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { argv } from "node:process";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { renderToString, themes, templateIds } from "@infoglitch/core";
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

export type Format = "svg" | "png" | "pdf";
type IconSet = "simple" | "all" | "devicon" | "none";

export interface Args {
  out?: string;
  format?: Format;
  theme?: string;
  width?: number;
  icons: IconSet;
  fonts: boolean;
  background?: string;
  watch: boolean;
  force: boolean;
  positional: string[];
}

// Salida canalizada a `head`/`less` cierra el pipe: no es un error, salir limpio.
process.stdout.on("error", (e: NodeJS.ErrnoException) => {
  if (e.code === "EPIPE") process.exit(0);
  throw e;
});

function fail(msg: string): never {
  process.stderr.write(`infoglitch: ${msg}\n`);
  process.exit(1);
}

export function parseArgs(argv: string[]): Args {
  const a: Args = { icons: "simple", fonts: true, watch: false, force: false, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) fail(`falta el valor para ${arg}`);
      return v;
    };
    switch (arg) {
      case "-o": case "--out": a.out = next(); break;
      case "-f": case "--format": a.format = next() as Format; break;
      case "-t": case "--theme": a.theme = next(); break;
      case "-w": case "--width": a.width = Number(next()); break;
      case "--icons": a.icons = next() as IconSet; break;
      case "--background": case "--bg": a.background = next(); break;
      case "--no-fonts": a.fonts = false; break;
      case "--watch": a.watch = true; break;
      case "--force": a.force = true; break;
      default:
        if (arg.startsWith("-") && arg !== "-") fail(`opción desconocida: ${arg}`);
        a.positional.push(arg);
    }
  }
  return a;
}

function readInput(src: string | undefined): string {
  if (!src || src === "-") {
    try {
      return readFileSync(0, "utf8"); // stdin
    } catch {
      fail("no se pudo leer el DSL de stdin (pasá un archivo o canalizá con '|')");
    }
  }
  try {
    return readFileSync(src, "utf8");
  } catch {
    fail(`no se pudo leer el archivo: ${src}`);
  }
}

export function formatFromOut(out: string | undefined): Format {
  if (!out) return "svg";
  const ext = out.slice(out.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "png" || ext === "pdf" || ext === "svg") return ext;
  return "svg";
}

async function registerIcons(set: IconSet): Promise<void> {
  if (set === "none") return;
  const icons = await import("@infoglitch/icons");
  if (set === "all") icons.registerSimpleIconsAll({ brandColors: true });
  else icons.registerSimpleIcons({ brandColors: true }); // simple es el default
  if (set === "devicon") await icons.registerDevicon();
}

/** Renderiza una cadena DSL/JSON a los bytes del formato pedido. */
async function sourceToBytes(source: string, a: Args, format: Format): Promise<Uint8Array> {
  const fontCss = a.fonts ? await fontFaceCss() : undefined;
  const svg = renderToString(source, { theme: a.theme, width: a.width, fontCss });
  if (format === "svg") return new TextEncoder().encode(svg);

  let node: typeof import("@infoglitch/export/node");
  try {
    node = await import("@infoglitch/export/node");
  } catch {
    fail("para PNG/PDF instalá '@resvg/resvg-js': pnpm add @resvg/resvg-js");
  }
  const buffers = a.fonts ? await fontBuffers() : [];
  const opts = { fontBuffers: buffers, width: a.width, background: a.background };
  return format === "png" ? node.renderPng(svg, opts) : node.renderPdf(svg, opts);
}

async function renderFileOnce(input: string, out: string | undefined, a: Args): Promise<void> {
  const source = input === "-" ? readInput("-") : readInput(input);
  const format: Format = a.format ?? formatFromOut(out);
  const bytes = await sourceToBytes(source, a, format);
  if (out) {
    writeFileSync(out, bytes);
    process.stderr.write(`✓ ${out} (${format.toUpperCase()}, ${bytes.length} bytes)\n`);
  } else {
    process.stdout.write(bytes);
  }
}

async function cmdRender(a: Args): Promise<void> {
  await registerIcons(a.icons);
  const input = a.positional[1];

  // Batch: si la entrada es un directorio, renderiza cada .dsl a la carpeta de salida.
  if (input && input !== "-" && existsSync(input) && statSync(input).isDirectory()) {
    const outDir = a.out ?? input;
    const format: Format = a.format ?? "svg";
    const files = readdirSync(input).filter((f) => /\.(dsl|txt)$/i.test(f));
    if (!files.length) fail(`no hay archivos .dsl en ${input}`);
    mkdirSync(outDir, { recursive: true });
    for (const f of files) {
      const outFile = join(outDir, basename(f).replace(/\.[^.]+$/, "") + "." + format);
      await renderFileOnce(join(input, f), outFile, { ...a, format });
    }
    process.stderr.write(`✓ ${files.length} archivo(s) → ${outDir}\n`);
    return;
  }

  await renderFileOnce(input ?? "-", a.out, a);

  // Watch: re-render al guardar (sólo con archivo + salida a disco).
  if (a.watch) {
    if (!input || input === "-" || !a.out) fail("--watch requiere un archivo de entrada y --out");
    process.stderr.write(`👀 observando ${input} … (Ctrl+C para salir)\n`);
    let timer: ReturnType<typeof setTimeout> | undefined;
    watch(input, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        renderFileOnce(input, a.out, a).catch((e: unknown) =>
          process.stderr.write(`✗ ${e instanceof Error ? e.message : String(e)}\n`),
        );
      }, 120);
    });
    await new Promise(() => {}); // mantener vivo
  }
}

const EXAMPLE_DECK = `template two-column
theme cyber
title Mi primera infografía
section kpi
  value 99.9%
  label Uptime
  delta +0.4%
  trend up
section steps
  heading Pipeline
  - label Build
  - label Test
  - label Deploy
section list
  heading Buenas prácticas
  - label Validá entradas
    tone pro
  - label Evitá anidar de más
    tone con
section quote
  text El mejor código es el que no tenés que escribir.
  author Jeff Atwood
footer Hecho con infoglitch
`;

function cmdInit(a: Args): void {
  const target = a.positional[1] ?? "deck.dsl";
  if (existsSync(target) && !a.force) {
    fail(`${target} ya existe (usá --force para sobrescribir)`);
  }
  writeFileSync(target, EXAMPLE_DECK);
  process.stderr.write(`✓ ${target} creado. Probá: infoglitch render ${target} -o deck.svg\n`);
}

const HELP = `infoglitch v${VERSION} — infografías de programación desde la terminal

USO
  infoglitch render <archivo|dir|-> [opciones]
  infoglitch init [archivo]
  infoglitch themes | templates | sections
  infoglitch --help | --version

OPCIONES de render
  -o, --out <archivo>     Salida. La extensión decide el formato (.svg/.png/.pdf).
                          Sin --out, escribe a stdout. Con un dir de entrada, es la carpeta destino.
  -f, --format <fmt>      svg | png | pdf  (default: inferido de --out, o svg)
  -t, --theme <id>        Tema (ver 'infoglitch themes'). Sobrescribe el del doc.
  -w, --width <px>        Ancho del lienzo (default 960).
      --icons <set>       simple | all | devicon | none  (default: simple)
      --background <c>    Color de fondo para PNG/PDF (ej. "#ffffff").
      --no-fonts          No embeber las fuentes (Inter/JetBrains Mono).
      --watch             Re-renderiza al guardar (requiere archivo + --out).

EJEMPLOS
  infoglitch init                               # crea deck.dsl de ejemplo
  infoglitch render deck.dsl -o deck.svg
  infoglitch render deck.dsl -o deck.png --theme cyber --width 1200
  infoglitch render deck.dsl -o deck.svg --watch
  infoglitch render ./decks -o ./out -f png     # batch de un directorio
  cat deck.dsl | infoglitch render - -f png > deck.png

PNG/PDF requieren '@resvg/resvg-js' (dependencia opcional, binario nativo).`;

export async function main(): Promise<void> {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(HELP + "\n");
    return;
  }
  if (args[0] === "--version" || args[0] === "-v") {
    process.stdout.write(VERSION + "\n");
    return;
  }
  const a = parseArgs(args);
  const cmd = a.positional[0];
  switch (cmd) {
    case "render":
      await cmdRender(a);
      break;
    case "init":
      cmdInit(a);
      break;
    case "themes":
      process.stdout.write(Object.keys(themes).join("\n") + "\n");
      break;
    case "templates":
      process.stdout.write(templateIds().join("\n") + "\n");
      break;
    case "sections":
      process.stdout.write(SECTION_TYPES.join("\n") + "\n");
      break;
    default:
      fail(`comando desconocido: ${cmd ?? "(ninguno)"}. Probá 'infoglitch --help'.`);
  }
}

// Ejecutar sólo si se invoca como binario (no al importarlo en tests).
const invokedPath = argv[1] ? pathToFileURL(argv[1]).href : "";
if (import.meta.url === invokedPath) {
  main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
}
