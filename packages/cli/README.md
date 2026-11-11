# @infoglitch/cli

Renderiza infografías de programación **desde la terminal** — sin escribir código.
Toma un DSL (o JSON) de infoglitch y produce **SVG, PNG o PDF**.

```bash
npx @infoglitch/cli render deck.dsl -o deck.svg
```

## Instalación

```bash
npm i -g @infoglitch/cli      # o: pnpm add -g / yarn global add
# PNG/PDF requieren el rasterizador nativo (opcional):
npm i -g @resvg/resvg-js
```

O sin instalar nada, con `npx @infoglitch/cli …`.

## Uso

```bash
infoglitch render <archivo|-> [opciones]
infoglitch themes | templates | sections
infoglitch --help | --version
```

### Opciones de `render`

| Opción | Descripción |
|---|---|
| `-o, --out <archivo>` | Salida. La extensión decide el formato (`.svg`/`.png`/`.pdf`). Sin `--out`, va a stdout. |
| `-f, --format <fmt>` | `svg` \| `png` \| `pdf` (default: inferido de `--out`, o `svg`). |
| `-t, --theme <id>` | Tema (`infoglitch themes`). Sobrescribe el del documento. |
| `-w, --width <px>` | Ancho del lienzo (default 960). |
| `--icons <set>` | `simple` \| `all` \| `devicon` \| `none` (default `simple`). |
| `--background <c>` | Color de fondo para PNG/PDF (ej. `"#ffffff"`). |
| `--no-fonts` | No embeber Inter/JetBrains Mono. |

### Ejemplos

```bash
# SVG a archivo
infoglitch render deck.dsl -o deck.svg

# PNG con tema y ancho
infoglitch render deck.dsl -o deck.png --theme cyber --width 1200

# Pipe: DSL por stdin, PDF por stdout
cat deck.dsl | infoglitch render - -f pdf > deck.pdf

# Logos de color de Devicon
infoglitch render stack.dsl -o stack.png --icons devicon
```

> PNG/PDF usan [`@resvg/resvg-js`](https://github.com/yisibl/resvg-js) (binario nativo,
> dependencia **opcional**). Las fuentes se embeben vía `fontBuffers` para que el raster
> se vea idéntico en cualquier máquina.

## DSL en 30 segundos

```
template stack
theme cyber
section title
  text CI/CD en 3 pasos
  icon rocket
section steps
  - label Build
  - label Test
  - label Deploy
```

Mirá todos los tipos de sección con `infoglitch sections` y los temas con `infoglitch themes`.
Más en el [sitio de infoglitch](https://infoglitch.duglasm.com/).
