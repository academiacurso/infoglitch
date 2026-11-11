/**
 * CLI de infoglitch. Renderiza un DSL/JSON a SVG/PNG/PDF desde la terminal.
 *
 *   infoglitch render deck.dsl -o out.svg
 *   infoglitch render deck.dsl -o out.png --theme cyber --width 1200
 *   cat deck.dsl | infoglitch render - -f png > out.png
 *   infoglitch themes | templates | sections
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { argv } from "node:process";
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
  "chart", "columns",
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
  const a: Args = { icons: "simple", fonts: true, positional: [] };
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

async function cmdRender(a: Args): Promise<void> {
  const source = readInput(a.positional[1]);
  await registerIcons(a.icons);

  const format: Format = a.format ?? formatFromOut(a.out);
  const fontCss = a.fonts ? await fontFaceCss() : undefined;
  const svg = renderToString(source, {
    theme: a.theme,
    width: a.width,
    fontCss,
  });

  let bytes: Uint8Array;
  if (format === "svg") {
    bytes = new TextEncoder().encode(svg);
  } else {
    let node: typeof import("@infoglitch/export/node");
    try {
      node = await import("@infoglitch/export/node");
    } catch {
      fail("para PNG/PDF instalá '@resvg/resvg-js': pnpm add @resvg/resvg-js");
    }
    const buffers = a.fonts ? await fontBuffers() : [];
    const opts = { fontBuffers: buffers, width: a.width, background: a.background };
    bytes = format === "png" ? await node.renderPng(svg, opts) : await node.renderPdf(svg, opts);
  }

  if (a.out) {
    writeFileSync(a.out, bytes);
    process.stderr.write(`✓ ${a.out} (${format.toUpperCase()}, ${bytes.length} bytes)\n`);
  } else {
    process.stdout.write(bytes);
  }
}

const HELP = `infoglitch v${VERSION} — infografías de programación desde la terminal

USO
  infoglitch render <archivo|-> [opciones]
  infoglitch themes | templates | sections
  infoglitch --help | --version

OPCIONES de render
  -o, --out <archivo>     Salida. La extensión decide el formato (.svg/.png/.pdf).
                          Sin --out, escribe a stdout.
  -f, --format <fmt>      svg | png | pdf  (default: inferido de --out, o svg)
  -t, --theme <id>        Tema (ver 'infoglitch themes'). Sobrescribe el del doc.
  -w, --width <px>        Ancho del lienzo (default 960).
      --icons <set>       simple | all | devicon | none  (default: simple)
      --background <c>    Color de fondo para PNG/PDF (ej. "#ffffff").
      --no-fonts          No embeber las fuentes (Inter/JetBrains Mono).

EJEMPLOS
  infoglitch render deck.dsl -o deck.svg
  infoglitch render deck.dsl -o deck.png --theme cyber --width 1200
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
