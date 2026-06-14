import { build } from "esbuild";
import { resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const root = process.cwd();

// 1) v6 workspace app: JSX -> minified IIFE bundle (React stays a global;
//    ethers' verifyMessage is bundled in).
await build({
  entryPoints: [resolve(root, "frontend-v4/src/v6/zealwish-web-app.jsx")],
  outfile: resolve(root, "frontend-v4/src/v6/zealwish-web-app.js"),
  bundle: true,
  format: "iife",
  globalName: "ZEALWISHWebAppBundle",
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

// 2) wallet service: plain JS in a .jsx file — emit a .js copy so nosniff
//    hosts serve it with a JavaScript content type.
await build({
  entryPoints: [resolve(root, "frontend-v4/src/v4/wallet-service.jsx")],
  outfile: resolve(root, "frontend-v4/src/v4/wallet-service.js"),
  bundle: false,
  platform: "browser",
  target: ["es2020"],
  minify: true,
  allowOverwrite: true,
  loader: { ".jsx": "jsx" },
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
});

// 3) Stamp a build-time cache buster onto every local versioned script tag.
const now = new Date();
const pad = (value) => String(value).padStart(2, "0");
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
for (const page of ["frontend-v4/web.html", "frontend-v4/index.html"]) {
  const path = resolve(root, page);
  const html = readFileSync(path, "utf8");
  const stamped = html.replace(/\?v=[A-Za-z0-9-]+/g, `?v=${stamp}`);
  if (stamped !== html) writeFileSync(path, stamped);
}

console.log(`[build:web] bundles compiled, cache buster v=${stamp}`);
