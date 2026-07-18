// Build the committed plugin bundle: src/plugin-stdio.ts -> bundle/plugin-server.mjs
import { build } from "esbuild";
import { statSync } from "node:fs";
import { bundleOptions, BUNDLE_OUT } from "./bundle-options.js";

await build({ ...bundleOptions, outfile: BUNDLE_OUT });
const kb = (statSync(BUNDLE_OUT).size / 1024).toFixed(0);
console.log(`[build:bundle] wrote ${BUNDLE_OUT} (${kb} KB)`);
