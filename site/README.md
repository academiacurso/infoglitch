# Sitio de infoglitch (deployable)

Página estática con documentación, galería y **playground en vivo**. Todo corre en el
navegador: el playground carga `@infoglitch/core` **self-hosted** (`infoglitch-core.js`),
sin ningún CDN.

## Archivos

- `index.html` — la página (paleta verde/dorado de duglasm.com, fuente Poppins).
- `infoglitch-core.js` — bundle self-contained de `@infoglitch/core` (incluye zod). Lo usa el playground.
- `ex-*.svg` — ejemplos pre-renderizados de la galería (con fuentes embebidas).

## Deploy

Es un sitio estático: subí la carpeta `site/` a cualquier hosting.

- **Netlify / Vercel**: arrastrá la carpeta `site/`, o apuntá el "publish directory" a `site`.
- **GitHub Pages**: serví desde `/site` (Settings → Pages → Branch + /site).
- **Tu dominio (duglasm.com)**: copiá los archivos de `site/` a la ruta que quieras.

> Importante: **servilo por HTTP(S)**, no abras `index.html` con `file://` — los módulos
> ES (`import`) requieren un servidor. Para probar local:
>
> ```bash
> npx serve site        # o: python -m http.server -d site 8080
> ```

## Regenerar los assets

```bash
pnpm install && pnpm build
node site/build.mjs     # regenera infoglitch-core.js y los ex-*.svg
```
