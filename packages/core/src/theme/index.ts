export interface CodePalette {
  bg: string;
  text: string;
  keyword: string;
  string: string;
  comment: string;
  number: string;
  fn: string;
  punct: string;
}

export interface BackgroundGradient {
  type: "linear" | "radial";
  from: string;
  to: string;
  /** ángulo en grados para gradiente lineal (default 135). */
  angle?: number;
}

export interface Theme {
  id: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accent2: string;
  border: string;
  fontFamily: string;
  monoFamily: string;
  radius: number;

  /** Paleta de acentos para asignar un color neón por sección. */
  accents?: string[];
  /** Fondo con gradiente (en vez de color plano). */
  backgroundGradient?: BackgroundGradient;
  /** 'flat' (borde sutil) o 'neon' (borde de color + glow). */
  panelStyle?: "flat" | "neon";
  /** Degradé para el texto del título [desde, hasta]. */
  titleGradient?: [string, string];
  /** Activa el filtro de glow en bordes/títulos. */
  glow?: boolean;
  /** Paleta para resaltado de código. */
  code?: CodePalette;
}

const MONO = "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

const neonCode: CodePalette = {
  bg: "#0a0e14",
  text: "#d7dee8",
  keyword: "#c792ea",
  string: "#c3e88d",
  comment: "#5c6773",
  number: "#f78c6c",
  fn: "#82aaff",
  punct: "#89ddff",
};

const darkCode: CodePalette = {
  bg: "#0a0e14",
  text: "#d7dee8",
  keyword: "#ff7b72",
  string: "#a5d6ff",
  comment: "#8b949e",
  number: "#79c0ff",
  fn: "#d2a8ff",
  punct: "#c9d1d9",
};

/* ------------------------------ temas base ------------------------------ */

export const darkTerminal: Theme = {
  id: "dark-terminal",
  background: "#0d1117",
  surface: "#161b22",
  surfaceAlt: "#21262d",
  text: "#e6edf3",
  textMuted: "#8b949e",
  accent: "#2f81f7",
  accent2: "#3fb950",
  border: "#30363d",
  fontFamily: SANS,
  monoFamily: MONO,
  radius: 10,
  code: darkCode,
};

export const lightDocs: Theme = {
  id: "light-docs",
  background: "#ffffff",
  surface: "#f6f8fa",
  surfaceAlt: "#eaeef2",
  text: "#1f2328",
  textMuted: "#636c76",
  accent: "#0969da",
  accent2: "#1a7f37",
  border: "#d0d7de",
  fontFamily: SANS,
  monoFamily: MONO,
  radius: 10,
  code: { ...darkCode, bg: "#0d1117" },
};

export const glitch: Theme = {
  id: "glitch",
  background: "#0b0014",
  surface: "#17082b",
  surfaceAlt: "#230c3d",
  text: "#f3e9ff",
  textMuted: "#a98bd0",
  accent: "#ff2e97",
  accent2: "#2ee6d6",
  border: "#3a1d5c",
  fontFamily: SANS,
  monoFamily: MONO,
  radius: 8,
  code: neonCode,
};

/* --------------------------- temas estilo póster ------------------------ */

/** Oscuro con glow neón multicolor (estilo "condicionales PHP" / "lenguaje vs framework"). */
export const neonNight: Theme = {
  id: "neon-night",
  background: "#070a12",
  surface: "#0e1420",
  surfaceAlt: "#121a2a",
  text: "#eaf2ff",
  textMuted: "#8ea0c0",
  accent: "#4f8cff",
  accent2: "#c792ea",
  border: "#1e2a44",
  fontFamily: SANS,
  monoFamily: MONO,
  radius: 14,
  accents: ["#4f8cff", "#c792ea", "#2ee6d6", "#3fb950", "#ff6b9d", "#f7b955"],
  backgroundGradient: { type: "radial", from: "#0f1a33", to: "#060810" },
  panelStyle: "neon",
  titleGradient: ["#4f8cff", "#c792ea"],
  glow: true,
  code: neonCode,
};

/** Azul corporativo sobre oscuro, paneles claros (estilo "COBOL" / "WordPress vs Medida"). */
export const blueprint: Theme = {
  id: "blueprint",
  background: "#0a1a2f",
  surface: "#102540",
  surfaceAlt: "#16304f",
  text: "#eaf2ff",
  textMuted: "#9db4d4",
  accent: "#2f81f7",
  accent2: "#28a745",
  border: "#1d3a5f",
  fontFamily: SANS,
  monoFamily: MONO,
  radius: 12,
  accents: ["#2f81f7", "#28a745", "#f0a020", "#8957e5", "#17a2b8"],
  backgroundGradient: { type: "linear", from: "#0e2b4a", to: "#081527", angle: 160 },
  panelStyle: "flat",
  titleGradient: ["#58a6ff", "#2f81f7"],
  glow: false,
  code: { ...darkCode, keyword: "#4ade80", string: "#a5d6ff" },
};

/** Negro con acentos azul vs naranja y glow (estilo "Python vs Java"). */
export const cyber: Theme = {
  id: "cyber",
  background: "#05070d",
  surface: "#0c1017",
  surfaceAlt: "#121823",
  text: "#eef3fb",
  textMuted: "#8da0b8",
  accent: "#38bdf8",
  accent2: "#fb923c",
  border: "#1a2330",
  fontFamily: SANS,
  monoFamily: MONO,
  radius: 12,
  accents: ["#38bdf8", "#fb923c", "#a78bfa", "#34d399", "#f472b6"],
  backgroundGradient: { type: "radial", from: "#0b1220", to: "#04060b" },
  panelStyle: "neon",
  titleGradient: ["#38bdf8", "#818cf8"],
  glow: true,
  code: neonCode,
};

export const themes: Record<string, Theme> = {
  [darkTerminal.id]: darkTerminal,
  [lightDocs.id]: lightDocs,
  [glitch.id]: glitch,
  [neonNight.id]: neonNight,
  [blueprint.id]: blueprint,
  [cyber.id]: cyber,
};

export const defaultThemeId = darkTerminal.id;

/** Devuelve el tema por id, con fallback tolerante al tema por defecto. */
export function getTheme(id?: string): Theme {
  if (id && themes[id]) return themes[id];
  return themes[defaultThemeId]!;
}

const DEFAULT_CODE: CodePalette = darkCode;

/** Paleta de código del tema, con fallback. */
export function codePalette(theme: Theme): CodePalette {
  return theme.code ?? DEFAULT_CODE;
}

/** Acentos del tema (paleta neón o el acento principal). */
export function themeAccents(theme: Theme): string[] {
  return theme.accents && theme.accents.length ? theme.accents : [theme.accent];
}
