import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const STATIC_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OC_WORLD_ROOT = "/Users/pika/ai-pika/oc-world";
const ENTRY_FILE = "OCWORLD Desktop.html";
const DEFAULT_PORT = 8787;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function resolveRequestPath(url) {
  const parsed = new URL(url, "http://127.0.0.1");
  const rawPath = decodeURIComponent(parsed.pathname === "/" ? `/${ENTRY_FILE}` : parsed.pathname);
  const safePath = normalize(rawPath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = resolve(join(STATIC_ROOT, safePath));
  if (!fullPath.startsWith(STATIC_ROOT + sep) && fullPath !== STATIC_ROOT) {
    return null;
  }
  return fullPath;
}

const server = createServer((req, res) => {
  const filePath = resolveRequestPath(req.url || "/");
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    send(res, 404, "Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
});

function listen(port) {
  return new Promise((resolveListen) => {
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" && port !== 0) {
        resolveListen(listen(0));
        return;
      }
      throw error;
    });
    server.listen(port, "127.0.0.1", () => resolveListen(server.address().port));
  });
}

const port = await listen(DEFAULT_PORT);
const rendererUrl = `http://127.0.0.1:${port}/${encodeURIComponent(ENTRY_FILE)}`;

console.log(`[ocworld-demo] Static UI: ${rendererUrl}`);
console.log("[ocworld-demo] Starting oc-world Electron runtime...");

const child = spawn("npm", ["run", "dev"], {
  cwd: OC_WORLD_ROOT,
  stdio: "inherit",
  env: {
    ...process.env,
    OC_WORLD_RENDERER_URL: rendererUrl,
  },
});

function shutdown() {
  server.close();
  if (!child.killed) child.kill("SIGINT");
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

child.on("exit", (code, signal) => {
  server.close();
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
