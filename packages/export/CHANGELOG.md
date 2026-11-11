# @infoglitch/export

## 0.2.0

### Minor Changes

- e566bf2: v0.2 — accesibilidad, temas custom y export server-side; nuevos paquetes CLI/Vue/Svelte.

  **@infoglitch/core**

  - Accesibilidad: el SVG ahora incluye `<title>`, `<desc>` y `aria-labelledby` derivados
    del documento (título + encabezados de secciones, incluidas las anidadas en `columns`),
    para que los lectores de pantalla anuncien contenido útil.
  - API de temas: `defineTheme({ id, extends, ...overrides })` y `registerTheme(...)` para
    crear y registrar temas de marca propios sin tocar el core.
  - Robustez: `renderTimeline` ya no crashea cuando un ítem no trae `date` (DSL tolerante);
    `escapeXml` coacciona entradas no-string a `""`.

  **@infoglitch/export**

  - Nuevo entry server-side `@infoglitch/export/node`: `renderPng`, `renderPngInfo` y
    `renderPdf` rasterizan con `@resvg/resvg-js` (dependencia opcional) respetando las
    fuentes embebidas vía `fontBuffers`.

  **Nuevos paquetes** (publican en 0.1.0): `@infoglitch/cli` (render DSL/JSON → SVG/PNG/PDF
  desde la terminal), `@infoglitch/vue` y `@infoglitch/svelte` (wrappers de componente).
