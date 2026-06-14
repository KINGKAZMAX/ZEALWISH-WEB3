import { app, BrowserWindow, session } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerIpcHandlers, unregisterIpcHandlers } from "./ipc";
import { loadLocalEnv } from "./services/env";
import { hermesManager } from "./services/hermes-manager";
import { prepareHermesRuntime } from "./services/hermes-runtime";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadLocalEnv({
  files: [
    process.env.OC_WORLD_ENV_FILE,
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env"),
  ],
});

let quitting = false;

function isTrustedRendererOrigin(rawUrl: string | undefined) {
  if (!rawUrl) {
    return false;
  }

  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === "file:" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "localhost" ||
      url.hostname === "::1"
    );
  } catch {
    return false;
  }
}

function configureLocalStaticPermissions() {
  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => (
    permission === "media" && isTrustedRendererOrigin(requestingOrigin)
  ));

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const mediaTypes = details && "mediaTypes" in details ? details.mediaTypes ?? [] : [];
    const wantsAudio = mediaTypes.length === 0 || mediaTypes.includes("audio");
    const requestUrl = details && "requestingUrl" in details ? details.requestingUrl : webContents.getURL();
    callback(permission === "media" && wantsAudio && isTrustedRendererOrigin(requestUrl));
  });
}

function loadRenderer(window: BrowserWindow) {
  const rendererUrl = process.env.OC_WORLD_RENDERER_URL;
  const rendererFile = process.env.OC_WORLD_RENDERER_FILE;
  const defaultRendererFiles = [
    path.resolve(process.cwd(), "demos/oc-invisible-growth-v1.html"),
    path.resolve(__dirname, "../demos/oc-invisible-growth-v1.html"),
  ];

  if (rendererUrl) {
    window.loadURL(rendererUrl);
    if (process.env.OC_WORLD_OPEN_DEVTOOLS === "1") {
      window.webContents.openDevTools({ mode: "detach" });
    }
    return;
  }

  if (rendererFile) {
    window.loadFile(path.resolve(rendererFile));
    if (process.env.OC_WORLD_OPEN_DEVTOOLS === "1") {
      window.webContents.openDevTools({ mode: "detach" });
    }
    return;
  }

  if (process.env.OC_WORLD_USE_VITE_RENDERER !== "1") {
    const defaultRendererFile = defaultRendererFiles.find((candidate) => fs.existsSync(candidate));

    if (defaultRendererFile) {
      window.loadFile(defaultRendererFile);
      if (process.env.OC_WORLD_OPEN_DEVTOOLS === "1") {
        window.webContents.openDevTools({ mode: "detach" });
      }
      return;
    }
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: "detach" });
    return;
  }

  window.loadFile(path.join(__dirname, "../dist/index.html"));
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadRenderer(window);
}

app.whenReady().then(() => {
  configureLocalStaticPermissions();
  prepareHermesRuntime({
    userDataPath: app.getPath("userData"),
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    cwd: process.cwd(),
    isPackaged: app.isPackaged,
  });
  registerIpcHandlers();
  void hermesManager.start();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", (event) => {
  if (quitting) {
    return;
  }

  quitting = true;
  event.preventDefault();
  unregisterIpcHandlers();
  void hermesManager.stop().finally(() => {
    app.quit();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
