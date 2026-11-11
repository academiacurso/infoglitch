import { describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";

describe("@infoglitch/mcp", () => {
  it("construye el servidor MCP con las herramientas registradas", () => {
    const server = createServer();
    expect(server).toBeDefined();
    // McpServer expone el server interno; construir + registrar no debe lanzar.
    expect(typeof server.connect).toBe("function");
  });
});
