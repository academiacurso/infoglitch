# @infoglitch/export

Exporta el SVG de **infoglitch** a **PNG** y **PDF** en el navegador, sin dependencias.

```bash
npm i @infoglitch/export @infoglitch/core
```

```ts
import { renderToString } from "@infoglitch/core";
import { downloadPng, downloadPdf } from "@infoglitch/export";

const svg = renderToString(doc, { width: 960 });
await downloadPng(svg, "infografia.png", { scale: 2 });
await downloadPdf(svg, "infografia.pdf");
```

PNG vía `<canvas>`; PDF armado a mano (FlateDecode con `CompressionStream`). Browser-only;
`buildPdf`/`rgbaToRgb`/`deflate` son utilidades puras (sin DOM) para generar el PDF en Node
a partir de píxeles de un rasterizador.

Docs: https://github.com/academiacurso/infoglitch
