# @infoglitch/ai

Capa de IA (server-side) de **infoglitch**: convierte un prompt en una infografía usando el
DSL del core. Multi-proveedor sobre una misma interfaz `TextModelAdapter`.

```bash
npm i @infoglitch/ai @infoglitch/core
```

```ts
import { createAdapter, generateInfographic } from "@infoglitch/ai";
const adapter = createAdapter("anthropic"); // | "openai" | "openrouter" | "gemini"
const { doc, svg } = await generateInfographic(adapter, { prompt: "Pipeline de CI/CD" });
```

Proveedores: Anthropic (`claude-opus-5-5`), OpenAI/ChatGPT, OpenRouter, Google Gemini.
BYO API key (variables de entorno). Incluye `assertModelAllowed` para whitelists de modelos.

Docs: https://github.com/academiacurso/infoglitch
