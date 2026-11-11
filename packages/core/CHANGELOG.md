# @infoglitch/core

## 0.2.0

### Minor Changes

- da9c847: Plantillas de **layout multi-columna** (no solo apilado vertical): `two-column`,
  `grid` (3 col) y `hero-split`. Nuevo helper `makeColumnsTemplate` + `WIDE_SECTION_TYPES`:
  las secciones angostas fluyen en N columnas balanceando por altura, y las anchas
  (`steps`, `flow`, `title`, …) se dibujan a ancho completo en su lugar, sin desbordar.
  17 plantillas en total.
- b998f49: 5 temas nuevos (11 en total): `forest` (verde/dorado de marca), `sunset` (cálido con
  glow), `paper` (claro minimalista para docs/print), `frost` (frío nórdico) y `solar`
  (teal profundo tipo solarized). Disponibles por id en `renderToString`, la CLI y los wrappers.
- 0a3d9b4: 4 tipos de sección nuevos (19 en total): `quote` (cita/testimonio), `kpi` (número
  grande con delta/trend), `table` (tabla simple con `cols`/`row`) y `progress` (barras
  de porcentaje). Además, estilo inline por DSL: `accent <color>` sobrescribe el acento
  de cualquier sección (heading, bordes, kpi, barras), sin registrar un tema.
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
