import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AwarenessEpisode,
  LongTermMemory,
  Project,
  ProjectsState,
  RecallEvent,
  RecallSignalState,
  RetrievedMemoryBundle,
  WorkItem,
} from "../../src/types";
import { resolveOcDataPath } from "../capabilities/storage-paths";
import { parseProjectsState, parseRecallEventList, parseRecallSignalStateList, parseWorkItem } from "./schemas";

const DEFAULT_MEMORY_MARKDOWN = `# OC World Long-term Memory

## Person
- 待确认。

## Relationship
- 待确认。

## Growth Focus
- 待确认。

## Work / Projects
- 待确认。

## Preferences
- 待确认。

## Triggers
- 待确认。

## Recent
- 待确认。
`;

const DEFAULT_VOICE_MARKDOWN = `# OC World Voice Memory

## 适合的语气
- 待确认。

## 不适合的表达方式
- 待确认。

## 何时主动关心
- 待确认。

## 何时应克制
- 待确认。

## 什么内容可以直说
- 待确认。

## 什么内容要轻一点
- 待确认。
`;

const DEFAULT_SYSTEM_REMINDERS_MARKDOWN = `# System Reminders

- 不要把候选洞察当作确定事实。
- 长期记忆只写入用户确认过或多次稳定出现的内容。
- 记忆链失败不能阻断聊天主链。
`;

function resolveDataPath(dataRoot: string | undefined, ...segments: string[]) {
  return resolveOcDataPath(dataRoot, ...segments);
}

function resolveMemoryPath(dataRoot?: string) {
  return resolveDataPath(dataRoot, "memory", "memory.md");
}

function resolveVoicePath(dataRoot?: string) {
  return resolveDataPath(dataRoot, "memory", "voice.md");
}

function resolveSystemRemindersPath(dataRoot?: string) {
  return resolveDataPath(dataRoot, "memory", "scopes", "default", "system-reminders.md");
}

function resolveAwarenessEpisodesDir(dataRoot?: string) {
  return resolveDataPath(dataRoot, "awareness", "episodes");
}

function resolveAwarenessNotesDir(dataRoot?: string) {
  return resolveDataPath(dataRoot, "awareness", "notes");
}

function resolveWorkItemsDir(dataRoot?: string) {
  return resolveDataPath(dataRoot, "work-items");
}

function resolveProjectsPath(dataRoot?: string) {
  return resolveDataPath(dataRoot, "projects", "projects.json");
}

function resolveRecallPath(dataRoot?: string) {
  return resolveDataPath(dataRoot, "recall", "events.json");
}

function resolveRecallSignalsPath(dataRoot?: string) {
  return resolveDataPath(dataRoot, "recall", "signals.json");
}

async function ensureDir(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

async function ensureTextFile(filePath: string, fallback: string) {
  await ensureDir(path.dirname(filePath));

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, fallback, "utf8");
  }
}

async function readTextFile(filePath: string, fallback: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return fallback;
  }
}

async function readJsonFile<T>(filePath: string, fallback: T, parser: (value: unknown) => T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return parser(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function createEmptyProjectsState(userId: string): ProjectsState {
  return {
    version: 1,
    generatedAt: 0,
    userId,
    projects: [],
  };
}

function slug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "untitled";
}

function shortHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function getDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function toBulletList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- 暂无。";
}

function parseBulletSection(raw: string, heading: string) {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = raw.match(pattern);
  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter((line) => line && line !== "暂无。");
}

function renderAwarenessEpisode(episode: AwarenessEpisode) {
  return `# Awareness Episode: ${episode.title}

- id: ${episode.id}
- userId: ${episode.userId}
- source: ${episode.source}
- createdAt: ${episode.createdAt}
- relatedInsightIds: ${episode.relatedInsightIds.join(",")}

## Key Moments
${toBulletList(episode.keyMoments)}

## Behavior Signals
${toBulletList(episode.behaviorSignals)}

## Candidate Memory Updates
${toBulletList(episode.candidateMemoryUpdates)}

## Open Threads
${toBulletList(episode.openThreads)}
`;
}

