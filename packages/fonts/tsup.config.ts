import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/fonts-data.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "es2022",
  // Los datos base64 van en un chunk aparte, cargado por import dinámico.
  external: ["./fonts-data.js"],
});
