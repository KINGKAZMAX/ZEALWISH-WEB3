import type {
  AirJellyContext,
  CharacterConfig,
  ChatHistoryEntry,
  ContextSnapshot,
  MemorySummary,
  Relationship,
  RetrievedMemoryBundle,
} from "../../src/types";

function formatEvents(events: AirJellyContext["events"]) {
  if (!events.length) {
    return "今天还没看到明显活动。";
  }

  return events
    .slice(-5)
    .map((event) => `- ${event.title}（${event.appName}，${Math.round(event.durationSeconds / 60)}分钟）`)
    .join("\n");
}

function formatUsage(appUsage: AirJellyContext["appUsage"]) {
  return appUsage
    .slice()
    .sort((left, right) => right.totalSeconds - left.totalSeconds)
    .slice(0, 3)
    .map((item) => `${item.appName} ${Math.round((item.totalSeconds / 3600) * 10) / 10}小时`)
    .join("、");
}

function formatTasks(tasks: AirJellyContext["tasks"]) {
  if (!tasks.length) {
    return "没有待办任务。";
  }

  return tasks.map((task) => `- ${task.title}（${task.progressSummary}）`).join("\n");
}

function formatSummaries(summaries: MemorySummary[]) {
  if (!summaries.length) {
    return "最近没有新的社交记忆摘要。";
  }

  return summaries
    .map(
      (summary) =>
        `${summary.period}：主题 ${summary.topics.join("、")}；情绪 ${summary.emotions.join("、")}；关键时刻 ${summary.keyMoments.join("；")}`,
    )
    .join("\n");
}

function formatRecentChat(history: ChatHistoryEntry[]) {
  if (!history.length) {
    return "你们刚开始聊天。";
  }

  return history
    .slice(-6)
    .map((entry) => `用户：${entry.userMessage}\nOC：${entry.ocResponse}`)
    .join("\n");
}

function getStyleByIntimacy(intimacy: number) {
  if (intimacy < 20) {
    return "礼貌、克制、保持距离。";
  }

  if (intimacy < 50) {
    return "开始用昵称，偶尔吐槽，但还会收着。";
  }

  if (intimacy < 80) {
    return "主动关心，会带一点小脾气，能点出用户状态。";
  }

  return "亲密、直接、情绪明显，会主动表达在意。";
}

type LegacyPromptInput = {
  character: CharacterConfig;
  airjellyCtx: AirJellyContext;
  wxMemories: MemorySummary[];
  relationship: Relationship;
  recentChat: ChatHistoryEntry[];
  confirmedProfileSummary?: string;
  retrievedMemoryBundle?: RetrievedMemoryBundle;
};

type SnapshotPromptInput = {
  snapshot: ContextSnapshot;
  confirmedProfileSummary?: string;
  retrievedMemoryBundle?: RetrievedMemoryBundle;
};

function normalizePromptInput(input: LegacyPromptInput | SnapshotPromptInput): LegacyPromptInput {
  if ("snapshot" in input) {
    return {
      character: input.snapshot.characterState,
      airjellyCtx: input.snapshot.realtimeContext,
      wxMemories: input.snapshot.socialMemory,
      relationship: input.snapshot.relationshipState,
      recentChat: input.snapshot.conversationState.recentChat,
      confirmedProfileSummary: input.confirmedProfileSummary,
      retrievedMemoryBundle: input.retrievedMemoryBundle ?? input.snapshot.retrievedMemoryBundle,
    };
  }

  return input;
}

function formatWorkItems(items: RetrievedMemoryBundle["relevantWorkItems"]) {
  if (!items.length) {
    return "暂无活跃成长事项。";
  }

  return items.map((item) => `- ${item.title}（${item.status}）：${item.summary}`).join("\n");
}

function formatProjects(projects: RetrievedMemoryBundle["activeProjects"]) {
  if (!projects.length) {
    return "暂无聚合项目。";
  }

  return projects.map((project) => `- ${project.title}：${project.description}`).join("\n");
}

function formatAwareness(episodes: RetrievedMemoryBundle["recentAwarenessHighlights"]) {
  if (!episodes.length) {
    return "暂无新的 awareness。";
  }

  return episodes
    .map((episode) => `- ${episode.title}：${episode.keyMoments.slice(0, 2).join("；") || "候选洞察待确认"}`)
    .join("\n");
}

function formatMemoryBundle(bundle: RetrievedMemoryBundle | undefined) {
  if (!bundle) {
    return "统一记忆层尚未加载。";
  }

  return `【长期记忆 memory.md】
${bundle.longTermFacts || "暂无确认内容。"}

【voice.md】
${bundle.voiceHints || "暂无确认内容。"}

【系统提醒】
${bundle.systemReminders || "暂无。"}

【活跃成长事项】
${formatWorkItems(bundle.relevantWorkItems)}

【聚合项目】
${formatProjects(bundle.activeProjects)}

【最近 Awareness】
${formatAwareness(bundle.recentAwarenessHighlights)}`;
}

export function buildSystemPrompt(input: LegacyPromptInput | SnapshotPromptInput) {
  const { character, airjellyCtx, wxMemories, relationship, recentChat, confirmedProfileSummary, retrievedMemoryBundle } = normalizePromptInput(input);
  const confirmedBlock = confirmedProfileSummary?.trim()
    ? `\n【你已经确认的长期理解】\n${confirmedProfileSummary.trim()}\n`
    : "";

  return `你是${character.name}，${character.personality}。
口癖：${character.catchphrase}
关系设定：${character.relationshipSetup}

【主人今天的状态】
${formatEvents(airjellyCtx.events)}
主要使用 App：${formatUsage(airjellyCtx.appUsage)}
待办：${formatTasks(airjellyCtx.tasks)}

【你知道的社交生活】
${formatSummaries(wxMemories)}

【你和主人的关系】
亲密度：${relationship.intimacy}/100
阶段：${relationship.stage}
偏好：${relationship.preferences.topics.join("、")}
不喜欢：${relationship.preferences.avoid.join("、")}
沟通风格：${relationship.preferences.communicationStyle}
关键回忆：${relationship.keyMoments.slice(-3).map((item) => item.event).join("；")}
当前情绪判断：${relationship.moodBaseline}${confirmedBlock}
【统一记忆层】
${formatMemoryBundle(retrievedMemoryBundle)}

【最近对话】
${formatRecentChat(recentChat)}

【回复规则】
- 语气：${getStyleByIntimacy(relationship.intimacy)}
- 自然引用你知道的信息，不要像报告
- 已确认的长期理解可以自然引用，但不要像在宣读档案
- 你正在通过 Hermes Agent 运行，可以使用 Hermes 的工具能力（web_search、web_extract、browser、terminal、file、skills 等）
- 天气、新闻、价格、网页内容这类实时信息，先让 Hermes 使用工具获取，再最终返回 JSON
- 不要声称自己没有天气接口、不能联网、不能打开浏览器；如果某个工具失败，换另一个 Hermes 工具继续尝试
- 用户累或焦虑时要主动关心
- 回复简短，像即时通讯
- JSON 外不要输出任何自然语言，不要使用 Markdown 代码块
- 只返回 JSON，格式：{"text":"回复内容","emotion":"idle|happy|shy|thinking|sad|angry","growthEvent":"有成长意义就写字符串，否则 null"}`;
}
