import { registerIconSource, type IconDef, type IconSource } from "@infoglitch/core";

/**
 * Fuente de iconos basada en Devicon (logos a color, multi-path).
 *
 * Los datos (~90 logos) se cargan con import dinámico para no inflar el bundle de
 * quien sólo use Simple Icons. Devicon es MIT; las marcas son de sus dueños.
 */

const ALIASES: Record<string, string> = {
  node: "nodejs",
  vue: "vuejs",
  vuedotjs: "vuejs",
  next: "nextjs",
  nextdotjs: "nextjs",
  nuxt: "nuxtjs",
  golang: "go",
  cpp: "cplusplus",
  cs: "csharp",
  dotnet: "dotnetcore",
  net: "dotnetcore",
  k8s: "kubernetes",
  postgres: "postgresql",
  postgre: "postgresql",
  mongo: "mongodb",
  tailwind: "tailwindcss",
  html: "html5",
  css: "css3",
  ts: "typescript",
  js: "javascript",
  py: "python",
  aws: "amazonwebservices",
  gcp: "googlecloud",
  gcloud: "googlecloud",
  mui: "materialui",
  vs: "vscode",
  rails: "rails",
};

/**
 * Registra los logos de Devicon (a color) como fuente de iconos del core.
 * Es asíncrono (import dinámico). Devuelve cuántos logos cargó.
 *
 * Llamalo **después** de `registerSimpleIcons()` si querés que los logos a color
 * tengan prioridad sobre los monocromos.
 *
 * @example
 *   import { registerDevicon } from "@infoglitch/icons";
 *   await registerDevicon();
 */
export async function registerDevicon(): Promise<number> {
  const { DEVICON } = await import("./devicon-data.js");
  const source: IconSource = (normalized) => {
    const key = DEVICON[normalized] ? normalized : ALIASES[normalized];
    const entry = key ? DEVICON[key] : undefined;
    if (!entry) return null;
    return { body: entry.body, mode: "raw", viewBox: entry.viewBox } satisfies IconDef;
  };
  registerIconSource(source, [...Object.keys(DEVICON), ...Object.keys(ALIASES)]);
  return Object.keys(DEVICON).length;
}

/** Lista de slugs de Devicon disponibles. */
export async function deviconSlugs(): Promise<string[]> {
  const { DEVICON } = await import("./devicon-data.js");
  return Object.keys(DEVICON);
}
