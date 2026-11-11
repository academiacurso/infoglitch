// Genera SVGs de ejemplo (con fuentes embebidas) para la página de docs (artifact).
import { mkdirSync, writeFileSync } from "node:fs";
import { renderToString } from "@infoglitch/core";
import { registerSimpleIcons, registerDevicon } from "@infoglitch/icons";
import { fontFaceCss } from "@infoglitch/fonts";

registerSimpleIcons({ brandColors: true });
await registerDevicon();
const fontCss = await fontFaceCss();

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const EXAMPLES = {
  versus: `template versus
theme blueprint
title WordPress vs Desarrollo a medida
section title
  text ¿Cuál conviene para tu web?
  icon wordpress
section versus
  left WordPress
  lefticon wordpress
  right A medida
  righticon code
  - label Tiempo
    l Rápido: días o semanas
    r Lento: meses
    ltone pro
    rtone con
  - label Costo
    l Accesible
    r Elevado
    ltone pro
    rtone con
  - label Flexibilidad
    l Miles de plugins
    r Todo a medida
    ltone pro
    rtone con
footer Para el 90% de los proyectos, WordPress gana
footericon rocket`,

  flow: `template flowchart
theme neon-night
title Condicionales en PHP
section flow
  heading Evaluación de la nota
  - start Inicio
  - process $nota = 75
  - decision ¿$nota >= 60?
    branch echo "Reprobado"
  - process echo "Aprobado"
  - end Fin`,

  roadmap: `template roadmap
theme neon-night
title Roadmap para aprender Python
section roadmap
  - label Fundamentos
    icon python
    desc Base sólida
    point Sintaxis básica
    point Variables y tipos
  - label Estructuras de control
    icon branch
    desc Decisiones y bucles
    point if / elif / else
    point for, while
  - label Estructuras de datos
    icon database
    point Listas y tuplas
    point Diccionarios
  - label Proyectos reales
    icon rocket
    point APIs
    point Web scraping`,

  charts: `template stack
theme neon-night
title Métricas del servicio
section columns
  ratio 1 1
  col
    section chart
      chart bar
      heading Lenguajes más usados (%)
      unit %
      - label JavaScript
        value 62
      - label Python
        value 51
      - label TypeScript
        value 39
      - label Rust
        value 13
  col
    section chart
      chart donut
      heading Uso del tiempo
      - label Código
        value 50
      - label Reuniones
        value 20
      - label Testing
        value 18
      - label Docs
        value 12
section chart
  chart line
  heading Requests por segundo (por hora)
  - label 00
    value 1200
  - label 06
    value 900
  - label 12
    value 5200
  - label 18
    value 4300
  - label 23
    value 2100`,

  icongrid: `template icon-grid
theme cyber
title Stack moderno
section iconGrid
  heading Tecnologías
  columns 4
  - icon python
    label Python
    desc Backend e IA
  - icon react
    label React
    desc Interfaz
  - icon docker
    label Docker
    desc Contenedores
  - icon postgresql
    label PostgreSQL
    desc Base de datos
  - icon rust
    label Rust
    desc Performance
  - icon kubernetes
    label Kubernetes
    desc Orquestación
  - icon redis
    label Redis
    desc Caché
  - icon go
    label Go
    desc Microservicios`,

  code: `template stack
theme neon-night
title Guía express de JS
section columns
  ratio 1 1
  col
    section codeSnippet
      heading if / else
      language javascript
      code const nota = 75;
      code if (nota >= 60) {
      code   console.log("Aprobado");
      code } else {
      code   console.log("Reprobado");
      code }
  col
    section list
      heading Buenas prácticas
      - label if/else para decisiones simples
        tone pro
      - label switch para muchos casos
        tone pro
      - label Evitá anidar demasiado
        tone con
section callout
  text El DSL soporta columnas 50/50 para mostrar código junto a su explicación.
  tone success`,
};

for (const [name, dsl] of Object.entries(EXAMPLES)) {
  const svg = renderToString(dsl, { width: 900, fontCss });
  writeFileSync(`${OUT}/ex-${name}.svg`, svg, "utf8");
  console.log(`✓ ex-${name}.svg (${svg.length} bytes)`);
}
