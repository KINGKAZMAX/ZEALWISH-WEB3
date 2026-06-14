import path from "node:path";

export function resolveDataRoot(dataRoot?: string) {
  return path.resolve(dataRoot || process.cwd());
}

export function resolveOcDataPath(dataRoot: string | undefined, ...segments: string[]) {
  return path.join(resolveDataRoot(dataRoot), "oc-data", ...segments);
}

export function resolveAvatarsDir(dataRoot?: string) {
  return resolveOcDataPath(dataRoot, "avatars");
}

export function resolveMockAirJellyContextPath(dataRoot?: string) {
  return resolveOcDataPath(dataRoot, "mock", "airjelly-context.json");
}
