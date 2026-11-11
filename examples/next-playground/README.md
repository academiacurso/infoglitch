# infoglitch · next-playground

Playground Next.js (App Router) con **dos modos sincronizados**:

- **Compositor** (formulario): tema + plantilla, agregar/reordenar secciones, **editar el
  contenido** de cada una (✎ abre campos propios por tipo: texto, ítems, filas, puntos…),
  y disposición **filas** o **2 columnas 50/50**.
- **Editor DSL** (textarea): escribís el DSL y ves el **preview en vivo** (tolerante).

Ambos comparten **una sola fuente de verdad** (el string DSL): editar en el formulario
reescribe el DSL (`stringify`) y editar el DSL actualiza el formulario (`parseDsl`). Podés
**sembrar con IA** (prompt → `@infoglitch/ai` → DSL) y **descargar** PNG/PDF/SVG
(`@infoglitch/export`). Preview con `@infoglitch/react`.

> Este ejemplo es **standalone** (no es parte del workspace pnpm para no arrastrar
> Next a la instalación del monorepo). Usa los paquetes publicados `@infoglitch/*`.

## Correr

```bash
cd examples/next-playground
cp .env.example .env.local   # y poné tu ANTHROPIC_API_KEY
npm install
npm run dev
```

Abrí http://localhost:3000, escribí un pedido (ej. "arquitectura de microservicios
de e-commerce") y dale **Generar**. La key vive sólo en el servidor (`app/api/generate/route.ts`).

## Desarrollo contra el código local del monorepo

Si querés probar cambios sin publicar, podés:

- Agregar `examples/next-playground` a `pnpm-workspace.yaml` y cambiar las versiones
  de `@infoglitch/*` a `workspace:*`, luego `pnpm install` desde la raíz; **o**
- Usar `pnpm link` / `npm link` apuntando a `packages/*`.
