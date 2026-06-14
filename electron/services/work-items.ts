import type { GrowthInsight, WorkItem } from "../../src/types";
import { createWorkItemId, listWorkItems, saveWorkItem } from "./unified-memory";

function shouldCreateWorkItem(insight: GrowthInsight) {
  return insight.type === "goal" && insight.status !== "rejected" && insight.status !== "archived";
}

function createNote(insight: GrowthInsight, now: number) {
  return {
    at: now,
    text: insight.text,
    source: "distillation" as const,
  };
}

function mergeSignals(existing: string[], next: string[]) {
  return Array.from(new Set([...existing, ...next]));
}

export async function syncWorkItemsFromInsights(input: {
  userId: string;
  insights: GrowthInsight[];
  now: number;
  dataRoot?: string;
}): Promise<WorkItem[]> {
  const existingItems = await listWorkItems(input.userId, input.dataRoot);
  const nextItems = [...existingItems];

  for (const insight of input.insights.filter(shouldCreateWorkItem)) {
    const id = createWorkItemId(input.userId, insight.title);
    const existingIndex = nextItems.findIndex((item) => item.id === id);
    const note = createNote(insight, input.now);

    if (existingIndex === -1) {
      const item: WorkItem = {
        id,
        userId: input.userId,
        title: insight.title,
        description: insight.text,
        status: "pending",
        source: "distillation",
        relatedSignals: mergeSignals([insight.id], insight.evidenceIds),
        notes: [note],
        summary: insight.text,
        createdAt: input.now,
        updatedAt: input.now,
      };
      await saveWorkItem(item, input.dataRoot);
      nextItems.push(item);
      continue;
    }

    const existing = nextItems[existingIndex];
    const hasNote = existing.notes.some((item) => item.text === note.text);
    const item: WorkItem = {
      ...existing,
      description: insight.text,
      relatedSignals: mergeSignals(existing.relatedSignals, [insight.id, ...insight.evidenceIds]),
      notes: hasNote ? existing.notes : [...existing.notes, note],
      summary: insight.text,
      updatedAt: input.now,
    };
    await saveWorkItem(item, input.dataRoot);
    nextItems[existingIndex] = item;
  }

  return nextItems.sort((left, right) => right.updatedAt - left.updatedAt);
}
