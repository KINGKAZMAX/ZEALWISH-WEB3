import fs from "node:fs";
import path from "node:path";

interface LoadLocalEnvOptions {
  files?: Array<string | undefined>;
  override?: boolean;
}

function stripInlineComment(value: string) {
  let quote: string | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if ((char === "\"" || char === "'") && previous !== "\\") {
      quote = quote === char ? null : quote ?? char;
      continue;
    }

    if (char === "#" && !quote) {
      return value.slice(0, index).trimEnd();
    }
  }

  return value;
}

export function parseEnvFile(content: string) {
  const values: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ") ? line.slice("export ".length).trimStart() : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    let value = stripInlineComment(normalizedLine.slice(separatorIndex + 1).trim());

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value.replace(/\\n/g, "\n");
  }

  return values;
}

export function loadLocalEnv(options: LoadLocalEnvOptions = {}) {
  const files = options.files ?? [
    process.env.OC_WORLD_ENV_FILE,
    path.resolve(process.cwd(), ".env"),
  ];
  const loadedFiles: string[] = [];

  for (const file of files) {
    if (!file || loadedFiles.includes(file) || !fs.existsSync(file)) {
      continue;
    }

    const values = parseEnvFile(fs.readFileSync(file, "utf8"));

    for (const [key, value] of Object.entries(values)) {
      if (options.override || process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    loadedFiles.push(file);
  }

  return loadedFiles;
}
