import { assertModelAllowed, createAdapter, ModelNotAllowedError, type ProviderName } from "@infoglitch/ai";

// IMPORTANTE: esta ruta corre en el servidor (Node). Las API keys viven sólo
// acá, nunca llegan al navegador.
export const runtime = "nodejs";

// Proveedores permitidos desde el cliente (lista blanca).
const ALLOWED: ProviderName[] = ["anthropic", "openai", "openrouter", "gemini"];

// Modelos permitidos por proveedor (lista blanca del servidor). Evita que, en un
// deploy público con tus claves, alguien pida un modelo caro arbitrario.
const ALLOWED_MODELS: Record<ProviderName, string[]> = {
  anthropic: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
  openai: ["gpt-4o-mini", "gpt-4o"],
  openrouter: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "google/gemini-2.0-flash-001"],
  gemini: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-pro"],
};

/**
 * Modelos permitidos para un proveedor: la lista base más, opcionalmente, los
 * agregados por entorno (INFOGLITCH_MODEL y INFOGLITCH_ALLOWED_MODELS, lista
 * separada por comas). Así el operador puede ampliar sin tocar el código.
 */
function allowedModels(provider: ProviderName): string[] {
  const extra = (process.env.INFOGLITCH_ALLOWED_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const envDefault = process.env.INFOGLITCH_MODEL?.trim();
  return [...ALLOWED_MODELS[provider], ...extra, ...(envDefault ? [envDefault] : [])];
}

export async function POST(req: Request): Promise<Response> {
  const { prompt, template, theme, provider: bodyProvider, model } = (await req.json()) as {
    prompt?: string;
    template?: string;
    theme?: string;
    provider?: string;
    model?: string;
  };

  if (!prompt) {
    return new Response(JSON.stringify({ error: "Falta 'prompt'" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // La persona puede elegir proveedor y modelo; si no, se usan los del entorno.
  const provider = (
    bodyProvider && ALLOWED.includes(bodyProvider as ProviderName)
      ? bodyProvider
      : (process.env.INFOGLITCH_PROVIDER ?? "anthropic")
  ) as ProviderName;

  // Restricción server-side con el helper reutilizable de @infoglitch/ai.
  // El modelo elegido por la persona tiene prioridad sobre el del entorno;
  // vacío = usar el default del proveedor.
  let chosenModel: string | undefined;
  try {
    chosenModel = assertModelAllowed(
      model?.trim() || process.env.INFOGLITCH_MODEL,
      allowedModels(provider),
      { provider },
    );
  } catch (err) {
    if (err instanceof ModelNotAllowedError) {
      return new Response(JSON.stringify({ error: err.message, allowed: err.allowed }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    throw err;
  }

  let adapter;
  try {
    adapter = createAdapter(provider, { model: chosenModel });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `No se pudo inicializar '${provider}': ${(err as Error).message}` }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  // Streaming del DSL token a token para preview progresivo.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of adapter.streamDsl({ prompt, template, theme })) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n# error: ${(err as Error).message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
