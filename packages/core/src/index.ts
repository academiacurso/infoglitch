// Modelo de documento (fuente de verdad)
export {
  infographicDocSchema,
  sectionSchema,
  parseDoc,
  safeParseDoc,
  toJsonSchema,
} from "./model/schema.js";
export type {
  InfographicDoc,
  InfographicDocInput,
  Section,
  SectionType,
  TitleSection,
  StepsSection,
  ComparisonSection,
  StatSection,
  CodeSnippetSection,
  ArchitectureSection,
  TimelineSection,
  ListSection,
  CalloutSection,
  VersusSection,
  FlowSection,
  RoadmapSection,
  IconGridSection,
  ChartSection,
  ColumnsSection,
  LeafSection,
  Footer,
} from "./model/schema.js";

// DSL textual tolerante
export { parseDsl, stringify } from "./dsl/parser.js";

// Render (JSON/DSL -> SVG)
export {
  Infographic,
  renderToString,
  toDoc,
} from "./render/infographic.js";
export type { InfographicOptions, RenderOptions } from "./render/infographic.js";

// Plantillas
export {
  registerTemplate,
  getTemplate,
  templateIds,
  templateCatalog,
  makeStackTemplate,
  stackSections,
  FALLBACK_TEMPLATE,
} from "./render/registry.js";
export type { Template, TemplateRenderOpts } from "./render/registry.js";
export { builtinTemplates, registerBuiltinTemplates } from "./render/templates/index.js";

// Temas
export {
  themes,
  getTheme,
  defaultThemeId,
  darkTerminal,
  lightDocs,
  glitch,
  neonNight,
  blueprint,
  cyber,
  codePalette,
  themeAccents,
  defineTheme,
  registerTheme,
} from "./theme/index.js";
export type { Theme, CodePalette, BackgroundGradient, ThemeInput } from "./theme/index.js";

// Iconos
export {
  icons,
  resolveIcon,
  iconNames,
  registerIconSource,
  clearIconSources,
} from "./icons/index.js";
export type { IconDef, ResolvedIcon, IconSource } from "./icons/index.js";
