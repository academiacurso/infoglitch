import type { SvelteComponent } from "svelte";
import type { InfographicDoc } from "@infoglitch/core";

export interface InfographicProps {
  /** Documento JSON (fuente de verdad). */
  doc?: InfographicDoc;
  /** DSL textual (alternativa a `doc`, útil para streaming). */
  source?: string;
  /** Ancho del lienzo en px. */
  width?: number;
  /** Id de tema (override del tema del documento). */
  theme?: string;
  /** CSS `@font-face` a embeber (ver `@infoglitch/fonts`). */
  fontCss?: string;
}

/** Componente Svelte que renderiza una infografía de infoglitch como SVG embebido. */
export class Infographic extends SvelteComponent<InfographicProps> {}

export { renderToString, parseDsl } from "@infoglitch/core";
