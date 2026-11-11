# @infoglitch/fonts

Fuentes embebibles (Inter + JetBrains Mono, subset latino, **OFL**) para que los PNG/PDF de
**infoglitch** se vean idénticos en cualquier máquina.

```bash
npm i @infoglitch/fonts @infoglitch/core
```

```ts
import { fontFaceCss, fontBuffers, loadFonts } from "@infoglitch/fonts";

// Navegador
await loadFonts();
const svg = renderToString(doc, { fontCss: await fontFaceCss() });

// Node (resvg no lee @font-face embebido: pasale los buffers)
new Resvg(renderToString(doc), {
  font: { loadSystemFonts: false, fontBuffers: (await fontBuffers()).map(Buffer.from), defaultFontFamily: "Inter" },
});
```

Fuentes bajo SIL Open Font License 1.1 (ver `fonts/OFL.txt`).

Docs: https://github.com/academiacurso/infoglitch
