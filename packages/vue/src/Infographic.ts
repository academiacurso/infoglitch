import { computed, defineComponent, h, type PropType } from "vue";
import { renderToString, type InfographicDoc } from "@infoglitch/core";

const EMPTY: InfographicDoc = { template: "feature-list", sections: [] } as InfographicDoc;

/**
 * Componente Vue 3 que renderiza una infografía de infoglitch como SVG embebido.
 * Acepta un documento JSON (`doc`) o una cadena DSL (`source`).
 *
 *   <Infographic :source="dsl" theme="cyber" :width="1000" />
 */
export const Infographic = defineComponent({
  name: "Infographic",
  props: {
    /** Documento JSON (fuente de verdad). */
    doc: { type: Object as PropType<InfographicDoc>, default: undefined },
    /** DSL textual (alternativa a `doc`, útil para streaming). */
    source: { type: String, default: undefined },
    /** Ancho del lienzo en px. */
    width: { type: Number, default: undefined },
    /** Id de tema (override del tema del documento). */
    theme: { type: String, default: undefined },
    /** CSS `@font-face` a embeber (ver `@infoglitch/fonts`). */
    fontCss: { type: String, default: undefined },
  },
  setup(props) {
    const svg = computed(() => {
      const input = props.source ?? props.doc ?? EMPTY;
      try {
        return renderToString(input, { width: props.width, theme: props.theme, fontCss: props.fontCss });
      } catch {
        return "";
      }
    });
    // El SVG lo genera el core a partir de datos propios (no HTML externo).
    return () => h("div", { class: "infoglitch", innerHTML: svg.value });
  },
});
