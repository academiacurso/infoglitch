import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/devicon-data.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "es2022",
  // devicon-data se emite como entry aparte y se carga por import dinámico,
  // así no infla el bundle de quien sólo usa Simple Icons.
  external: ["@infoglitch/core", "simple-icons", "./devicon-data.js"],
});
