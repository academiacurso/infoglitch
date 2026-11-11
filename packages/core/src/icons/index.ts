/**
 * Registro de iconos SVG.
 *
 * Cada icono es markup interno para un viewBox 0 0 24 24, pensado para render
 * tipo "stroke" (línea). El color/grosor los aplica el renderer en el grupo
 * contenedor, por eso los elementos no fijan `stroke`/`fill`.
 *
 * Los glifos son geométricos y propios (no copian paths de marcas), para evitar
 * problemas de licencia. `resolveIcon` hace matching tolerante por nombre/alias.
 */

export interface IconDef {
  /** markup interno SVG (paths/líneas/círculos) para el viewBox indicado */
  body: string;
  /**
   * 'stroke' (línea, default), 'fill' (sólido monocromo), o 'raw' (preserva los
   * colores/fills propios del icono, p. ej. logos multicolor de Devicon).
   */
  mode?: "stroke" | "fill" | "raw";
  /** color preferido (ej. color de marca); si falta, usa el color del contexto. */
  color?: string;
  /** viewBox del icono (default "0 0 24 24"); Devicon usa "0 0 128 128". */
  viewBox?: string;
}

export const icons: Record<string, IconDef> = {
  code: { body: `<path d="M8 6 3 12l5 6" /><path d="M16 6l5 6-5 6" />` },
  terminal: { body: `<path d="M4 7l5 5-5 5" /><path d="M12 19h8" />` },
  rocket: {
    body: `<path d="M5 15c-1 2-1 4-1 4s2 0 4-1" /><path d="M14 4c3 0 6 3 6 6-2 5-7 8-10 9l-5-5c1-3 4-8 9-10Z" /><circle cx="14.5" cy="9.5" r="1.5" />`,
  },
  check: { body: `<path d="M20 6 9 17l-5-5" />` },
  x: { body: `<path d="M18 6 6 18" /><path d="M6 6l12 12" />` },
  database: {
    body: `<ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />`,
  },
  server: {
    body: `<rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01" /><path d="M7 16.5h.01" />`,
  },
  cloud: { body: `<path d="M7 18a4 4 0 1 1 1-7.9A5 5 0 0 1 18 11a3.5 3.5 0 0 1-1 7H7Z" />` },
  cpu: {
    body: `<rect x="6" y="6" width="12" height="12" rx="1.5" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />`,
  },
  box: {
    body: `<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />`,
  },
  package: {
    body: `<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /><path d="M7.5 5.5 16.5 10.5" />`,
  },
  layers: {
    body: `<path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="M2 13l10 5 10-5" /><path d="M2 18l10 5 10-5" />`,
  },
  git: {
    body: `<circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="9" r="2.5" /><path d="M6 8.5v7" /><path d="M18 11.5c0 3-4 3-6 4.5" />`,
  },
  branch: {
    body: `<circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="9" r="2.5" /><path d="M6 8.5v7" /><path d="M18 11.5c0 3-4 3-6 4.5" />`,
  },
  bug: {
    body: `<rect x="8" y="7" width="8" height="11" rx="4" /><path d="M8 11H4M16 11h4M8 15H4M16 15h4M9 7 7 4M15 7l2-3" />`,
  },
  shield: { body: `<path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" /><path d="M9 12l2 2 4-4" />` },
  zap: { body: `<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />` },
  clock: { body: `<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />` },
  test: {
    body: `<path d="M9 3h6" /><path d="M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /><path d="M7.5 15h9" />`,
  },
  settings: {
    body: `<circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />`,
  },
  arrowRight: { body: `<path d="M5 12h14" /><path d="M13 6l6 6-6 6" />` },
  globe: {
    body: `<circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />`,
  },
  lock: {
    body: `<rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />`,
  },
  flag: { body: `<path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" />` },
  star: { body: `<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8-4.3-4.1 5.9-.9L12 3Z" />` },
};

