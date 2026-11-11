import { parseDsl, type InfographicDoc } from "@infoglitch/core";
import type { GenerateInput, TextModelAdapter } from "./adapter.js";
import { buildSystemPrompt, buildUserPrompt, cleanDsl } from "./prompt.js";

/**
 * Base común para todos los adapters.
 *
 * Centraliza la parte compartida (construcción de prompts, limpieza del DSL,
 * parseo a documento y overrides de template/theme). Cada proveedor sólo
 * implementa cómo obtener texto del modelo: `completeText` y `streamText`.
 */
export abstract class BaseTextAdapter implements TextModelAdapter {
  /** Completa el prompt y devuelve el texto completo del modelo. */
  protected abstract completeText(system: string, user: string): Promise<string>;

  /** Transmite el texto del modelo en fragmentos. */
  protected abstract streamText(system: string, user: string): AsyncIterable<string>;

  /** Devuelve el DSL crudo generado (ya limpio de cercos de markdown). */
  async generateDsl(input: GenerateInput): Promise<string> {
    const raw = await this.completeText(buildSystemPrompt(), buildUserPrompt(input));
    return cleanDsl(raw);
  }

  async generateDoc(input: GenerateInput): Promise<InfographicDoc> {
    const dsl = await this.generateDsl(input);
    const doc = parseDsl(dsl);
    if (input.template) doc.template = input.template;
    if (input.theme && !doc.theme) doc.theme = input.theme;
    return doc;
  }

  async *streamDsl(input: GenerateInput): AsyncIterable<string> {
    yield* this.streamText(buildSystemPrompt(), buildUserPrompt(input));
  }
}
