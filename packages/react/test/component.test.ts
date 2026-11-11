import { describe, expect, it } from "vitest";
import { Infographic, useStreamingInfographic } from "../src/index";

describe("@infoglitch/react", () => {
  it("exporta el componente Infographic", () => {
    expect(typeof Infographic).toBe("function");
  });

  it("exporta el hook useStreamingInfographic", () => {
    expect(typeof useStreamingInfographic).toBe("function");
  });
});
