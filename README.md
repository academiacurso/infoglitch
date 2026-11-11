# infoglitch

[![npm](https://img.shields.io/npm/v/@infoglitch/core?color=4e8c56&label=%40infoglitch%2Fcore)](https://www.npmjs.com/package/@infoglitch/core)
[![CI](https://github.com/academiacurso/infoglitch/actions/workflows/ci.yml/badge.svg)](https://github.com/academiacurso/infoglitch/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-f5b31e)](LICENSE)
[![demo](https://img.shields.io/badge/demo-infoglitch.duglasm.com-2d5a34)](https://infoglitch.duglasm.com/)

Framework para **generar y renderizar infografías del ámbito de la programación**, con
IA opcional. Inspirado en `@antv/infographic`, pero enfocado en temática dev (pipelines,
arquitecturas, benchmarks, comparativas de stacks, roadmaps, snippets…).

**19 tipos de sección · 17 plantillas de layout · 11 temas · exporta a SVG/PNG/PDF · CLI · React/Vue/Svelte.**

> El **JSON es la fuente de verdad** y genera el SVG por sí solo. La IA es un productor
> **opcional** de ese JSON.

```
  Camino A (sin IA):  InfographicDoc (JSON) ──► renderToString() ──► SVG
  Camino B (con IA):  prompt ──► @infoglitch/ai ──► JSON ──► (Camino A) ──► SVG
```

## Paquetes

| Paquete | Qué hace |
|---|---|
| [`@infoglitch/core`](packages/core) | Modelo de documento (zod), DSL textual tolerante, renderer SVG, plantillas, temas (`defineTheme`/`registerTheme`) e iconos. Sin dependencias de IA ni de red. |
| [`@infoglitch/ai`](packages/ai) | Adapter de Anthropic (server-side, BYO key): prompt → documento/infografía. Streaming incluido. |
| [`@infoglitch/cli`](packages/cli) | **CLI**: `npx @infoglitch/cli render deck.dsl -o out.png`. Renderiza DSL/JSON a SVG/PNG/PDF desde la terminal. |
| [`@infoglitch/react`](packages/react) | Componente `<Infographic/>` y hook `useStreamingInfographic`. |
| [`@infoglitch/vue`](packages/vue) | Componente Vue 3 `<Infographic/>` y composable `useStreamingInfographic`. |
| [`@infoglitch/svelte`](packages/svelte) | Componente Svelte `<Infographic/>` (compatible 4 y 5). |
| [`@infoglitch/export`](packages/export) | Exporta el SVG a **PNG** y **PDF**: en el navegador (sin deps) y server-side con `@infoglitch/export/node` (resvg). |
| [`@infoglitch/icons`](packages/icons) | Logos de lenguajes y herramientas (**Simple Icons**, CC0) como fuente de iconos. |
| [`@infoglitch/fonts`](packages/fonts) | Inter + JetBrains Mono (OFL) embebibles para que PNG/PDF se vean igual en todos lados. |

## Uso rápido (sin IA)

```ts
import { renderToString } from "@infoglitch/core";

const svg = renderToString({
  template: "pipeline-steps",
  theme: "dark-terminal",
  title: "Pipeline de CI/CD",
  sections: [
    { type: "title", text: "De commit a producción", icon: "rocket" },
    {
      type: "steps",
      items: [
        { label: "Build", desc: "Compila", icon: "package" },
        { label: "Test", desc: "Suite", icon: "test" },
        { label: "Deploy", desc: "Prod", icon: "rocket" },
      ],
    },
  ],
});
// -> string SVG listo para guardar o inyectar
```

También podés partir del **DSL textual** (tolerante, ideal para streaming de LLM):

```ts
import { renderToString } from "@infoglitch/core";

renderToString(`template metrics-grid
section stat
  - value 12k
    label req/s
  - value 38
    label latencia
    unit ms
`);
```

## Uso con IA (server-side)

```ts
import { AnthropicAdapter, generateInfographic } from "@infoglitch/ai";

// ANTHROPIC_API_KEY en el entorno. Correr SOLO en servidor/Node.
const adapter = new AnthropicAdapter();
const { doc, svg } = await generateInfographic(adapter, {
  prompt: "Arquitectura de microservicios de e-commerce",
});
```

### Proveedores de IA

Cualquier adapter implementa la misma interfaz `TextModelAdapter`, así que el resto
del código no cambia según el proveedor:

| Proveedor | Clase | Clave (env) | Modelo por defecto |
|---|---|---|---|
| Anthropic (default) | `AnthropicAdapter` | `ANTHROPIC_API_KEY` | `claude-opus-5-5` |
| OpenAI / ChatGPT | `OpenAIChatAdapter` | `OPENAI_API_KEY` | `gpt-4o-mini` |
| OpenRouter | `OpenRouterAdapter` | `OPENROUTER_API_KEY` | `openai/gpt-4o-mini` |
| Google Gemini | `GeminiAdapter` | `GEMINI_API_KEY` | `gemini-2.0-flash` |

OpenRouter y Gemini se hablan por la **API compatible con OpenAI**. Elegí proveedor
por nombre con `createAdapter`:

```ts
import { createAdapter, generateInfographic } from "@infoglitch/ai";

const adapter = createAdapter(
  (process.env.INFOGLITCH_PROVIDER as any) ?? "openrouter",
  { model: "anthropic/claude-3.5-sonnet" }, // opcional: override de modelo
);
const { svg } = await generateInfographic(adapter, { prompt: "Pipeline de CI/CD" });
```

Cualquier proveedor compatible con OpenAI (Groq, Together, etc.) se usa con
`OpenAIAdapter` pasándole `baseURL` + `apiKey` + `model`.

#### Restringir modelos en el backend

Dejar que la persona elija el modelo es cómodo, pero en un deploy público conviene
limitar qué modelos se aceptan. `assertModelAllowed` valida contra una whitelist:

```ts
import { createAdapter, assertModelAllowed, ModelNotAllowedError } from "@infoglitch/ai";

const WHITELIST = {
  anthropic: ["claude-opus-5-5", "claude-haiku-5-5"],
  openai: ["gpt-4o-mini"],
};

try {
  // devuelve el modelo normalizado, o undefined si viene vacío (usa el default)
  const model = assertModelAllowed(req.body.model, WHITELIST, { provider });
  const adapter = createAdapter(provider, { model });
} catch (err) {
  if (err instanceof ModelNotAllowedError) {
    // err.allowed tiene la lista permitida -> responder 400
  }
}
```

## React / Vue / Svelte

```tsx
import { Infographic } from "@infoglitch/react";   // o @infoglitch/vue, @infoglitch/svelte

<Infographic doc={doc} width={960} />;      // desde JSON
<Infographic source={dslString} />;         // desde DSL (streaming)
```

## Desde la terminal (CLI)

Sin escribir código: `@infoglitch/cli` renderiza un DSL/JSON a SVG/PNG/PDF.

```bash
npx @infoglitch/cli init                              # crea deck.dsl de ejemplo
npx @infoglitch/cli render deck.dsl -o deck.png --theme cyber --width 1200
npx @infoglitch/cli render deck.dsl -o deck.svg --watch   # re-render al guardar
cat deck.dsl | npx @infoglitch/cli render - -f pdf > deck.pdf
```

PNG/PDF server-side también disponibles por API con `@infoglitch/export/node`
(`renderPng`/`renderPdf`, con fuentes embebidas vía `fontBuffers`).

## Iconos de lenguajes (logos)

El core trae un set genérico (estilo línea) sin dependencias. Para logos reales de
lenguajes y herramientas, `@infoglitch/icons` enchufa **Simple Icons** (CC0):

```ts
import { registerSimpleIcons } from "@infoglitch/icons";
import { renderToString } from "@infoglitch/core";

registerSimpleIcons();                      // monocromo: heredan el color del tema
// registerSimpleIcons({ brandColors: true }); // con colores oficiales de marca
// await registerDevicon();                  // ~90 logos a TODO COLOR (Devicon, incl. Java y C#)

const svg = renderToString({
  template: "stack-comparison",
  sections: [
    { type: "comparison", columns: [
      { title: "Rust", icon: "rust", points: ["Performance"] },
      { title: "Go", icon: "go", points: ["Simple"] },
    ]},
  ],
});
```

- ~110 logos curados (tree-shakeable) con alias (`nodejs`→`nodedotjs`, `k8s`→`kubernetes`,
  `csharp`→`dotnet`, `golang`→`go`…), **o el set completo** (~3470 logos) con
  `await registerSimpleIconsAll()` (import dinámico; ideal en server/Node).
- El motor de iconos es **pluggable**: `registerIconSource(fn, names)` en el core permite
  enchufar cualquier otra fuente (ej. Devicon).
- Si registrás esta fuente antes de generar con IA, sus nombres se agregan automáticamente
  al prompt (vía `iconNames()`), así el modelo referencia los logos correctos.

> Los logos son CC0 (Simple Icons); las marcas pertenecen a sus dueños. El default es
> monocromo (hereda el color del tema) para evitar problemas de contraste; los colores de
> marca son opt-in.

## Output consistente (fuentes)

Para que PNG/PDF se vean **idénticos en cualquier máquina** (sin depender de las fuentes
del sistema), embebé las fuentes con `@infoglitch/fonts`:

```ts
// Navegador (preview / export con canvas)
import { fontFaceCss, loadFonts } from "@infoglitch/fonts";
await loadFonts();                               // registra las fuentes en el documento
const svg = renderToString(doc, { fontCss: await fontFaceCss() });
// <Infographic doc={doc} fontCss={await fontFaceCss()} />

// Node (rasterizar con resvg) — resvg NO lee @font-face embebido: pasale los buffers
import { fontBuffers } from "@infoglitch/fonts";
import { Resvg } from "@resvg/resvg-js";
const png = new Resvg(renderToString(doc), {
  font: { loadSystemFonts: false, fontBuffers: (await fontBuffers()).map(Buffer.from), defaultFontFamily: "Inter" },
}).render().asPng();
```

## Exportar a PNG / PDF

En el navegador, `@infoglitch/export` rasteriza el SVG y dispara la descarga:

```ts
import { renderToString } from "@infoglitch/core";
import { downloadPng, downloadPdf, svgToPngBlob } from "@infoglitch/export";

const svg = renderToString(doc, { width: 960 });

await downloadPng(svg, "infografia.png", { scale: 2 }); // PNG (lossless)
await downloadPdf(svg, "infografia.pdf");               // PDF (imagen a página completa)

const blob = await svgToPngBlob(svg); // si preferís manejar el Blob vos
```

- PNG vía `<canvas>`; PDF **armado a mano** (FlateDecode con `CompressionStream`), sin libs externas.
- Es **browser-only** (usa `document`/`canvas`). Para exportar en Node, rasterizá el SVG con
  `@resvg/resvg-js` o `sharp` y pasá los píxeles RGB a `buildPdf(...)` (función pura expuesta por el paquete).

## Plantillas

De apilado: `stack`, `pipeline-steps`, `architecture-boxes`, `stack-comparison`,
`metrics-grid`, `code-callout`, `timeline-roadmap`, `feature-list`, `concept-hero`,
`versus`, `flowchart`, `roadmap`, `icon-grid`, `chart`. Y de **layout multi-columna**
(balancean por altura; lo ancho va full-width en su lugar): **`two-column`**, **`grid`**
(3 columnas) y **`hero-split`**. Extensibles con `registerTemplate()` / `makeColumnsTemplate()`.

Tipos de sección (19): `title`, `steps`, `comparison`, `stat`, `codeSnippet` (con syntax
highlighting), `architecture`, `timeline`, `list`, `callout`, `versus`, `flow`, `roadmap`,
`iconGrid`, `chart` (barras/torta/dona/líneas), `quote` (cita/testimonio), `kpi` (número
grande con delta), `table` (tabla), `progress` (barras de %) y `columns` (layout lado a lado).

**Estilo inline por DSL:** `accent <color>` en cualquier sección sobrescribe su acento
sin registrar un tema.

## Temas

11 temas: `dark-terminal`, `light-docs`, `glitch`, `neon-night`, `blueprint`, `cyber`,
y **`forest`** (verde/dorado), **`sunset`** (cálido), **`paper`** (claro minimalista),
**`frost`** (nórdico) y **`solar`** (teal). Fondo con gradiente, glow neón, acento por
sección y degradé de título. Creá el tuyo con `defineTheme()` / `registerTheme()`. El
tema controla también la paleta de resaltado de código.

## Desarrollo

```bash
pnpm install
pnpm build        # compila los 3 paquetes (tsup: ESM + CJS + .d.ts)
pnpm test         # vitest
pnpm typecheck
pnpm lint
```

Ejemplos: [`examples/node-cli`](examples/node-cli) (JSON → SVG sin IA, ejecutable) y
[`examples/next-playground`](examples/next-playground) (IA server-side + preview React).

### Galería

`examples/node-cli/build-docs.mjs` genera una **galería de ejemplos** en `docs/index.html`
(SVG inline + fuentes embebidas, se abre directo en el navegador):

```bash
pnpm install && pnpm build
node examples/node-cli/build-docs.mjs   # -> docs/index.html
```

### Publicación

Monorepo con **pnpm + Turbo + Changesets**, publicación con **npm provenance**. Pasos
completos (scope `@infoglitch`, login, dry-run, CI) en **[PUBLISHING.md](PUBLISHING.md)**.

## Licencia

MIT
