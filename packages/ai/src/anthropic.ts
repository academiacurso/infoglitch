import Anthropic from "@anthropic-ai/sdk";
import { BaseTextAdapter } from "./base.js";

export interface AnthropicAdapterOptions {
  /** Clave de API. Por defecto el SDK la toma de ANTHROPIC_API_KEY / perfil. */
  apiKey?: string;
  /** Modelo a usar. Por defecto el Opus actual. */
  model?: string;
  /** Cliente ya construido (para tests o configuración avanzada). */
  client?: Anthropic;
  /** Límite de tokens de salida. */
  maxTokens?: number;
}

const DEFAULT_MODEL = "claude-opus-5-5";
const DEFAULT_MAX_TOKENS = 16000;

/**
 * Adapter basado en Anthropic Claude (proveedor por defecto).
 */
export class AnthropicAdapter extends BaseTextAdapter {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(options: AnthropicAdapterOptions = {}) {
    super();
    this.client =
      options.client ?? new Anthropic(options.apiKey ? { apiKey: options.apiKey } : {});
    this.model = options.model ?? DEFAULT_MODEL;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  protected async completeText(system: string, user: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    return message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");
  }

  protected async *streamText(system: string, user: string): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }
}
