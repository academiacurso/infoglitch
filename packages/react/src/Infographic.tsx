import { useMemo, type CSSProperties } from "react";
import { renderToString, type InfographicDoc } from "@infoglitch/core";

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
  className?: string;
  style?: CSSProperties;
}

const EMPTY: InfographicDoc = { template: "feature-list", sections: [] } as InfographicDoc;

/**
 * Renderiza una infografía de infoglitch como SVG embebido.
 * Acepta un documento JSON (`doc`) o una cadena DSL (`source`).
 */
export function Infographic({ doc, source, width, theme, fontCss, className, style }: InfographicProps) {
  const svg = useMemo(() => {
    const input = source ?? doc ?? EMPTY;
    try {
      return renderToString(input, { width, theme, fontCss });
    } catch {
      return "";
    }
  }, [doc, source, width, theme, fontCss]);

  return (
    <div
      className={className}
      style={style}
      // El SVG es generado por el core a partir de datos propios (no HTML externo).
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
