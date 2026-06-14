import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ChatMessage } from "../src/types";

function detectType(content: string): ChatMessage["type"] {
  if (/^\[图片/.test(content)) {
    return "image";
  }

  if (/^\[语音/.test(content)) {
    return "voice";
  }

  if (/^>/.test(content)) {
    return "quote";
  }

  if (/\[.+\]/.test(content)) {
    return "emoji";
  }

  return "text";
}

export function parseWxMarkdown(markdown: string): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const blocks = markdown.split(/^### /gm).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const dateMatch = lines[0]?.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/);

    if (!dateMatch) {
      continue;
    }

    const timestamp = new Date(dateMatch[1].replace(" ", "T")).getTime();

    for (const line of lines.slice(1)) {
      const match = line.match(/^\*\*(.+?)\*\*:\s*(.+)$/);

      if (!match) {
        continue;
      }

      messages.push({
        timestamp,
        sender: match[1],
        content: match[2],
        type: detectType(match[2]),
      });
    }
  }

  return messages;
}

async function run() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Missing input markdown path.");
  }

  const raw = await readFile(path.resolve(inputPath), "utf8");
  const messages = parseWxMarkdown(raw);
  process.stdout.write(JSON.stringify(messages, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith("parse-wx-chat.ts")) {
  run().catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
