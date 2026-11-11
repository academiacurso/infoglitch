import type { InfographicDoc } from "@infoglitch/core";

export interface GenerateInput {
  /** Instrucción en lenguaje natural (ej. "pipeline de CI/CD en 4 pasos"). */
  prompt: string;
  /** Id de plantilla a forzar (si se omite, el modelo elige una del catálogo). */
  template?: string;
  /** Id de tema sugerido. */
  theme?: string;
}

/**
 * Contrato de un proveedor de texto. Desacopla el core de cualquier LLM:
 * `@infoglitch/ai` trae el adapter de Anthropic por defecto, pero se puede
 * implementar esta interfaz para otro proveedor.
 *
 * Pensado para ejecutarse en servidor/Node (BYO API key); nunca en el browser.
 */
export interface TextModelAdapter {
  /** Genera un `InfographicDoc` validado a partir del prompt. */
  generateDoc(input: GenerateInput): Promise<InfographicDoc>;
  /**
   * Transmite el DSL token a token. Cada valor emitido es un fragmento de texto;
   * acumulá el buffer y renderizalo con `renderToString` del core para preview
   * progresivo (el DSL es tolerante a fragmentos incompletos).
   */
  streamDsl(input: GenerateInput): AsyncIterable<string>;
}
