import { describe, expect, it } from "vitest";
import {
  assertModelAllowed,
  isModelAllowed,
  ModelNotAllowedError,
  type ModelWhitelist,
} from "../src/index";

const MAP: ModelWhitelist = {
  anthropic: ["claude-opus-5-5", "claude-haiku-5-5"],
  openai: ["gpt-4o-mini"],
};

describe("assertModelAllowed", () => {
  it("acepta un modelo de la whitelist (mapa por proveedor)", () => {
    expect(assertModelAllowed("claude-haiku-5-5", MAP, { provider: "anthropic" })).toBe(
      "claude-haiku-5-5",
    );
  });

  it("normaliza espacios", () => {
    expect(assertModelAllowed("  gpt-4o-mini  ", MAP, { provider: "openai" })).toBe("gpt-4o-mini");
  });

  it("devuelve undefined si está vacío y allowEmpty (default)", () => {
    expect(assertModelAllowed("", MAP, { provider: "openai" })).toBeUndefined();
    expect(assertModelAllowed(undefined, MAP, { provider: "openai" })).toBeUndefined();
  });

  it("lanza ModelNotAllowedError si no está permitido", () => {
    try {
      assertModelAllowed("gpt-5-ultra", MAP, { provider: "openai" });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ModelNotAllowedError);
      expect((err as ModelNotAllowedError).allowed).toEqual(["gpt-4o-mini"]);
      expect((err as ModelNotAllowedError).provider).toBe("openai");
    }
  });

  it("lanza si allowEmpty=false y el modelo viene vacío", () => {
    expect(() => assertModelAllowed("", MAP, { provider: "openai", allowEmpty: false })).toThrow(
      ModelNotAllowedError,
    );
  });

  it("funciona con whitelist como array plano (sin proveedor)", () => {
    expect(assertModelAllowed("a", ["a", "b"])).toBe("a");
    expect(() => assertModelAllowed("z", ["a", "b"])).toThrow(ModelNotAllowedError);
  });

  it("requiere provider si la whitelist es un mapa", () => {
    expect(() => assertModelAllowed("x", MAP)).toThrow(/provider/);
  });

  it("isModelAllowed devuelve booleano", () => {
    expect(isModelAllowed("gpt-4o-mini", MAP, { provider: "openai" })).toBe(true);
    expect(isModelAllowed("nope", MAP, { provider: "openai" })).toBe(false);
    expect(isModelAllowed("", MAP, { provider: "openai" })).toBe(true);
    expect(isModelAllowed("", MAP, { provider: "openai", allowEmpty: false })).toBe(false);
  });
});
