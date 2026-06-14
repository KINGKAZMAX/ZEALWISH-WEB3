import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_AIRJELLY_CONTEXT,
  DEFAULT_CHARACTER,
  DEFAULT_HISTORY,
  DEFAULT_RELATIONSHIP,
  DEFAULT_SUMMARIES,
} from "../electron/services/demo-fallback";

const rootDir = process.cwd();
const dataDir = path.join(rootDir, "oc-data");

async function ensureDir(target: string) {
  await mkdir(target, { recursive: true });
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function run() {
  await ensureDir(path.join(dataDir, "mock"));
  await ensureDir(path.join(dataDir, "characters"));
  await ensureDir(path.join(dataDir, "relationships"));
  await ensureDir(path.join(dataDir, "memories/wechat"));
  await ensureDir(path.join(dataDir, "memories/oc_conversations"));

  await Promise.all([
    writeJson(path.join(dataDir, "mock/airjelly-context.json"), DEFAULT_AIRJELLY_CONTEXT),
    writeJson(path.join(dataDir, `characters/${DEFAULT_CHARACTER.id}.json`), DEFAULT_CHARACTER),
    writeJson(path.join(dataDir, `relationships/${DEFAULT_RELATIONSHIP.userId}.json`), DEFAULT_RELATIONSHIP),
    writeJson(path.join(dataDir, `memories/wechat/${DEFAULT_RELATIONSHIP.userId}_summaries.json`), DEFAULT_SUMMARIES),
    writeJson(path.join(dataDir, `memories/oc_conversations/${DEFAULT_RELATIONSHIP.userId}_history.json`), DEFAULT_HISTORY),
  ]);

  console.log("Seeded demo data.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
