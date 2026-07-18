// Fails when the committed plugin bundle no longer matches its sources.
//
// The bundle is a generated artifact that IS committed (the plugin ships it), so
// it can drift exactly like the KB mirrors and the semantic index did. This is
// its guard: rebuild in memory and compare — never writing, so it is safe in CI
// and in a pre-commit hook.
import { build } from "esbuild";
import { existsSync, readFileSync } from "node:fs";
import { bundleOptions, BUNDLE_OUT } from "./bundle-options.js";

if (!existsSync(BUNDLE_OUT)) {
  console.error(`[check:bundle] ${BUNDLE_OUT} is missing. Run: npm run build:bundle`);
  process.exit(1);
}

const result = await build({ ...bundleOptions, outfile: BUNDLE_OUT, write: false });
const fresh = result.outputFiles[0].text;
const committed = readFileSync(BUNDLE_OUT, "utf8");

if (fresh !== committed) {
  console.error("[check:bundle] plugin bundle is OUT OF DATE vs src/. Run: npm run build:bundle");
  process.exit(1);
}
console.log(`[check:bundle] bundle matches sources (${(committed.length / 1024).toFixed(0)} KB).`);
