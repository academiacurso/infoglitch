<script>
  // Componente Svelte que renderiza una infografía de infoglitch como SVG embebido.
  // Compatible con Svelte 4 y 5 (sintaxis `export let`).
  //   <Infographic source={dsl} theme="cyber" width={1000} />
  import { renderToString } from "@infoglitch/core";

  /** Documento JSON (fuente de verdad). */
  export let doc = undefined;
  /** DSL textual (alternativa a `doc`, útil para streaming). */
  export let source = undefined;
  /** Ancho del lienzo en px. */
  export let width = undefined;
  /** Id de tema (override del tema del documento). */
  export let theme = undefined;
  /** CSS `@font-face` a embeber (ver `@infoglitch/fonts`). */
  export let fontCss = undefined;

  const EMPTY = { template: "feature-list", sections: [] };

  $: svg = renderSafe(source ?? doc ?? EMPTY, width, theme, fontCss);

  function renderSafe(input, w, t, css) {
    try {
      return renderToString(input, { width: w, theme: t, fontCss: css });
    } catch {
      return "";
    }
  }
</script>

<!-- El SVG lo genera el core a partir de datos propios (no HTML externo). -->
<div class="infoglitch">{@html svg}</div>
