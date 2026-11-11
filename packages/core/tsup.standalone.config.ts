import { defineConfig } from "tsup";
export default defineConfig({
  entry: { "infoglitch-core": "src/index.ts" },
  format: ["esm"],
  dts: false,
  minify: true,
  splitting: false,
  noExternal: [/.*/],
  outDir: "standalone",
  target: "es2022",
});
