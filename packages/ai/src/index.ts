import { renderToString, type InfographicDoc } from "@infoglitch/core";
import type { GenerateInput, TextModelAdapter } from "./adapter.js";
import { AnthropicAdapter, type AnthropicAdapterOptions } from "./anthropic.js";
import {
  GeminiAdapter,
  OpenAIChatAdapter,
  OpenRouterAdapter,
  type OpenAICompatibleOptions,
  type OpenRouterAdapterOptions,
} from "./openai.js";

export type { GenerateInput, TextModelAdapter } from "./adapter.js";
export { BaseTextAdapter } from "./base.js";
export { AnthropicAdapter, type AnthropicAdapterOptions } from "./anthropic.js";
export {
  OpenAIAdapter,
  OpenAIChatAdapter,
  OpenRouterAdapter,
  GeminiAdapter,
  type OpenAICompatibleOptions,
  type OpenRouterAdapterOptions,
} from "./openai.js";
export { buildSystemPrompt, buildUserPrompt, cleanDsl } from "./prompt.js";
export {
  assertModelAllowed,
  isModelAllowed,
  resolveAllowed,
  ModelNotAllowedError,
  type ModelWhitelist,
  type AssertModelOptions,
} from "./models.js";

/** Proveedores de IA soportados de fábrica. */
export type ProviderName = "anthropic" | "openai" | "openrouter" | "gemini";

export interface CreateAdapterOptions {
  /** Clave de API (si se omite, se toma del entorno según el proveedor). */
  apiKey?: string;
  /** Modelo a usar. */
  model?: string;
  /** Límite de tokens de salida. */
  maxTokens?: number;
  /** URL base (proveedores compatibles con OpenAI). */
  baseURL?: string;
  /** Headers extra (compatibles con OpenAI). */
  defaultHeaders?: Record<string, string>;
  /** OpenRouter: header HTTP-Referer. */
  referer?: string;
  /** OpenRouter: header X-Title. */
  title?: string;
  /** Cliente ya construido (su tipo depende del proveedor). */
  client?: unknown;
}

/**
 * Crea un adapter a partir del nombre del proveedor. Útil para configurar el
 * proveedor por una variable de entorno sin acoplar el llamador a cada clase.
 *
 * @example
 *   const adapter = createAdapter(process.env.INFOGLITCH_PROVIDER ?? "anthropic");
 */
export function createAdapter(
  provider: ProviderName,
  options: CreateAdapterOptions = {},
): TextModelAdapter {
  switch (provider) {
    case "anthropic":
      return new AnthropicAdapter(options as unknown as AnthropicAdapterOptions);
    case "openai":
      return new OpenAIChatAdapter(options as unknown as OpenAICompatibleOptions);
    case "openrouter":
      return new OpenRouterAdapter(options as unknown as OpenRouterAdapterOptions);
    case "gemini":
      return new GeminiAdapter(options as unknown as OpenAICompatibleOptions);
    default: {
      const _never: never = provider;
      throw new Error(`Proveedor desconocido: ${String(_never)}`);
    }
  }
}

/**
 * Conveniencia: genera el documento con el adapter y lo renderiza a SVG en un
 * solo paso. Devuelve tanto el `doc` (JSON, fuente de verdad) como el `svg`.
 */
export async function generateInfographic(
  adapter: TextModelAdapter,
  input: GenerateInput,
  renderOpts: { width?: number; theme?: string } = {},
): Promise<{ doc: InfographicDoc; svg: string }> {
  const doc = await adapter.generateDoc(input);
  const svg = renderToString(doc, renderOpts);
  return { doc, svg };
}
