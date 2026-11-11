import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { AnthropicAdapter, generateInfographic } from "../src/index";

const FAKE_DSL = `template pipeline-steps
theme dark-terminal
title CI/CD

section title
  text De commit a producción
  icon rocket

section steps
  - label Build
    icon package
  - label Deploy
    icon rocket
`;

/** Cliente Anthropic mínimo y falso: no hace red. */
function fakeClient(dsl: string): Anthropic {
  return {
    messages: {
      create: async () => ({
        content: [{ type: "text", text: dsl }],
      }),
      stream: () => {
        async function* gen() {
          for (const chunk of dsl.match(/.{1,12}/gs) ?? []) {
            yield {
              type: "content_block_delta",
              delta: { type: "text_delta", text: chunk },
            };
          }
        }
        return gen();
      },
    },
  } as unknown as Anthropic;
}

describe("AnthropicAdapter (mock)", () => {
  it("generateDoc parsea el DSL del modelo a un documento", async () => {
    const adapter = new AnthropicAdapter({ client: fakeClient(FAKE_DSL) });
    const doc = await adapter.generateDoc({ prompt: "pipeline CI/CD" });
    expect(doc.template).toBe("pipeline-steps");
    expect(doc.sections.some((s) => s.type === "steps")).toBe(true);
  });

  it("respeta el template forzado por input", async () => {
    const adapter = new AnthropicAdapter({ client: fakeClient(FAKE_DSL) });
    const doc = await adapter.generateDoc({ prompt: "x", template: "metrics-grid" });
    expect(doc.template).toBe("metrics-grid");
  });

  it("limpia cercos de markdown alrededor del DSL", async () => {
    const fenced = "```\n" + FAKE_DSL + "```";
    const adapter = new AnthropicAdapter({ client: fakeClient(fenced) });
    const doc = await adapter.generateDoc({ prompt: "x" });
    expect(doc.title).toBe("CI/CD");
  });

  it("streamDsl emite fragmentos que acumulados forman el DSL", async () => {
    const adapter = new AnthropicAdapter({ client: fakeClient(FAKE_DSL) });
    let buffer = "";
    for await (const chunk of adapter.streamDsl({ prompt: "x" })) buffer += chunk;
    expect(buffer).toBe(FAKE_DSL);
  });

  it("generateInfographic devuelve doc + svg", async () => {
    const adapter = new AnthropicAdapter({ client: fakeClient(FAKE_DSL) });
    const { doc, svg } = await generateInfographic(adapter, { prompt: "x" });
    expect(doc.sections.length).toBeGreaterThan(0);
    expect(svg.startsWith("<svg")).toBe(true);
  });
});
