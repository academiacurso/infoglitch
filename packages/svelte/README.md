# @infoglitch/svelte

Componente **Svelte** para renderizar infografías de [infoglitch](https://infoglitch.duglasm.com/)
como SVG embebido. Compatible con Svelte 4 y 5. Acepta un documento JSON (`doc`) o un DSL (`source`).

```bash
npm i @infoglitch/svelte @infoglitch/core svelte
```

El componente se publica como fuente `.svelte`; tu bundler (Vite + `@sveltejs/vite-plugin-svelte`)
lo compila como cualquier otro componente de tu app.

## Uso

```svelte
<script>
  import { Infographic } from "@infoglitch/svelte";

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

<Infographic source={dsl} theme="cyber" width={1000} />
```

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `doc` | `InfographicDoc` | Documento JSON (fuente de verdad). |
| `source` | `string` | DSL textual (alternativa a `doc`). |
| `width` | `number` | Ancho del lienzo en px. |
| `theme` | `string` | Id de tema (override del doc). |
| `fontCss` | `string` | CSS `@font-face` a embeber (ver `@infoglitch/fonts`). |