const aliases: Record<string, string> = {
  javascript: "code",
  js: "code",
  typescript: "code",
  ts: "code",
  python: "code",
  function: "code",
  api: "globe",
  http: "globe",
  web: "globe",
  rest: "globe",
  node: "server",
  nodejs: "server",
  backend: "server",
  docker: "box",
  container: "box",
  kubernetes: "layers",
  k8s: "layers",
  build: "package",
  deploy: "rocket",
  release: "rocket",
  launch: "rocket",
  ci: "branch",
  cicd: "branch",
  pipeline: "branch",
  github: "git",
  gitlab: "git",
  commit: "git",
  db: "database",
  sql: "database",
  postgres: "database",
  mongodb: "database",
  storage: "database",
  cache: "database",
  aws: "cloud",
  azure: "cloud",
  gcp: "cloud",
  serverless: "cloud",
  performance: "zap",
  fast: "zap",
  speed: "zap",
  benchmark: "zap",
  security: "shield",
  auth: "lock",
  authentication: "lock",
  secure: "lock",
  time: "clock",
  latency: "clock",
  duration: "clock",
  testing: "test",
  tests: "test",
  qa: "test",
  error: "bug",
  debug: "bug",
  config: "settings",
  configuration: "settings",
  gear: "settings",
  next: "arrowRight",
  step: "arrowRight",
  goal: "flag",
  milestone: "flag",
  favorite: "star",
  success: "check",
  ok: "check",
  done: "check",
  pass: "check",
  fail: "x",
  no: "x",
  pro: "check",
  con: "x",
  cpu: "cpu",
  processor: "cpu",
  memory: "cpu",
};

const FALLBACK = "box";

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Fuente de iconos externa: recibe el nombre normalizado y el crudo, y devuelve
 * un `IconDef` o null si no lo resuelve. Permite enchufar sets de marcas
 * (ej. Simple Icons) sin que el core dependa de ellos.
 */
export type IconSource = (normalized: string, raw: string) => IconDef | null;

interface RegisteredSource {
  resolve: IconSource;
  names: string[];
}

const sources: RegisteredSource[] = [];

/** Registra una fuente de iconos (se consulta antes que los iconos integrados). */
export function registerIconSource(resolve: IconSource, names: string[] = []): void {
  sources.unshift({ resolve, names });
}

/** Quita todas las fuentes registradas (útil en tests). */
export function clearIconSources(): void {
  sources.length = 0;
}

export interface ResolvedIcon {
  /** nombre canónico encontrado en el registro */
  name: string;
  def: IconDef;
  /** true si se devolvió el icono de respaldo porque no hubo match */
  fallback: boolean;
}

/**
 * Resuelve un nombre de icono de forma tolerante:
 * match exacto → alias → coincidencia parcial → icono de respaldo.
 */
export function resolveIcon(name?: string): ResolvedIcon {
  if (!name) return { name: FALLBACK, def: icons[FALLBACK]!, fallback: true };
  const n = normalize(name);

  // 1) fuentes externas (ej. logos de Simple Icons) tienen prioridad
  for (const src of sources) {
    const def = src.resolve(n, name);
    if (def) return { name: n, def, fallback: false };
  }

  if (icons[n]) return { name: n, def: icons[n]!, fallback: false };
  if (aliases[n] && icons[aliases[n]!]) {
    const canonical = aliases[n]!;
    return { name: canonical, def: icons[canonical]!, fallback: false };
  }

  // coincidencia parcial sobre claves y alias
  for (const key of Object.keys(icons)) {
    if (n.includes(key) || key.includes(n)) return { name: key, def: icons[key]!, fallback: false };
  }
  for (const [alias, canonical] of Object.entries(aliases)) {
    if ((n.includes(alias) || alias.includes(n)) && icons[canonical]) {
      return { name: canonical, def: icons[canonical]!, fallback: false };
    }
  }

  return { name: FALLBACK, def: icons[FALLBACK]!, fallback: true };
}

/** Lista de nombres de iconos disponibles (integrados + fuentes registradas). */
export function iconNames(): string[] {
  const fromSources = sources.flatMap((s) => s.names);
  return [...new Set([...Object.keys(icons), ...fromSources])];
}
