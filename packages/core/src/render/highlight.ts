import type { CodePalette } from "../theme/index.js";
import { escapeXml } from "./svg.js";

/**
 * Resaltado de sintaxis muy liviano, por línea (sin estado multilínea).
 * Suficiente para snippets cortos en infografías. Soporta un set común de
 * palabras clave para JS/TS/Python/PHP/Go/Rust/Java y similares.
 */

const KEYWORDS = new Set([
  // control
  "if", "else", "elif", "elseif", "for", "foreach", "while", "do", "switch", "case",
  "break", "continue", "default", "return", "yield", "match", "when",
  // decl
  "const", "let", "var", "function", "fn", "func", "def", "class", "struct", "enum",
  "interface", "type", "impl", "trait", "module", "namespace", "package", "use", "using",
  "import", "from", "export", "public", "private", "protected", "static", "final",
  "abstract", "async", "await", "new", "delete", "extends", "implements", "super",
  // tipos / valores
  "int", "float", "double", "string", "str", "bool", "boolean", "char", "void", "long",
  "true", "false", "null", "nil", "none", "undefined", "self", "this",
  // py/ruby/php-ish
  "print", "echo", "lambda", "pass", "raise", "try", "except", "catch", "finally",
  "throw", "with", "as", "and", "or", "not", "in", "is", "end", "then", "elsif",
  "mut", "pub", "let", "go", "defer", "chan", "map", "range",
]);

type Seg = { text: string; color: string };

const ID_START = /[A-Za-z_$]/;
const ID_PART = /[A-Za-z0-9_$]/;
const DIGIT = /[0-9]/;

/** Comentario de línea según lenguaje. */
function commentStart(lang: string | undefined): "#" | "//" | "both" {
  const l = (lang ?? "").toLowerCase();
  if (/(py|python|rb|ruby|sh|bash|yaml|yml|toml)/.test(l)) return "#";
  if (/(php)/.test(l)) return "both";
  return "//";
}

function tokenize(line: string, lang: string | undefined, pal: CodePalette): Seg[] {
  const segs: Seg[] = [];
  const cstyle = commentStart(lang);
  let i = 0;
  const n = line.length;

  const push = (text: string, color: string) => {
    if (!text) return;
    const last = segs[segs.length - 1];
    if (last && last.color === color) last.text += text;
    else segs.push({ text, color });
  };

  while (i < n) {
    const ch = line[i]!;

    // comentarios de línea
    if (ch === "/" && line[i + 1] === "/" && (cstyle === "//" || cstyle === "both")) {
      push(line.slice(i), pal.comment);
      break;
    }
    if (ch === "#" && (cstyle === "#" || cstyle === "both")) {
      push(line.slice(i), pal.comment);
      break;
    }

    // strings
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < n && line[j] !== ch) {
        if (line[j] === "\\") j++;
        j++;
      }
      push(line.slice(i, Math.min(j + 1, n)), pal.string);
      i = j + 1;
      continue;
    }

    // números
    if (DIGIT.test(ch)) {
      let j = i + 1;
      while (j < n && (DIGIT.test(line[j]!) || line[j] === ".")) j++;
      push(line.slice(i, j), pal.number);
      i = j;
      continue;
    }

    // identificadores / keywords / funciones / $variables
    if (ID_START.test(ch)) {
      let j = i + 1;
      while (j < n && ID_PART.test(line[j]!)) j++;
      const word = line.slice(i, j);
      let k = j;
      while (k < n && line[k] === " ") k++;
      const isCall = line[k] === "(";
      if (KEYWORDS.has(word.toLowerCase()) && word[0] !== "$") push(word, pal.keyword);
      else if (isCall) push(word, pal.fn);
      else push(word, pal.text);
      i = j;
      continue;
    }

    // puntuación / operadores
    if (/[{}()[\].,;:=+\-*/%<>!&|^~?@]/.test(ch)) {
      push(ch, pal.punct);
      i++;
      continue;
    }

    // resto (espacios, etc.)
    push(ch, pal.text);
    i++;
  }

  return segs;
}

/**
 * Devuelve un elemento `<text>` con tspans coloreados para una línea de código.
 * Usa `xml:space="preserve"` para conservar la indentación.
 */
export function highlightLine(
  line: string,
  lang: string | undefined,
  pal: CodePalette,
  x: number,
  y: number,
  family: string,
  size: number,
): string {
  const segs = line.length ? tokenize(line, lang, pal) : [{ text: " ", color: pal.text }];
  const tspans = segs
    .map((s) => `<tspan fill="${pal.text === s.color ? pal.text : s.color}">${escapeXml(s.text)}</tspan>`)
    .join("");
  return (
    `<text x="${x}" y="${y}" font-size="${size}" font-family="${family}" ` +
    `xml:space="preserve">${tspans}</text>`
  );
}
