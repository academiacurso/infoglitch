# @infoglitch/vue

Componente **Vue 3** para renderizar infografías de [infoglitch](https://infoglitch.duglasm.com/)
como SVG embebido. Acepta un documento JSON (`doc`) o una cadena DSL (`source`).

```bash
npm i @infoglitch/vue @infoglitch/core vue
```

## Uso

```vue
<script setup>
import { Infographic } from "@infoglitch/vue";

const dsl = `template stack
theme cyber
section title
  text CI/CD en 3 pasos
  icon rocket
section steps
  - label Build
  - label Test
  - label Deploy`;
</script>

<template>
  <Infographic :source="dsl" theme="cyber" :width="1000" />
</template>
```

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `doc` | `InfographicDoc` | Documento JSON (fuente de verdad). |
| `source` | `string` | DSL textual (alternativa a `doc`). |
| `width` | `number` | Ancho del lienzo en px. |
| `theme` | `string` | Id de tema (override del doc). |
| `fontCss` | `string` | CSS `@font-face` a embeber (ver `@infoglitch/fonts`). |

## Streaming (IA)

```vue
<script setup>
import { Infographic, useStreamingInfographic } from "@infoglitch/vue";

const { source, streaming } = useStreamingInfographic(() => fetchDslStream(prompt));
</script>

<template>
  <Infographic :source="source" theme="neon-night" />
  <p v-if="streaming">generando…</p>
</template>
```
