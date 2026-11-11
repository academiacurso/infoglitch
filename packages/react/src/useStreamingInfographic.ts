import { useEffect, useRef, useState } from "react";

export interface StreamingState {
  /** DSL acumulado hasta el momento (pasalo como `source` a <Infographic/>). */
  source: string;
  /** true mientras llegan fragmentos. */
  streaming: boolean;
  /** error si el stream falla. */
  error: Error | null;
}

/**
 * Consume un stream de fragmentos de DSL (ej. el emitido por el adapter de IA a
 * través de un endpoint) y acumula el buffer para re-render progresivo.
 *
 * @param makeStream función que crea el AsyncIterable al montar / cambiar `deps`.
 * @param deps dependencias que reinician el stream.
 */
export function useStreamingInfographic(
  makeStream: (() => AsyncIterable<string>) | undefined,
  deps: unknown[] = [],
): StreamingState {
  const [source, setSource] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    if (!makeStream) return;
    cancelled.current = false;
    setSource("");
    setError(null);
    setStreaming(true);

    (async () => {
      try {
        let buffer = "";
        for await (const chunk of makeStream()) {
          if (cancelled.current) return;
          buffer += chunk;
          setSource(buffer);
        }
      } catch (err) {
        if (!cancelled.current) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled.current) setStreaming(false);
      }
    })();

    return () => {
      cancelled.current = true;
    };
  }, deps);

  return { source, streaming, error };
}
