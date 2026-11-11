import { describe, expect, it } from "vitest";
import { parseDoc, safeParseDoc, toJsonSchema } from "../src/index";

describe("modelo", () => {
  it("valida y aplica defaults", () => {
    const doc = parseDoc({
      template: "feature-list",
      sections: [{ type: "list", items: [{ label: "Rápido" }] }],
    });
    expect(doc.template).toBe("feature-list");
    expect(doc.sections[0]!.type).toBe("list");
    // default de tone
    expect((doc.sections[0] as { items: { tone: string }[] }).items[0]!.tone).toBe("neutral");
  });

  it("rechaza documentos inválidos con safeParse", () => {
    const res = safeParseDoc({ sections: [{ type: "stat", items: [] }] });
    expect(res.success).toBe(false);
  });

  it("exporta un JSON Schema con propiedades", () => {
    const schema = toJsonSchema() as Record<string, unknown>;
    expect(schema).toHaveProperty("properties");
    expect((schema.properties as Record<string, unknown>)).toHaveProperty("sections");
  });
});
