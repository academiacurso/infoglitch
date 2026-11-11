# @infoglitch/react

Componente React para renderizar infografías de **infoglitch**.

```bash
npm i @infoglitch/react @infoglitch/core react react-dom
```

```tsx
import { Infographic } from "@infoglitch/react";

<Infographic doc={doc} width={960} />;         // desde JSON
<Infographic source={dslString} />;            // desde DSL (streaming)
```

También exporta `useStreamingInfographic` para consumir un stream de DSL y re-renderizar en vivo.

Docs: https://github.com/academiacurso/infoglitch
