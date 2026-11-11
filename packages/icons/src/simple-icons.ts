import type { IconDef, IconSource } from "@infoglitch/core";
import { registerIconSource } from "@infoglitch/core";
import {
  siJavascript, siTypescript, siPython, siRust, siGo, siCplusplus, siC, siDotnet,
  siKotlin, siSwift, siRuby, siPhp, siDart, siScala, siElixir, siHaskell, siClojure,
  siLua, siR, siJulia, siOcaml, siErlang, siSolidity, siZig, siCrystal, siNim,
  siHtml5, siCss, siSass, siGraphql, siReact, siVuedotjs, siAngular, siSvelte,
  siNextdotjs, siNodedotjs, siDeno, siBun, siExpress, siNestjs, siDjango, siFlask,
  siFastapi, siSpring, siLaravel, siRubyonrails, siTailwindcss, siBootstrap, siRedux,
  siJquery, siAstro, siRemix, siSolid, siQwik, siHtmx, siWebassembly, siDocker,
  siKubernetes, siGit, siGithub, siGitlab, siLinux, siPostgresql, siMysql, siMongodb,
  siRedis, siSqlite, siNginx, siApachekafka, siRabbitmq, siElasticsearch, siKibana,
  siGooglecloud, siCloudflare, siVercel, siNetlify, siTerraform, siAnsible, siJenkins,
  siGithubactions, siWebpack, siVite, siNpm, siPnpm, siYarn, siJest, siVitest,
  siCypress, siStorybook, siFigma, siPrisma, siSupabase, siFirebase, siGrafana,
  siPrometheus, siJupyter, siNumpy, siPandas, siPytorch, siTensorflow, siScikitlearn,
  siAndroid, siApple, siGithubcopilot, siDatadog, siSentry, siStripe, siPostman,
  siSwagger, siWordpress,
} from "simple-icons";

interface SimpleIcon {
  title: string;
  slug: string;
  hex: string;
  path: string;
}

const RAW: SimpleIcon[] = [
  siJavascript, siTypescript, siPython, siRust, siGo, siCplusplus, siC, siDotnet,
  siKotlin, siSwift, siRuby, siPhp, siDart, siScala, siElixir, siHaskell, siClojure,
  siLua, siR, siJulia, siOcaml, siErlang, siSolidity, siZig, siCrystal, siNim,
  siHtml5, siCss, siSass, siGraphql, siReact, siVuedotjs, siAngular, siSvelte,
  siNextdotjs, siNodedotjs, siDeno, siBun, siExpress, siNestjs, siDjango, siFlask,
  siFastapi, siSpring, siLaravel, siRubyonrails, siTailwindcss, siBootstrap, siRedux,
  siJquery, siAstro, siRemix, siSolid, siQwik, siHtmx, siWebassembly, siDocker,
  siKubernetes, siGit, siGithub, siGitlab, siLinux, siPostgresql, siMysql, siMongodb,
  siRedis, siSqlite, siNginx, siApachekafka, siRabbitmq, siElasticsearch, siKibana,
  siGooglecloud, siCloudflare, siVercel, siNetlify, siTerraform, siAnsible, siJenkins,
  siGithubactions, siWebpack, siVite, siNpm, siPnpm, siYarn, siJest, siVitest,
  siCypress, siStorybook, siFigma, siPrisma, siSupabase, siFirebase, siGrafana,
  siPrometheus, siJupyter, siNumpy, siPandas, siPytorch, siTensorflow, siScikitlearn,
  siAndroid, siApple, siGithubcopilot, siDatadog, siSentry, siStripe, siPostman,
  siSwagger, siWordpress,
];

/** Mapa slug -> icono de Simple Icons. */
const BY_SLUG: Record<string, SimpleIcon> = {};
for (const ic of RAW) BY_SLUG[ic.slug] = ic;

