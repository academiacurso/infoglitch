import OpenAI from "openai";
import { BaseTextAdapter } from "./base.js";

export interface OpenAICompatibleOptions {
  /** Clave de API. Si se omite, se toma del entorno según el proveedor. */
  apiKey?: string;
  /** Modelo a usar. */
  model?: string;
  /** URL base de la API (para proveedores compatibles con OpenAI). */
  baseURL?: string;
  /** Cliente ya construido (para tests o configuración avanzada). */
  client?: OpenAI;
  /** Límite de tokens de salida (opcional; se omite si no se indica). */
  maxTokens?: number;
  /** Headers extra (ej. OpenRouter usa HTTP-Referer / X-Title para ranking). */
  defaultHeaders?: Record<string, string>;
}

interface AdapterDefaults {
  model: string;
  baseURL?: string;
  apiKey?: string;
}

/**
 * Adapter para cualquier proveedor compatible con la API de OpenAI
 * (OpenAI/ChatGPT, OpenRouter, y Gemini vía su endpoint compatible).
 *
 * Server-side: la API key nunca debe exponerse en el navegador.
 */
export class OpenAIAdapter extends BaseTextAdapter {
  protected client: OpenAI;
  protected model: string;
  protected maxTokens: number | undefined;

  constructor(options: OpenAICompatibleOptions = {}, defaults: AdapterDefaults = { model: "gpt-4o-mini" }) {
    super();
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey ?? defaults.apiKey,
        baseURL: options.baseURL ?? defaults.baseURL,
        defaultHeaders: options.defaultHeaders,
      });
    this.model = options.model ?? defaults.model;
    this.maxTokens = options.maxTokens;
  }

  private messages(system: string, user: string): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return [
      { role: "system", content: system },
      { role: "user", content: user },
    ];
  }

  protected async completeText(system: string, user: string): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: this.messages(system, user),
      ...(this.maxTokens ? { max_tokens: this.maxTokens } : {}),
    });
    return res.choices[0]?.message?.content ?? "";
  }

  protected async *streamText(system: string, user: string): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: this.messages(system, user),
      stream: true,
      ...(this.maxTokens ? { max_tokens: this.maxTokens } : {}),
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}

/* ------------------------------ presets --------------------------------- */

export interface OpenRouterAdapterOptions extends OpenAICompatibleOptions {
  /** URL del sitio (header HTTP-Referer, usado por OpenRouter para ranking). */
  referer?: string;
  /** Nombre de la app (header X-Title). */
  title?: string;
}

/** Proveedor ChatGPT / OpenAI. Lee OPENAI_API_KEY del entorno por defecto. */
export class OpenAIChatAdapter extends OpenAIAdapter {
  constructor(options: OpenAICompatibleOptions = {}) {
    super(options, { model: "gpt-4o-mini" });
  }
}

/** Proveedor OpenRouter (compatible con OpenAI). Lee OPENROUTER_API_KEY. */
export class OpenRouterAdapter extends OpenAIAdapter {
  constructor(options: OpenRouterAdapterOptions = {}) {
    const headers: Record<string, string> = { ...options.defaultHeaders };
    if (options.referer) headers["HTTP-Referer"] = options.referer;
    if (options.title) headers["X-Title"] = options.title;
    super(
      { ...options, defaultHeaders: Object.keys(headers).length ? headers : undefined },
      {
        model: "openai/gpt-4o-mini",
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
      },
    );
  }
}

/** Proveedor Google Gemini vía su endpoint compatible con OpenAI. */
export class GeminiAdapter extends OpenAIAdapter {
  constructor(options: OpenAICompatibleOptions = {}) {
    super(options, {
      model: "gemini-2.0-flash",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY,
    });
  }
}
