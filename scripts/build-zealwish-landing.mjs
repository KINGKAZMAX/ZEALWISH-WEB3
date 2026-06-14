import { build } from "esbuild";
import { resolve } from "node:path";

const root = process.cwd();

await build({
  entryPoints: [resolve(root, "frontend-v4/src/v5/zealwish-landing.jsx")],
  outfile: resolve(root, "frontend-v4/src/v5/zealwish-landing.js"),
  bundle: true,
  format: "iife",
  globalName: "ZEALWISHLandingBundle",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  tsconfigRaw: {
    compilerOptions: {
      jsx: "react",
      jsxFactory: "React.createElement",
      jsxFragmentFactory: "React.Fragment",
    },
  },
});
