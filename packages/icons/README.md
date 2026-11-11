# @infoglitch/icons

Logos de lenguajes y herramientas como fuente de iconos para **infoglitch**.

```bash
npm i @infoglitch/icons @infoglitch/core
```

```ts
import { registerSimpleIcons, registerSimpleIconsAll, registerDevicon } from "@infoglitch/icons";

registerSimpleIcons();            // ~110 logos curados (Simple Icons, CC0), tree-shakeable
await registerSimpleIconsAll();   // set completo (~3470), import dinámico
await registerDevicon();          // ~90 logos a TODO COLOR (Devicon, incl. Java y C#)
```

Las marcas pertenecen a sus dueños (Simple Icons: CC0; Devicon: MIT).

Docs: https://github.com/academiacurso/infoglitch
