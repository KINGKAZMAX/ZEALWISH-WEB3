import type { RecallEvent } from "../../src/types";
import { buildContextSnapshot } from "./context-snapshot";
import { getMemoryFeatureFlags } from "./feature-flags";
import { appendGrowthLog } from "./memory";
import { evaluateRecallCandidates } from "./recall";
import { loadRecallEvents } from "./unified-memory";

interface EvaluateContextRecallInput {
  userId: string;
  characterId?: string;
  dataRoot?: string;
  now?: number;
}

interface RecallPollingInput extends EvaluateContextRecallInput {
  intervalMs?: number;
  onHint?: (event: RecallEvent) => void | Promise<void>;
}

const activePollers = new Map<string, ReturnType<typeof setInterval>>();

function getPollingKey(input: EvaluateContextRecallInput) {
  return `${input.userId}:${input.characterId || "char-001"}:${input.dataRoot || process.cwd()}`;
}

function getRecallPollIntervalMs(env = process.env) {
  const parsed = Number(env.OC_RECALL_POLL_INTERVAL_MS);
  if (Number.isFinite(parsed) && parsed >= 5_000) {
    return parsed;
  }

  return 5 * 60_000;
}

async function emitHints(input: RecallPollingInput, events: RecallEvent[]) {
  for (const event of events) {
    await input.onHint?.(event);
  }
}

async function evaluateAndEmit(input: RecallPollingInput) {
  try {
    const events = await evaluateContextRecall(input);
    await emitHints(input, events);
    return events;
  } catch (error) {
    await appendGrowthLog(
      input.userId,
      {
        at: Date.now(),
        stage: "recall-service-error",
        message: error instanceof Error ? error.message : String(error),
      },
      input.dataRoot,
    );
    return [];
  }
}

export async function evaluateContextRecall(input: EvaluateContextRecallInput): Promise<RecallEvent[]> {
  const flags = getMemoryFeatureFlags();
  if (!flags.unifiedMemory || !flags.recall) {
    return [];
  }

  const dataRoot = input.dataRoot ?? process.cwd();
  const beforeEvents = await loadRecallEvents(input.userId, dataRoot);
  const beforeIds = new Set(beforeEvents.map((event) => event.id));
  const snapshot = await buildContextSnapshot({
    userId: input.userId,
    characterId: input.characterId || "char-001",
    recentChatLimit: 6,
    summariesLimit: 3,
    dataRoot,
  });
  const events = await evaluateRecallCandidates({
    userId: input.userId,
    snapshot,
    now: input.now ?? Date.now(),
    dataRoot,
  });

  return events.filter((event) => !beforeIds.has(event.id));
}

export function startRecallPolling(input: RecallPollingInput) {
  const flags = getMemoryFeatureFlags();
  if (!flags.unifiedMemory || !flags.recall || !flags.recallPolling) {
    return false;
  }

  const key = getPollingKey(input);
  if (activePollers.has(key)) {
    return true;
  }

  const intervalMs = input.intervalMs ?? getRecallPollIntervalMs();
  const poller = setInterval(() => {
    void evaluateAndEmit(input);
  }, intervalMs);
  activePollers.set(key, poller);
  void evaluateAndEmit(input);
  return true;
}

export function stopRecallPolling(input: EvaluateContextRecallInput) {
  const key = getPollingKey(input);
  const poller = activePollers.get(key);
  if (!poller) {
    return false;
  }

  clearInterval(poller);
  activePollers.delete(key);
  return true;
}

export function stopAllRecallPolling() {
  for (const poller of activePollers.values()) {
    clearInterval(poller);
  }
  activePollers.clear();
}