function parseAwarenessEpisodeMarkdown(raw: string): AwarenessEpisode | null {
  const title = raw.match(/^# Awareness Episode: (.+)$/m)?.[1]?.trim();
  const id = raw.match(/^- id: (.+)$/m)?.[1]?.trim();
  const userId = raw.match(/^- userId: (.+)$/m)?.[1]?.trim();
  const source = raw.match(/^- source: (chat|airjelly|manual)$/m)?.[1] as AwarenessEpisode["source"] | undefined;
  const createdAtRaw = raw.match(/^- createdAt: (\d+)$/m)?.[1];
  const relatedInsightIdsRaw = raw.match(/^- relatedInsightIds: (.*)$/m)?.[1]?.trim() ?? "";
  const createdAt = Number(createdAtRaw);

  if (!title || !id || !userId || !source || !Number.isFinite(createdAt)) {
    return null;
  }

  return {
    id,
    userId,
    source,
    createdAt,
    title,
    keyMoments: parseBulletSection(raw, "Key Moments"),
    behaviorSignals: parseBulletSection(raw, "Behavior Signals"),
    candidateMemoryUpdates: parseBulletSection(raw, "Candidate Memory Updates"),
    openThreads: parseBulletSection(raw, "Open Threads"),
    relatedInsightIds: relatedInsightIdsRaw
      ? relatedInsightIdsRaw.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
  };
}

async function getLatestUpdatedAt(filePaths: string[]) {
  const stats = await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        return await stat(filePath);
      } catch {
        return null;
      }
    }),
  );

  return Math.max(0, ...stats.map((item) => item?.mtimeMs ?? 0));
}

export async function ensureUnifiedMemoryRepository(userId: string, dataRoot?: string) {
  await Promise.all([
    ensureTextFile(resolveMemoryPath(dataRoot), DEFAULT_MEMORY_MARKDOWN),
    ensureTextFile(resolveVoicePath(dataRoot), DEFAULT_VOICE_MARKDOWN),
    ensureTextFile(resolveSystemRemindersPath(dataRoot), DEFAULT_SYSTEM_REMINDERS_MARKDOWN),
    ensureDir(resolveAwarenessEpisodesDir(dataRoot)),
    ensureDir(resolveAwarenessNotesDir(dataRoot)),
    ensureDir(resolveWorkItemsDir(dataRoot)),
    writeJsonFile(resolveProjectsPath(dataRoot), await loadProjectsState(userId, dataRoot)),
    writeJsonFile(resolveRecallPath(dataRoot), await loadRecallEvents(userId, dataRoot)),
    writeJsonFile(resolveRecallSignalsPath(dataRoot), await loadRecallSignalStates(userId, dataRoot)),
  ]);
}

export async function loadLongTermMemory(userId: string, dataRoot?: string): Promise<LongTermMemory> {
  await Promise.all([
    ensureTextFile(resolveMemoryPath(dataRoot), DEFAULT_MEMORY_MARKDOWN),
    ensureTextFile(resolveVoicePath(dataRoot), DEFAULT_VOICE_MARKDOWN),
    ensureTextFile(resolveSystemRemindersPath(dataRoot), DEFAULT_SYSTEM_REMINDERS_MARKDOWN),
  ]);

  const [memoryMarkdown, voiceMarkdown, systemRemindersMarkdown, updatedAt] = await Promise.all([
    readTextFile(resolveMemoryPath(dataRoot), DEFAULT_MEMORY_MARKDOWN),
    readTextFile(resolveVoicePath(dataRoot), DEFAULT_VOICE_MARKDOWN),
    readTextFile(resolveSystemRemindersPath(dataRoot), DEFAULT_SYSTEM_REMINDERS_MARKDOWN),
    getLatestUpdatedAt([resolveMemoryPath(dataRoot), resolveVoicePath(dataRoot), resolveSystemRemindersPath(dataRoot)]),
  ]);

  return {
    userId,
    memoryMarkdown,
    voiceMarkdown,
    systemRemindersMarkdown,
    updatedAt,
  };
}

