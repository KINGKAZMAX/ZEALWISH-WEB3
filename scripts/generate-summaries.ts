import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { summarizeChunk } from "../electron/services/llm";
import { parseWxMarkdown } from "./parse-wx-chat";
import type { ChatMessage } from "../src/types";

function getWeekId(timestamp: number) {
  const date = new Date(timestamp);
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const offsetDays = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.floor((offsetDays + firstDay.getDay()) / 7) + 1;
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function chunkByWeek(messages: ChatMessage[]) {
  return messages.reduce<Record<string, ChatMessage[]>>((accumulator, message) => {
    const weekId = getWeekId(message.timestamp);
    return {
      ...accumulator,
      [weekId]: [...(accumulator[weekId] ?? []), message],
    };
  }, {});
}

async function run() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] ?? path.join(process.cwd(), "oc-data", "memories", "wechat", "user-001_summaries.json");

  if (!inputPath) {
    throw new Error("Missing input markdown path.");
  }

  const markdown = await readFile(path.resolve(inputPath), "utf8");
  const messages = parseWxMarkdown(markdown);
  const grouped = chunkByWeek(messages);
  const summaries = Object.entries(grouped).map(([period, items]) => summarizeChunk(items, period));

  await writeFile(path.resolve(outputPath), JSON.stringify(summaries, null, 2), "utf8");
  process.stdout.write(`Generated ${summaries.length} summaries.\n`);
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
