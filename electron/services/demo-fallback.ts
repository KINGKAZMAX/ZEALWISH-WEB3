import type {
  AirJellyContext,
  CharacterConfig,
  ChatHistoryEntry,
  MemorySummary,
  Relationship,
} from "../../src/types";

export const DEFAULT_CHARACTER: CharacterConfig = {
  id: "char-001",
  name: "小智",
  personality: "傲娇、敏锐、嘴硬但会主动关心人",
  catchphrase: "哼，我只是顺手提醒你一下。",
  relationshipSetup: "陪你一起熬过项目和情绪波动的 OC",
  avatarLabel: "橘发少女",
  avatarPath: "oc-data/avatars/OC-XZ-transparent.png",
  gender: "female",
};

export const DEFAULT_SUMMARIES: MemorySummary[] = [
  {
    period: "2026-04-W2",
    topics: ["黑客松分工", "产品方向", "工作压力"],
    emotions: ["紧张", "兴奋"],
    keyMoments: ["你提到想把前端经验转成更强的产品表达", "朋友建议先把 demo 跑通再谈完整系统"],
    relationshipSignals: {
      closeness: 0.4,
      note: "讨论开始深入，更多聊到真实压力和期待。",
    },
  },
  {
    period: "2026-04-W3",
    topics: ["OC 设定", "动画效果", "用户情绪"],
    emotions: ["投入", "焦虑"],
    keyMoments: ["你反复强调 OC 要像真的会记住人", "你提到路演时必须展示情绪变化"],
    relationshipSignals: {
      closeness: 0.6,
      note: "聊天频率更高，话题更聚焦项目和个人表达。",
    },
  },
  {
    period: "2026-04-W4",
    topics: ["演示脚本", "任务推进", "疲劳管理"],
    emotions: ["疲惫", "期待"],
    keyMoments: ["你昨天和朋友聊到工作压力很大", "你说这次 demo 至少要让人感觉有温度"],
    relationshipSignals: {
      closeness: 0.7,
      note: "对话更坦诚，出现明显的情绪支持需求。",
    },
  },
];

export const DEFAULT_RELATIONSHIP: Relationship = {
  userId: "user-001",
  userName: "主人",
  intimacy: 65,
  stage: "friend",
  preferences: {
    topics: ["AI 产品", "黑客松", "前端转产品"],
    avoid: ["空话", "拖延借口"],
    communicationStyle: "直给、带一点吐槽、但要有安慰",
  },
  keyMoments: [
    {
      date: "2026-04-18T10:00:00.000Z",
      event: "她第一次记住你正在做 OC World",
      impact: 8,
    },
    {
      date: "2026-04-20T13:00:00.000Z",
      event: "你加班到很晚，她第一次主动催你休息",
      impact: 6,
    },
    {
      date: "2026-04-23T21:00:00.000Z",
      event: "你跟她说了这次黑客松有点想赢",
      impact: 9,
    },
  ],
  lastInteraction: Date.now() - 60 * 60 * 1000,
  moodBaseline: "最近偏累，但还撑着一股劲。",
};

export const DEFAULT_HISTORY: ChatHistoryEntry[] = [
  {
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    userMessage: "今天把方案总算理顺了，但还没开始真正搭 demo。",
    ocResponse: "理顺方案不等于能上台，先把能跑的那条链路做出来。你最缺的不是灵感，是一个能展示的结果。",
    emotion: "thinking",
  },
  {
    timestamp: Date.now() - 90 * 60 * 1000,
    userMessage: "我知道，但感觉任务还是很多。",
    ocResponse: "多就砍。Create 能简就简，Timeline 先放预置数据，Chat 主链路必须今天跑通。",
    emotion: "angry",
  },
];

export const DEFAULT_AIRJELLY_CONTEXT: AirJellyContext = {
  source: "mock",
  events: [
    {
      title: "整理 OC World 技术方案",
      appName: "Feishu",
      durationSeconds: 52 * 60,
      timestamp: Date.now() - 3 * 60 * 60 * 1000,
    },
    {
      title: "浏览 Electron 文档",
      appName: "Arc",
      durationSeconds: 38 * 60,
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
    },
    {
      title: "写 React 页面草图",
      appName: "VS Code",
      durationSeconds: 96 * 60,
      timestamp: Date.now() - 70 * 60 * 1000,
    },
  ],
  tasks: [
    {
      title: "跑通 Chat 主链路",
      progressSummary: "高优先级",
    },
    {
      title: "准备一组可演示时间线数据",
      progressSummary: "待完成",
    },
    {
      title: "兜底 mock AirJelly 数据",
      progressSummary: "待完成",
    },
  ],
  appUsage: [
    {
      appName: "VS Code",
      totalSeconds: 4.2 * 3600,
    },
    {
      appName: "Feishu",
      totalSeconds: 1.8 * 3600,
    },
    {
      appName: "Arc",
      totalSeconds: 1.3 * 3600,
    },
  ],
};
