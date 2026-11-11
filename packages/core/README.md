# @infoglitch/core

Núcleo de **infoglitch**: modelo de documento (JSON validado con zod), DSL textual
tolerante, renderer **SVG** agnóstico de framework, plantillas, temas (neón/gradientes/glow),
resaltado de código, iconos y layout en columnas. **JSON → SVG sin IA.**

```bash
npm i @infoglitch/core
```

```ts
import { renderToString } from "@infoglitch/core";
const svg = renderToString({
  template: "stack",
  theme: "neon-night",
  sections: [{ type: "list", items: [{ label: "Rápido", tone: "pro" }] }],
});
```

Tipos de sección: `title`, `steps`, `comparison`, `stat`, `codeSnippet`, `architecture`,
`timeline`, `list`, `callout`, `versus`, `flow`, `roadmap`, `iconGrid`, `chart`, `columns`.

Docs y ejemplos: https://github.com/academiacurso/infoglitch
