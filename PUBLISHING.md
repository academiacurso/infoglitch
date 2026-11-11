# Publicar infoglitch

Paquetes publicables (scope `@infoglitch`): `core`, `ai`, `react`, `export`, `icons`, `fonts`.
Los `examples/*` son privados (no se publican).

## Prerequisitos (una vez)

1. Crear el scope/org **@infoglitch** en npmjs.com (gratis para paquetes públicos).
2. Login: `npm login` (o configurar `NPM_TOKEN` en los Secrets del repo para CI).
3. Verificar que los nombres estén libres: `npm view @infoglitch/core` (debe dar 404).

## Opción A — Publicar desde tu máquina

```bash
pnpm install
pnpm build            # compila los 6 paquetes (ESM + CJS + .d.ts)
pnpm test && pnpm lint

# Dry-run (no publica): revisá qué se subiría
pnpm -r publish --dry-run --no-git-checks

# Publicar de verdad (con provenance). pnpm resuelve workspace:* a la versión real.
pnpm -r publish --access public --provenance
```

> **Primera publicación (0.1.0):** las versiones ya están en `0.1.0`. Si querés publicar
> esa versión inicial tal cual, **borrá los changesets acumulados** (`rm .changeset/*.md`
> salvo `config.json`) para que la primera release sea `0.1.0`. Si preferís arrancar más
> arriba, corré `pnpm changeset version` antes de publicar.

## Opción B — Publicar desde CI (recomendado para releases siguientes)

El workflow `.github/workflows/release.yml` usa **Changesets** + **npm provenance** (OIDC):

1. Por cada cambio, agregá un changeset: `pnpm changeset` (elegí paquetes y tipo de bump).
2. Push a `master`. La acción de Changesets abre un PR **"Version Packages"** (bumpea
   versiones + genera CHANGELOGs + consume los changesets).
3. Al mergear ese PR, el workflow corre `pnpm release` (build + `changeset publish`) y
   **publica a npm con provenance**.

Necesario en el repo: Secret `NPM_TOKEN` con permiso de publicar en el scope, y en
npm el scope configurado para aceptar provenance (automático con OIDC de GitHub Actions).

## Notas

- `provenance: true` está en el `publishConfig` de cada paquete y en `.npmrc`.
- `@infoglitch/ai` depende de `@anthropic-ai/sdk` y `openai` (se instalan con el paquete).
- `@infoglitch/react` tiene `react`/`react-dom` como **peerDependencies**.
- Si un nombre del scope estuviera ocupado, podés renombrar a paquetes sin scope
  (`infoglitch`, `infoglitch-ai`, …) actualizando `name` y las dependencias internas.
