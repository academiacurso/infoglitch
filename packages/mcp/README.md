# @infoglitch/mcp

Servidor **MCP** ([Model Context Protocol](https://modelcontextprotocol.io)) de
[infoglitch](https://infoglitch.duglasm.com/). Expone la generación y el render de
infografías de programación como **herramientas MCP**, para usarlas desde Claude Desktop,
IDEs o cualquier agente compatible: *"pedíselo a Claude y te arma el SVG"*.

## Herramientas

| Tool | Qué hace |
|---|---|
| `render_infographic` | Renderiza un DSL/JSON de infoglitch a **SVG** o **PNG**. |
| `save_infographic` | Renderiza y **escribe el archivo a disco** (`.svg`/`.png`/`.pdf`, según la extensión). |
| `generate_infographic` | **Prompt → infografía** con IA (requiere API key en el entorno). |
| `list_themes` / `list_templates` / `list_sections` | Discovery de ids disponibles. |
| `dsl_reference` | Sintaxis del DSL con un ejemplo (para que el modelo sepa escribirlo). |

## Uso

Corre por **stdio**. Ejecutable: `infoglitch-mcp`.

### Claude Desktop

En `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "infoglitch": {
      "command": "npx",
      "args": ["-y", "@infoglitch/mcp"],
      "env": { "ANTHROPIC_API_KEY": "sk-ant-..." }
    }
  }
}
```

`ANTHROPIC_API_KEY` (u otra, según el proveedor) sólo hace falta para `generate_infographic`;
`render_infographic` y el resto funcionan sin key. PNG requiere `@resvg/resvg-js` (dependencia
opcional, binario nativo).

### Variables de entorno

- `INFOGLITCH_PROVIDER` — `anthropic` (default) · `openai` · `openrouter` · `gemini`.
- La API key se toma del entorno según el proveedor (ej. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`).

## Programático

```ts
import { createServer } from "@infoglitch/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

await createServer().connect(new StdioServerTransport());
```
