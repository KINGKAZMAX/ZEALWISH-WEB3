import { useState } from "react";

const fallbackColors = [
  "oklch(0.62 0.13 175)",
  "oklch(0.55 0.15 175)",
];

function getInitial(name?: string) {
  return (name ?? "OC").slice(0, 1);
}

function resolveSrc(src?: string, avatarPath?: string): string | undefined {
  if (src) return src;
  if (!avatarPath) return undefined;
  // Absolute path (from image-gen or explicit full path)
  if (avatarPath.startsWith("/") || /^[A-Za-z]:\\/.test(avatarPath)) {
    return `file://${avatarPath}`;
  }
  // data: URL or http(s) URL — pass through
  if (avatarPath.startsWith("data:") || avatarPath.startsWith("http")) {
    return avatarPath;
  }
  // Relative path — resolve against the Electron app cwd via IPC
  const appRoot = typeof window !== "undefined" && "ocWorld" in window
    ? (window.ocWorld as { getAppPath: () => string }).getAppPath()
    : "";
  if (appRoot) {
    return `file://${appRoot}/${avatarPath}`;
  }
  // Fallback for non-Electron environments (testing etc.)
  return avatarPath;
}

export function OcAvatar({
  src,
  avatarPath,
  name,
  size = 40,
  animated = true,
}: {
  src?: string;
  avatarPath?: string;
  name?: string;
  size?: number;
  animated?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const imageSrc = resolveSrc(src, avatarPath);

  if (!imageSrc || errored) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${fallbackColors[0]}, ${fallbackColors[1]})`,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontSize: size * 0.35,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {getInitial(name)}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        animation: animated ? "oc-bob 3s ease-in-out infinite" : "none",
        boxShadow: "0 2px 8px rgba(15,30,55,.10)",
      }}
    >
      <img
        src={imageSrc}
        alt={name ?? "OC"}
        onError={() => setErrored(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

export function OcAvatarLarge({
  src,
  avatarPath,
  name,
  size = 120,
}: {
  src?: string;
  avatarPath?: string;
  name?: string;
  size?: number;
}) {
  const [errored, setErrored] = useState(false);
  const imageSrc = resolveSrc(src, avatarPath);

  if (!imageSrc || errored) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(15,30,55,.12)",
        animation: "oc-bob 3s ease-in-out infinite",
        background: `linear-gradient(135deg, ${fallbackColors[0]}, ${fallbackColors[1]})`,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontSize: size * 0.3,
        fontWeight: 700,
      }}>
        {getInitial(name)}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(15,30,55,.12)",
        animation: "oc-bob 3s ease-in-out infinite",
      }}
    >
      <img
        src={imageSrc}
        alt={name ?? "OC"}
        onError={() => setErrored(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