/** Alias de nombres comunes hacia el slug de Simple Icons. */
const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  golang: "go",
  cpp: "cplusplus",
  "c++": "cplusplus",
  csharp: "dotnet",
  cs: "dotnet",
  net: "dotnet",
  node: "nodedotjs",
  nodejs: "nodedotjs",
  vue: "vuedotjs",
  vuejs: "vuedotjs",
  next: "nextdotjs",
  nextjs: "nextdotjs",
  rails: "rubyonrails",
  ror: "rubyonrails",
  k8s: "kubernetes",
  postgres: "postgresql",
  postgre: "postgresql",
  mongo: "mongodb",
  tailwind: "tailwindcss",
  scss: "sass",
  html: "html5",
  css3: "css",
  wasm: "webassembly",
  openapi: "swagger",
  gha: "githubactions",
  actions: "githubactions",
  gcp: "googlecloud",
  gcloud: "googlecloud",
  kafka: "apachekafka",
  sklearn: "scikitlearn",
  torch: "pytorch",
  tf: "terraform",
  copilot: "githubcopilot",
};

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9+]/g, "");
}

function toDef(ic: SimpleIcon, brandColors: boolean): IconDef {
  return {
    body: `<path d="${ic.path}" />`,
    mode: "fill",
    color: brandColors ? `#${ic.hex}` : undefined,
  };
}

export interface SimpleIconsOptions {
  /** Usar el color oficial de marca de cada logo (default false: heredan el color del tema). */
  brandColors?: boolean;
}

/** Crea la fuente de iconos (sin registrarla). Útil para componer manualmente. */
export function simpleIconsSource(options: SimpleIconsOptions = {}): IconSource {
  const brand = options.brandColors ?? false;
  return (normalized) => {
    const slug = BY_SLUG[normalized] ? normalized : ALIASES[normalized];
    const ic = slug ? BY_SLUG[slug] : undefined;
    return ic ? toDef(ic, brand) : null;
  };
}

/** Lista de nombres disponibles (slugs + alias), para el prompt de la IA. */
export function simpleIconNames(): string[] {
  return [...Object.keys(BY_SLUG), ...Object.keys(ALIASES)];
}

/**
 * Registra los logos de Simple Icons como fuente de iconos del core.
 * Llamalo una vez al inicio (server o browser), antes de renderizar.
 *
 * Usa el set curado (~110 logos): tree-shakeable y liviano.
 *
 * @example
 *   import { registerSimpleIcons } from "@infoglitch/icons";
 *   registerSimpleIcons();                       // monocromo (hereda color del tema)
 *   registerSimpleIcons({ brandColors: true });  // con colores de marca
 */
export function registerSimpleIcons(options: SimpleIconsOptions = {}): void {
  registerIconSource(simpleIconsSource(options), simpleIconNames());
}

/**
 * Registra el set COMPLETO de Simple Icons (~3500 logos) como fuente de iconos.
 *
 * Es asíncrono (import dinámico) para no incluir todo el paquete en bundles que
 * sólo usan el set curado. Ideal en server/Node. Devuelve cuántos logos cargó.
 *
 * Nota: para el prompt de la IA se siguen exponiendo los nombres curados
 * (`simpleIconNames()`), pero **cualquier** slug de Simple Icons se resuelve.
 *
 * @example
 *   import { registerSimpleIconsAll } from "@infoglitch/icons";
 *   await registerSimpleIconsAll();                      // monocromo
 *   await registerSimpleIconsAll({ brandColors: true }); // colores de marca
 */
export async function registerSimpleIconsAll(options: SimpleIconsOptions = {}): Promise<number> {
  const brand = options.brandColors ?? false;
  const mod = (await import("simple-icons")) as unknown as Record<string, SimpleIcon>;
  const map: Record<string, SimpleIcon> = {};
  for (const key of Object.keys(mod)) {
    const ic = mod[key];
    if (ic && typeof ic === "object" && typeof ic.slug === "string") map[ic.slug] = ic;
  }
  const source: IconSource = (normalized) => {
    const direct = map[normalized];
    if (direct) return toDef(direct, brand);
    const aliased = ALIASES[normalized];
    const ic = aliased ? map[aliased] : undefined;
    return ic ? toDef(ic, brand) : null;
  };
  registerIconSource(source, simpleIconNames());
  return Object.keys(map).length;
}