export async function appendAwarenessEpisode(episode: AwarenessEpisode, dataRoot?: string) {
  await ensureDir(resolveAwarenessEpisodesDir(dataRoot));
  const fileName = `${getDateKey(episode.createdAt)}_${slug(episode.id)}_${slug(episode.title)}.md`;
  const filePath = path.join(resolveAwarenessEpisodesDir(dataRoot), fileName);
  await writeFile(filePath, renderAwarenessEpisode(episode), "utf8");
  return episode;
}

export async function listAwarenessEpisodes(userId: string, limit = 10, dataRoot?: string): Promise<AwarenessEpisode[]> {
  await ensureDir(resolveAwarenessEpisodesDir(dataRoot));

  const names = await readdir(resolveAwarenessEpisodesDir(dataRoot));
  const episodes = await Promise.all(
    names
      .filter((name) => name.endsWith(".md"))
      .sort()
      .reverse()
      .map(async (name) => parseAwarenessEpisodeMarkdown(await readFile(path.join(resolveAwarenessEpisodesDir(dataRoot), name), "utf8"))),
  );

  return episodes
    .filter((episode): episode is AwarenessEpisode => Boolean(episode && episode.userId === userId))
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, limit);
}

export async function listWorkItems(userId: string, dataRoot?: string): Promise<WorkItem[]> {
  await ensureDir(resolveWorkItemsDir(dataRoot));

  const names = await readdir(resolveWorkItemsDir(dataRoot));
  const items = await Promise.all(
    names
      .filter((name) => name.endsWith(".json"))
      .map((name) => readJsonFile(path.join(resolveWorkItemsDir(dataRoot), name), null, parseWorkItem)),
  );

  return items
    .filter((item): item is WorkItem => Boolean(item && item.userId === userId))
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function saveWorkItem(item: WorkItem, dataRoot?: string) {
  await writeJsonFile(path.join(resolveWorkItemsDir(dataRoot), `${item.id}.json`), item);
  return item;
}

export function createWorkItemId(userId: string, title: string) {
  return `work_${shortHash(`${userId}:${title}`)}`;
}

export async function loadProjectsState(userId: string, dataRoot?: string): Promise<ProjectsState> {
  const fallback = createEmptyProjectsState(userId);
  const state = await readJsonFile(resolveProjectsPath(dataRoot), fallback, parseProjectsState);
  return state.userId === userId ? state : fallback;
}

export async function saveProjectsState(state: ProjectsState, dataRoot?: string) {
  await writeJsonFile(resolveProjectsPath(dataRoot), state);
  return state;
}

export async function loadRecallEvents(userId: string, dataRoot?: string): Promise<RecallEvent[]> {
  const events = await readJsonFile(resolveRecallPath(dataRoot), [], parseRecallEventList);
  return events.filter((event) => event.userId === userId);
}

export async function saveRecallEvents(events: RecallEvent[], dataRoot?: string) {
  await writeJsonFile(resolveRecallPath(dataRoot), events);
  return events;
}

export async function loadRecallSignalStates(userId: string, dataRoot?: string): Promise<RecallSignalState[]> {
  const states = await readJsonFile(resolveRecallSignalsPath(dataRoot), [], parseRecallSignalStateList);
  return states.filter((state) => state.userId === userId);
}

export async function saveRecallSignalStates(states: RecallSignalState[], dataRoot?: string) {
  await writeJsonFile(resolveRecallSignalsPath(dataRoot), states);
  return states;
}

export async function listRecentRecallEvents(userId: string, limit = 10, dataRoot?: string) {
  const events = await loadRecallEvents(userId, dataRoot);
  return events.sort((left, right) => right.createdAt - left.createdAt).slice(0, limit);
}

function compactMarkdown(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export async function loadRetrievedMemoryBundle(userId: string, dataRoot?: string): Promise<RetrievedMemoryBundle> {
  const [longTermMemory, awareness, workItems, projectsState] = await Promise.all([
    loadLongTermMemory(userId, dataRoot),
    listAwarenessEpisodes(userId, 5, dataRoot),
    listWorkItems(userId, dataRoot),
    loadProjectsState(userId, dataRoot),
  ]);

  return {
    longTermFacts: compactMarkdown(longTermMemory.memoryMarkdown),
    voiceHints: compactMarkdown(longTermMemory.voiceMarkdown),
    systemReminders: compactMarkdown(longTermMemory.systemRemindersMarkdown),
    activeProjects: projectsState.projects.slice(0, 5),
    relevantWorkItems: workItems.filter((item) => item.status === "pending" || item.status === "in_progress" || item.status === "blocked").slice(0, 5),
    recentAwarenessHighlights: awareness,
  };
}

function appendNoteToMarkdown(markdown: string, section: string, note: string) {
  if (markdown.includes(note)) {
    return markdown;
  }

  if (markdown.includes(`## ${section}`)) {
    return `${markdown.trimEnd()}\n${note}\n`;
  }

  return `${markdown.trimEnd()}\n\n## ${section}\n${note}\n`;
}

export async function appendConfirmedMemoryNote(input: {
  insightId: string;
  title: string;
  text: string;
  type: "memory" | "voice";
  now: number;
  dataRoot?: string;
}) {
  const filePath = input.type === "voice" ? resolveVoicePath(input.dataRoot) : resolveMemoryPath(input.dataRoot);
  await ensureTextFile(filePath, input.type === "voice" ? DEFAULT_VOICE_MARKDOWN : DEFAULT_MEMORY_MARKDOWN);
  const section = input.type === "voice" ? "已确认的沟通偏好" : "Confirmed Growth";
  const marker = `<!-- insight:${input.insightId} -->`;
  const note = `- ${new Date(input.now).toISOString().slice(0, 10)} ${marker} ${input.title}：${input.text}`;
  const current = await readTextFile(filePath, input.type === "voice" ? DEFAULT_VOICE_MARKDOWN : DEFAULT_MEMORY_MARKDOWN);
  const next = appendNoteToMarkdown(current, section, note);
  await writeFile(filePath, next, "utf8");
}

export async function appendAwarenessNote(input: {
  userId: string;
  episodeId: string;
  lines: string[];
  now: number;
  dataRoot?: string;
}) {
  if (!input.lines.length) {
    return null;
  }

  await ensureDir(resolveAwarenessNotesDir(input.dataRoot));
  const filePath = path.join(resolveAwarenessNotesDir(input.dataRoot), `${getDateKey(input.now)}_${slug(input.episodeId)}.md`);
  await writeFile(
    filePath,
    `# Awareness Merge Note

- userId: ${input.userId}
- episodeId: ${input.episodeId}
- createdAt: ${input.now}

${input.lines.map((line) => `- ${line}`).join("\n")}
`,
    "utf8",
  );
  return filePath;
}

export function createProjectFromWorkItems(userId: string, items: WorkItem[], now: number): Project | null {
  const activeItems = items.filter((item) => item.status === "pending" || item.status === "in_progress" || item.status === "blocked");
  if (!activeItems.length) {
    return null;
  }

  return {
    id: `project_${shortHash(`${userId}:${activeItems.map((item) => item.id).join(":")}`)}`,
    userId,
    title: `成长方向：${activeItems[0].title}`,
    description: "由当前活跃成长事项自动聚合的骨架项目。",
    workItemIds: activeItems.map((item) => item.id),
    confidence: Math.min(0.75, 0.35 + activeItems.length * 0.1),
    rationale: "来自 distillation 后的 work-item 聚合，首版仅做骨架。",
    updatedAt: now,
  };
}
