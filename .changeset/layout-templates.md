---
"@infoglitch/core": minor
---

Plantillas de **layout multi-columna** (no solo apilado vertical): `two-column`,
`grid` (3 col) y `hero-split`. Nuevo helper `makeColumnsTemplate` + `WIDE_SECTION_TYPES`:
las secciones angostas fluyen en N columnas balanceando por altura, y las anchas
(`steps`, `flow`, `title`, …) se dibujan a ancho completo en su lugar, sin desbordar.
17 plantillas en total.
