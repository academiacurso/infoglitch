import { describe, expect, it } from "vitest";
import type OpenAI from "openai";
import {
  GeminiAdapter,
  OpenAIChatAdapter,
  OpenRouterAdapter,
  createAdapter,
  generateInfographic,
} from "../src/index";

const FAKE_DSL = `template stack-comparison
theme light-docs
title React vs Vue

section comparison
  - title React
    point Ecosistema enorme
  - title Vue
    point Curva suave
`;

/** Cliente OpenAI mínimo y falso (compatible OpenAI): no hace red. */
function fakeOpenAI(dsl: string): OpenAI {
  return {
    chat: {
      completions: {
        create: async (params: { stream?: boolean }) => {
          if (params.stream) {
            return (async function* () {
              for (const c of dsl.match(/.{1,10}/gs) ?? []) {
                yield { choices: [{ delta: { content: c } }] };
              }
            })();
          }
          return { choices: [{ message: { content: dsl } }] };
        },
      },
    },
  } as unknown as OpenAI;
}

describe("OpenAI-compatible adapters (mock)", () => {
  it("OpenAIChatAdapter.generateDoc parsea el DSL", async () => {
    const adapter = new OpenAIChatAdapter({ client: fakeOpenAI(FAKE_DSL) });
    const doc = await adapter.generateDoc({ prompt: "comparar react y vue" });
    expect(doc.template).toBe("stack-comparison");
    expect(doc.sections.some((s) => s.type === "comparison")).toBe(true);
  });

  it("OpenRouterAdapter funciona con cliente inyectado", async () => {
    const adapter = new OpenRouterAdapter({ client: fakeOpenAI(FAKE_DSL) });
    const doc = await adapter.generateDoc({ prompt: "x" });
    expect(doc.title).toBe("React vs Vue");
  });

  it("GeminiAdapter funciona con cliente inyectado", async () => {
    const adapter = new GeminiAdapter({ client: fakeOpenAI(FAKE_DSL) });
    const { svg } = await generateInfographic(adapter, { prompt: "x" });
    expect(svg.startsWith("<svg")).toBe(true);
  });

  it("streamDsl acumula los fragmentos", async () => {
    const adapter = new OpenAIChatAdapter({ client: fakeOpenAI(FAKE_DSL) });
    let buffer = "";
    for await (const chunk of adapter.streamDsl({ prompt: "x" })) buffer += chunk;
    expect(buffer).toBe(FAKE_DSL);
  });

  it("createAdapter devuelve el adapter del proveedor pedido", async () => {
    const adapter = createAdapter("openrouter", { client: fakeOpenAI(FAKE_DSL) });
    const doc = await adapter.generateDoc({ prompt: "x", template: "metrics-grid" });
    expect(doc.template).toBe("metrics-grid"); // override respetado
  });
});
