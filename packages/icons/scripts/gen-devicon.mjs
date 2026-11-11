// Generador: inlinea un set curado de logos de Devicon (a color) en src/devicon-data.ts
// Uso: node scripts/gen-devicon.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(here, "..", "node_modules", "devicon", "icons");

const NAMES = [
  // lenguajes
  "python", "javascript", "typescript", "java", "c", "cplusplus", "csharp", "go",
  "rust", "ruby", "php", "swift", "kotlin", "dart", "scala", "elixir", "haskell",
  "clojure", "lua", "r", "julia", "perl", "elm", "erlang",
  // markup / estilos
  "html5", "css3", "sass", "less",
  // frontend
  "react", "vuejs", "angular", "angularjs", "svelte", "nextjs", "nuxtjs", "astro",
  "solidjs", "qwik", "redux", "jquery", "tailwindcss", "bootstrap", "materialui",
  "vite", "webpack", "babel",
  // backend / runtimes
  "nodejs", "deno", "bun", "express", "nestjs", "django", "flask", "fastapi",
  "spring", "laravel", "rails", "dotnetcore", "graphql",
  // db / infra / devops
  "docker", "kubernetes", "git", "github", "gitlab", "bitbucket", "linux", "ubuntu",
  "debian", "postgresql", "mysql", "mongodb", "redis", "sqlite", "nginx", "apache",
  "amazonwebservices", "googlecloud", "azure", "firebase", "supabase", "prisma",
  // data / ml
  "jupyter", "numpy", "pandas", "pytorch", "tensorflow", "anaconda",
  // tools
  "figma", "vscode", "intellij", "postman", "flutter", "electron",
];

const data = {};
const found = [];
const missing = [];

for (const name of NAMES) {
  const dir = join(iconsDir, name);
  const candidates = [`${name}-original.svg`, `${name}-plain.svg`, `${name}-original-wordmark.svg`, `${name}-plain-wordmark.svg`];
  const file = candidates.map((c) => join(dir, c)).find((p) => existsSync(p));
  if (!file) {
    missing.push(name);
    continue;
  }
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>\s*$/i);
  if (!m) {
    missing.push(name);
    continue;
  }
  data[name] = { viewBox: m[1], body: m[2].trim() };
  found.push(name);
}

const out =
  `// AUTO-GENERADO por scripts/gen-devicon.mjs — no editar a mano.\n` +
  `// Logos de Devicon (MIT). Las marcas pertenecen a sus dueños.\n` +
  `export interface DeviconEntry { body: string; viewBox: string; }\n` +
  `export const DEVICON: Record<string, DeviconEntry> = ${JSON.stringify(data)};\n`;

writeFileSync(join(here, "..", "src", "devicon-data.ts"), out, "utf8");
console.log(`✓ devicon-data.ts: ${found.length} logos`);
if (missing.length) console.log(`  (sin original/plain: ${missing.join(", ")})`);
