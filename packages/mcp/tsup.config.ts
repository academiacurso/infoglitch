import { defineConfig } from "tsup";

export default defineConfig({
  entry: { server: "src/server.ts" },
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: false,
  target: "node18",
  external: ["@resvg/resvg-js"],
  banner: { js: "#!/usr/bin/env node" },
});
