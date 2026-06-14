import type { ContextSnapshot, RecallEvent, RecallSignalState } from "../../src/types";
import {
  loadRecallEvents,
  loadRecallSignalStates,
  saveRecallEvents,
  saveRecallSignalStates,
} from "./unified-memory";

const REQUIRED_REPEAT_COUNT = 3;
const COOLDOWN_MS = 30 * 60 * 1000;

function normalizeSignal(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 120);
}

function getTaskSignals(snapshot: ContextSnapshot) {
  const taskSignals = snapshot.realtimeContext.tasks.map((task) => task.title);
  const eventSignals = snapshot.realtimeContext.events.flatMap((event) => [event.title, event.appName]);
  const appSignals = snapshot.realtimeContext.appUsage
    .slice()
    .sort((left, right) => right.totalSeconds - left.totalSeconds)
    .slice(0, 3)
    .map((item) => item.appName);

  return Array.from(new Set([...taskSignals, ...eventSignals, ...appSignals].map(normalizeSignal).filter(Boolean)));
}

function isCoolingDown(state: RecallSignalState | undefined, now: number) {
  return Boolean(state?.lastTriggeredAt && now - state.lastTriggeredAt < COOLDOWN_MS);
}

function updateSignalStates(input: {
  userId: string;
  seenSignals: string[];
  states: RecallSignalState[];
  now: number;
}) {
  const seen = new Set(input.seenSignals);
  const bySignal = new Map(input.states.map((state) => [state.signal, state]));
  const nextStates = input.states
    .filter((state) => state.userId === input.userId)
    .map((state) =>
      seen.has(state.signal)
        ? {
            ...state,
            count: state.count + 1,
            lastSeenAt: input.now,
          }
        : {
            ...state,
            count: 0,
          },
    );

  for (const signal of input.seenSignals) {
    if (bySignal.has(signal)) {
      continue;
    }

    nextStates.push({
      userId: input.userId,
      signal,
      count: 1,
      firstSeenAt: input.now,
      lastSeenAt: input.now,
    });
  }

  return nextStates;
}

export async function evaluateRecallCandidates(input: {
  userId: string;
  snapshot: ContextSnapshot;
  now: number;
  dataRoot?: string;
}): Promise<RecallEvent[]> {
  const [existingEvents, existingStates] = await Promise.all([
    loadRecallEvents(input.userId, input.dataRoot),
    loadRecallSignalStates(input.userId, input.dataRoot),
  ]);
  const nextEvents = [...existingEvents];
  const seenSignals = getTaskSignals(input.snapshot);
  let nextStates = updateSignalStates({
    userId: input.userId,
    seenSignals,
    states: existingStates,
    now: input.now,
  });

  for (const signal of seenSignals) {
    const state = nextStates.find((item) => item.signal === signal);
    if (!state || state.count < REQUIRED_REPEAT_COUNT || isCoolingDown(state, input.now)) {
      continue;
    }

    nextEvents.push({
      id: `recall-${input.now}-${nextEvents.length}`,
      userId: input.userId,
      signal,
      text: `AirJelly 里还有一个相关事项：${signal}`,
      source: "airjelly",
      status: "candidate",
      createdAt: input.now,
    });

    nextStates = nextStates.map((item) =>
      item.signal === signal
        ? {
            ...item,
            count: 0,
            lastTriggeredAt: input.now,
          }
        : item,
    );
  }

  await Promise.all([
    nextEvents.length !== existingEvents.length
      ? saveRecallEvents(nextEvents, input.dataRoot)
      : Promise.resolve(nextEvents),
    saveRecallSignalStates(nextStates, input.dataRoot),
  ]);

  return nextEvents.sort((left, right) => right.createdAt - left.createdAt);
}
