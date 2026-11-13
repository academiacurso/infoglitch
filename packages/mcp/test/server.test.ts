import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";

const DECK = `title Pipeline
section steps
  heading CI
  - label Build
  - label Deploy`;

describe("@infoglitch/mcp", () => {
  it("construye el servidor MCP con las herramientas registradas", () => {
    const server = createServer();
    expect(server).toBeDefined();
    // McpServer expone el server interno; construir + registrar no debe lanzar.
    expect(typeof server.connect).toBe("function");
  });

  describe("vía cliente MCP in-memory", () => {
    const client = new Client({ name: "test", version: "0.0.0" });
    let tmp: string;

    beforeAll(async () => {
      const [clientT, serverT] = InMemoryTransport.createLinkedPair();
      await Promise.all([createServer().connect(serverT), client.connect(clientT)]);
      tmp = await mkdtemp(join(tmpdir(), "infoglitch-mcp-"));
    });
    afterAll(async () => {
      await client.close();
      await rm(tmp, { recursive: true, force: true });
    });

    it("lista las herramientas, incluyendo save_infographic", async () => {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);
      expect(names).toContain("render_infographic");
      expect(names).toContain("save_infographic");
      expect(names).toContain("dsl_reference");
    });

    it("save_infographic escribe un SVG válido a disco", async () => {
      const out = join(tmp, "nested", "deck.svg");
      const res = await client.callTool({
        name: "save_infographic",
        arguments: { source: DECK, path: out },
      });
      expect(res.isError).toBeFalsy();
      const svg = await readFile(out, "utf8");
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("</svg>");
    });
  });
});
