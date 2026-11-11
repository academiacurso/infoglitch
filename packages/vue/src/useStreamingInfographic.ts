import { onUnmounted, ref, watch, type Ref } from "vue";

export interface StreamingState {
  /** DSL acumulado (pasalo como `source` a <Infographic/>). */
  source: Ref<string>;
  /** true mientras llegan fragmentos. */
  streaming: Ref<boolean>;
  /** error si el stream falla. */
  error: Ref<Error | null>;
}

/**
 * Consume un stream de fragmentos de DSL (ej. el emitido por el adapter de IA a
 * través de un endpoint) y acumula el buffer para re-render progresivo.
 *
 * @param makeStream función (o ref a función) que crea el AsyncIterable.
 */
export function useStreamingInfographic(
  makeStream: Ref<(() => AsyncIterable<string>) | undefined> | (() => AsyncIterable<string>) | undefined,
): StreamingState {
  const source = ref("");
  const streaming = ref(false);
  const error = ref<Error | null>(null);
  let cancelled = false;

  const getFactory = (): (() => AsyncIterable<string>) | undefined =>
    typeof makeStream === "function" || makeStream === undefined
      ? (makeStream as (() => AsyncIterable<string>) | undefined)
      : makeStream.value;

  function start(): void {
    const factory = getFactory();
    if (!factory) return;
    cancelled = false;
    source.value = "";
    error.value = null;
    streaming.value = true;

    void (async () => {
      try {
        let buffer = "";
        for await (const chunk of factory()) {
          if (cancelled) return;
          buffer += chunk;
          source.value = buffer;
        }
      } catch (err) {
        if (!cancelled) error.value = err instanceof Error ? err : new Error(String(err));
      } finally {
        if (!cancelled) streaming.value = false;
      }
    })();
  }

  if (makeStream && typeof makeStream !== "function") {
    watch(makeStream, () => { cancelled = true; start(); }, { immediate: true });
  } else {
    start();
  }

  onUnmounted(() => { cancelled = true; });

  return { source, streaming, error };
}
