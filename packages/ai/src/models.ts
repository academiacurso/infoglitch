/**
 * Validación reutilizable de modelos permitidos (whitelist) para usar en el
 * backend. La librería no impone una política de modelos; este helper sólo
 * facilita aplicarla en cada deployment.
 */

export type ModelWhitelist = string[] | Record<string, string[]>;

export interface AssertModelOptions {
  /** Proveedor, requerido si `whitelist` es un mapa por proveedor. */
  provider?: string;
  /** Si un modelo vacío/indefinido se considera válido (usar default). Default: true. */
  allowEmpty?: boolean;
}

/** Error lanzado cuando el modelo pedido no está permitido. */
export class ModelNotAllowedError extends Error {
  readonly model: string;
  readonly allowed: string[];
  readonly provider: string | undefined;

  constructor(model: string, allowed: string[], provider?: string) {
    super(
      `Modelo no permitido${provider ? ` para '${provider}'` : ""}: ${model}` +
        (allowed.length ? ` (permitidos: ${allowed.join(", ")})` : ""),
    );
    this.name = "ModelNotAllowedError";
    this.model = model;
    this.allowed = allowed;
    this.provider = provider;
  }
}

/** Resuelve la lista de modelos permitidos a partir de la whitelist. */
export function resolveAllowed(whitelist: ModelWhitelist, provider?: string): string[] {
  if (Array.isArray(whitelist)) return whitelist;
  if (!provider) {
    throw new Error("assertModelAllowed: 'provider' es requerido cuando la whitelist es un mapa por proveedor");
  }
  return whitelist[provider] ?? [];
}

/** Variante booleana: ¿el modelo está permitido? (vacío depende de `allowEmpty`). */
export function isModelAllowed(
  model: string | undefined,
  whitelist: ModelWhitelist,
  options: AssertModelOptions = {},
): boolean {
  const allowEmpty = options.allowEmpty ?? true;
  const normalized = model?.trim();
  if (!normalized) return allowEmpty;
  return resolveAllowed(whitelist, options.provider).includes(normalized);
}

/**
 * Valida un modelo contra una whitelist y devuelve el modelo normalizado
 * (o `undefined` si viene vacío y `allowEmpty` es true, para usar el default
 * del proveedor). Lanza `ModelNotAllowedError` si no está permitido.
 *
 * @example
 *   const WHITELIST = { anthropic: ["claude-opus-5-5"], openai: ["gpt-4o-mini"] };
 *   const model = assertModelAllowed(body.model, WHITELIST, { provider });
 *   const adapter = createAdapter(provider, { model });
 */
export function assertModelAllowed(
  model: string | undefined,
  whitelist: ModelWhitelist,
  options: AssertModelOptions = {},
): string | undefined {
  const allowEmpty = options.allowEmpty ?? true;
  const normalized = model?.trim();
  if (!normalized) {
    if (allowEmpty) return undefined;
    throw new ModelNotAllowedError("", resolveAllowed(whitelist, options.provider), options.provider);
  }
  const allowed = resolveAllowed(whitelist, options.provider);
  if (!allowed.includes(normalized)) {
    throw new ModelNotAllowedError(normalized, allowed, options.provider);
  }
  return normalized;
}
