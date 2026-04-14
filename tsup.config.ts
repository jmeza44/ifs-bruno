import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node18",
  outDir: "dist",
  banner: { js: "#!/usr/bin/env node" },
  clean: true,
  minify: false,
});
