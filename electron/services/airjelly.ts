import { readFile } from "node:fs/promises";
import type { AirJellyContext } from "../../src/types";
import { resolveMockAirJellyContextPath } from "../capabilities/storage-paths";
import { DEFAULT_AIRJELLY_CONTEXT } from "./demo-fallback";
import { parseAirJellyContext } from "./schemas";

let cache: { data: AirJellyContext; timestamp: number; dataRoot: string | undefined } | null = null;

async function readMockContext(dataRoot?: string): Promise<AirJellyContext> {
  const filePath = resolveMockAirJellyContextPath(dataRoot);

  try {
    const raw = await readFile(filePath, "utf8");
    return parseAirJellyContext(JSON.parse(raw));
  } catch {
    return DEFAULT_AIRJELLY_CONTEXT;
  }
}

async function readAirJellySdk(dataRoot?: string): Promise<AirJellyContext> {
  if (process.env.OC_DEMO_FORCE_MOCK_AIRJELLY === "1") {
    return readMockContext(dataRoot);
  }

  try {
    const sdkModule = await import(/* @vite-ignore */ process.env.OC_AIRJELLY_SDK_MODULE || "@airjelly/sdk");
    const client = sdkModule.createClient();
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const [events, tasks, appUsage] = await Promise.all([
      client.getEventsByDate(now - 8 * 3600_000, now),
      client.getOpenTasks(5),
      client.getDailyAppUsage(today),
    ]);

    return parseAirJellyContext({
      events: events.map((event: any) => ({
        title: event.title,
        appName: event.app_name,
        durationSeconds: event.duration_seconds,
        timestamp: event.start_time ?? now,
      })),
      tasks: tasks.map((task: any) => ({
        title: task.title,
        progressSummary: task.progress_summary || "进行中",
        dueDate: task.due_date,
      })),
      appUsage: appUsage.map((item: any) => ({
        appName: item.app_name,
        totalSeconds: item.total_seconds,
      })),
      source: "airjelly",
    });
  } catch {
    return readMockContext(dataRoot);
  }
}

export async function getAirJellyContext(dataRoot?: string): Promise<AirJellyContext> {
  if (cache && cache.dataRoot === dataRoot && Date.now() - cache.timestamp < 5 * 60_000) {
    return cache.data;
  }

  const data = await readAirJellySdk(dataRoot);
  cache = { data, timestamp: Date.now(), dataRoot };
  return data;
}
