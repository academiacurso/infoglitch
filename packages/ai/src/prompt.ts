import { iconNames, templateCatalog, themes } from "@infoglitch/core";
import type { GenerateInput } from "./adapter.js";

/**
 * Construye el system prompt que enseña al modelo a emitir el DSL de infoglitch.
 * Se arma a partir de los metadatos reales del core (plantillas, temas, iconos),
 * de modo que no haya que mantener listas duplicadas.
 */
export function buildSystemPrompt(): string {
  const templates = templateCatalog()
    .map((t) => `- ${t.id}: ${t.description ?? ""}`)
    .join("\n");
  const themeIds = Object.keys(themes).join(", ");
  const icons = iconNames().join(", ");

  return `Sos un generador de infografías técnicas. Tu única salida es un documento en el DSL de "infoglitch".
NO uses markdown, NO uses bloques \`\`\`, NO expliques nada. Devolvé SOLO el DSL.

FORMATO DEL DSL (basado en indentación de 2 espacios):
  template <id>
  theme <id>
  title <título general>
  section <tipo>
    <campo> <valor>
    - <campo> <valor>        # ítem de lista de la sección
      <campo> <valor>        # campo del ítem (más indentado)

TIPOS DE SECCIÓN y sus campos:
  title        -> text, subtitle, icon
  steps        -> heading; ítems con: label, desc, icon
  comparison   -> heading; ítems (columnas) con: title, icon, y varias líneas "point <texto>"
  stat         -> heading; ítems con: value, label, unit, icon
  codeSnippet  -> heading, language, varias líneas "code <línea>", "note <anotación>"
  architecture -> heading; ítems "- node <id> <etiqueta>" y "- edge <idOrigen> <idDestino> <etiqueta?>"
  timeline     -> heading; ítems con: date, label, desc
  list         -> heading; ítems con: label, desc, icon, tone (pro|con|neutral)
  callout      -> text, tone (info|warn|success)
  versus       -> heading; "left <título>", "right <título>", lefticon, righticon; filas "- label <tema>" con "l <texto izq>", "r <texto der>", "ltone"/"rtone" (pro|con|neutral)
  flow         -> heading; ítems "- <kind> <texto>" con kind = start|process|decision|end; en decision opcional "branch <texto de la rama No>"
  roadmap      -> heading; ítems "- label <paso>" con desc, icon y varias líneas "point <qué aprenderás>" (ruta serpenteante numerada)
  iconGrid     -> heading; "columns <n>" opcional; ítems "- icon <icono>" con label y desc (grilla de concepto con iconos)
  chart        -> "chart bar|pie|donut|line"; heading y "unit" opcionales; ítems "- label <x>" con "value <número>" (gráfico de datos)
  columns      -> layout de 2+ columnas lado a lado. "ratio <n> <n>" opcional (ej. "ratio 1 1" = 50/50).
                  Dentro repetís "col" y bajo cada "col" ponés "section <tipo>" anidadas, MÁS indentadas:
                    section columns
                      ratio 1 1
                      col
                        section flow
                          - start Inicio
                          - decision ¿ok?
                      col
                        section codeSnippet
                          code console.log(1)
                  (Usalo cuando dos cosas se entienden mejor lado a lado, ej. diagrama + código.)

PLANTILLAS disponibles (campo template):
${templates}

TEMAS disponibles (campo theme): ${themeIds}

ICONOS disponibles (campo icon): ${icons}
(Si necesitás un concepto sin icono exacto, usá el más cercano; el sistema resuelve alias.)

FOOTER (opcional, al final del documento, nivel raíz):
  footer <frase de cierre>
  footernote <subtítulo opcional>
  footericon <icono opcional>

REGLAS:
- Elegí la plantilla más adecuada al pedido salvo que se te indique una.
- Si el pedido lo amerita, cerrá con un footer de conclusión.
- Incluí una sección "title" como portada y 2 a 4 secciones de contenido.
- Contenido conciso y técnicamente correcto. Español neutro salvo que el pedido esté en otro idioma.`;
}

/** Construye el mensaje de usuario con el pedido y las preferencias. */
export function buildUserPrompt(input: GenerateInput): string {
  const lines = [input.prompt.trim()];
  if (input.template) lines.push(`\n(Usá obligatoriamente la plantilla: ${input.template})`);
  if (input.theme) lines.push(`(Usá el tema: ${input.theme})`);
  return lines.join("\n");
}

/** Quita cercos de markdown o prosa accidental alrededor del DSL. */
export function cleanDsl(raw: string): string {
  let text = raw.trim();
  // quitar fences ```...```
  const fence = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fence && fence[1]) text = fence[1].trim();
  // recortar desde la primera línea que parezca DSL
  const idx = text.search(/^(template|title|theme|section)\b/m);
  if (idx > 0) text = text.slice(idx);
  return text.trim();
}
