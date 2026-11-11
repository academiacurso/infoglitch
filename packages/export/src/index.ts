// Rasterizado y descargas (navegador)
export {
  svgToCanvas,
  svgToPngBlob,
  svgToPngDataUrl,
  svgToPdfBlob,
  downloadBlob,
  downloadPng,
  downloadPdf,
  downloadSvg,
  parseSvgSize,
  type RasterOptions,
} from "./browser.js";

// Ensamblador de PDF puro (sin DOM) + utilidades, por si querés generar el PDF
// a partir de píxeles obtenidos por otra vía (ej. un rasterizador en Node).
export { buildPdf, rgbaToRgb, deflate, type BuildPdfInput } from "./pdf-build.js";
