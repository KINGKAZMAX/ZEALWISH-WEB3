# OC World Backend Interface

面向外部前端与 Agent 的接入文档。本文档基于当前代码实现整理，真实接口入口来自 Electron 主进程和 preload 暴露的 `window.ocWorld` 对象。

## 1. 接入边界

OC World 当前不是传统 HTTP REST 后端。后端能力运行在 Electron main process 中，通过 `electron/preload.ts` 暴露给 renderer：

```ts
window.ocWorld
```

因此外部前端有两种接入方式：

1. 推荐方式：把外部前端作为 OC World Electron 窗口中的 renderer 加载，直接调用 `window.ocWorld.*`。
2. 浏览器独立运行方式：当前仓库还没有 HTTP 网关。若对方前端必须在普通浏览器里独立访问，需要先由我们补一个 REST/WebSocket Gateway，再按 Gateway 文档接入。

不要让外部前端直接调用大模型、TTS、ASR、Marswave、AirJelly 等第三方服务。API key 保留在 OC World 后端 `.env` 中，前端只调用本文档中的本地桥接接口。

## 2. 快速接入

### 2.1 运行 OC World 后端壳

在 OC World 仓库中：

```bash
npm install
cp .env.example .env
npm run dev
```

如果外部前端已有本地开发服务，例如 `http://127.0.0.1:5174`，可以让 OC World Electron 加载这个 renderer：

```bash
OC_WORLD_RENDERER_URL=http://127.0.0.1:5174 npm run dev
```

也可以加载一个本地 HTML 文件：

```bash
OC_WORLD_RENDERER_FILE=/absolute/path/to/index.html npm run dev
```

### 2.2 前端侧最小调用

```ts
if (!window.ocWorld) {
  throw new Error("OC World backend bridge is not available");
}

const result = await window.ocWorld.chat.sendMessage({
  characterId: "char-001",
  userId: "user-001",
  userMessage: "你好，今天我想继续推进项目。",
});

console.log(result.text, result.emotion, result.intimacy, result.stage);
```

### 2.3 调用约定

- 所有 `window.ocWorld.*` 方法都是 Promise 接口，除 `asr.sendAudio` 外。
- 时间戳字段使用 JavaScript 毫秒时间戳，除 `GrowthMoment.date` 使用 ISO 字符串。
- 推荐默认用户 ID：`user-001`。
- 推荐默认角色 ID：`char-001`。
- 方法抛错时，前端应 `try/catch` 并展示可恢复状态。
- 当前 preload 只在 Electron renderer 中存在，普通浏览器页面直接打开不会有 `window.ocWorld`。

## 3. 能力总览

| 能力 | 前端方法 | IPC 通道 | 用途 |
|---|---|---|---|
| 聊天 | `chat.sendMessage` | `chat:send-message` | 向 OC 发消息，返回 OC 回复，并更新关系与历史 |
| 取消聊天 | `chat.cancelActive` | `chat:cancel-active` | 取消当前用户与角色的活跃聊天请求 |
| 开场问候 | `chat.getGreeting` | `chat:get-greeting` | 根据角色、关系、上下文生成一句欢迎语 |
| 语音合成 | `tts.synthesize` | `tts:synthesize` | 后端调用豆包/火山 TTS，返回 base64 音频 |
| 取消语音合成 | `tts.cancelActive` | `tts:cancel-active` | 取消指定或全部活跃 TTS 请求 |
| TTS 状态 | `tts.getStatus` | `tts:get-status` | 查询 TTS 是否配置、当前 voice、最近错误 |
| 语音识别开始 | `asr.start` | `asr:start` | 创建火山 ASR WebSocket 会话 |
| 语音识别音频流 | `asr.sendAudio` | `asr:audio` | 发送 PCM 音频块 |
| 语音识别结束 | `asr.stop` | `asr:stop` | 发送最终帧并结束 ASR 会话 |
| ASR 状态 | `asr.getStatus` | `asr:get-status` | 查询 ASR 配置与最近错误 |
| ASR 结果事件 | `asr.onTranscript` | `asr:transcript` | 监听识别文本 |
| ASR 错误事件 | `asr.onError` | `asr:error` | 监听识别错误 |
| 角色读取 | `character.getCurrent` | `character:get-current` | 读取角色配置 |
| 角色保存 | `character.saveCurrent` | `character:save-current` | 保存角色配置 |
| 时间线 | `timeline.list` | `timeline:list` | 读取成长/亲密度时间线 |
| 关系读取 | `relationship.get` | `relationship:get` | 读取用户与 OC 的关系状态 |
| 关系保存 | `relationship.save` | `relationship:save` | 覆盖保存关系状态 |
| Demo 亲密度 | `relationship.setIntimacyForDemo` | `relationship:set-intimacy-for-demo` | 演示用，直接设置亲密度 |
| 记忆摘要 | `memory.summaries` | `memory:summaries` | 读取近期微信/生活记忆摘要 |
| 聊天历史 | `memory.history` | `memory:history` | 读取近期 OC 聊天历史 |
| AirJelly 上下文 | `airjelly.getContext` | `airjelly:get-context` | 读取近期 app、任务、事件上下文 |
| Hermes 状态 | `hermes.getStatus` | `hermes:get-status` | 查询本地 Hermes Agent 状态 |
| Hermes 事件 | `hermes.onStatusChanged` | `hermes:status-changed` | 监听 Hermes 状态变化 |
| 图像生成 | `imageGen.generate` | `image-gen:generate` | 调 Marswave 生成头像/图片并缓存 |

## 4. TypeScript 类型

外部前端可直接复制这组类型作为接入契约。

```ts
export type Emotion = "idle" | "happy" | "shy" | "thinking" | "sad" | "angry";

export interface AppEvent {
  title: string;
  appName: string;
  durationSeconds: number;
  timestamp: number;
}

export interface TaskSummary {
  title: string;
  progressSummary: string;
  dueDate?: number;
}

export interface AppUsage {
  appName: string;
  totalSeconds: number;
}

export interface AirJellyContext {
  events: AppEvent[];
  tasks: TaskSummary[];
  appUsage: AppUsage[];
  source: "mock" | "airjelly";
}

export interface MemorySummary {
  period: string;
  topics: string[];
  emotions: string[];
  keyMoments: string[];
  relationshipSignals: {
    closeness: number;
    note: string;
  };
}

export interface GrowthMoment {
  date: string;
  event: string;
  impact: number;
}

export type RelationshipStage =
  | "stranger"
  | "acquaintance"
  | "friend"
  | "close_friend"
  | "soulmate";

export interface Relationship {
  userId: string;
  userName: string;
  intimacy: number;
  stage: RelationshipStage;
  preferences: {
    topics: string[];
    avoid: string[];
    communicationStyle: string;
  };
  keyMoments: GrowthMoment[];
  lastInteraction: number;
  moodBaseline: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  personality: string;
  catchphrase: string;
  relationshipSetup: string;
  avatarLabel: string;
  avatarPath?: string;
}

export interface ChatHistoryEntry {
  timestamp: number;
  userMessage: string;
  ocResponse: string;
  emotion: Emotion;
}

export interface ChatSendPayload {
  characterId: string;
  userId: string;
  userMessage: string;
  userMessages?: string[];
  requestId?: string;
  interrupt?: boolean;
}

export interface ChatCancelPayload {
  characterId: string;
  userId: string;
}

export interface ChatResponse {
  text: string;
  emotion: Emotion;
  growthEvent: string | null;
}

export interface ChatResult extends ChatResponse {
  intimacy: number;
  stage: RelationshipStage;
  source: AirJellyContext["source"];
}

export interface TtsSynthesizePayload {
  text: string;
  requestId?: string;
  userId?: string;
  interrupt?: boolean;
}

export interface TtsCancelPayload {
  requestId?: string;
}

export interface TtsSynthesizeResult {
  provider: "doubao";
  requestId: string;
  audioBase64: string;
  mimeType: string;
  encoding: string;
  durationMs: number | null;
}

export interface TtsProviderStatus {
  provider: "browser" | "doubao";
  configured: boolean;
  voiceType: string | null;
  lastError: string | null;
}

export interface AsrStartPayload {
  sessionId: string;
  userId?: string;
  language?: string;
}

export interface AsrAudioPayload {
  sessionId: string;
  audio: ArrayBuffer;
}

export interface AsrStopPayload {
  sessionId: string;
}

export interface AsrTranscriptEvent {
  sessionId: string;
  text: string;
  isFinal: boolean;
}

export interface AsrErrorEvent {
  sessionId: string;
  message: string;
}

export interface AsrProviderStatus {
  provider: "volcengine";
  configured: boolean;
  resourceId: string | null;
  lastError: string | null;
}

export type HermesRuntimeState =
  | "disabled"
  | "starting"
  | "healthy"
  | "unhealthy"
  | "crashed"
  | "stopped";

export interface HermesRuntimeStatus {
  state: HermesRuntimeState;
  pid: number | null;
  restartCount: number;
  lastError: string | null;
  lastStartedAt: number | null;
  lastHealthCheckAt: number | null;
}

export interface TimelineItem extends GrowthMoment {
  intimacyAfter: number;
}

export interface ImageGenPayload {
  prompt: string;
  provider?: string;
  model?: string;
  aspectRatio?: string;
  imageSize?: string;
  imageConfig?: {
    aspectRatio?: string;
    imageSize?: string;
  };
  cacheKey?: string;
  force?: boolean;
}

export interface ImageGenResult {
  imageBase64: string;
  mimeType: string;
  savedPath?: string;
  cached?: boolean;
}

declare global {
  interface Window {
    ocWorld?: {
      chat: {
        sendMessage(payload: ChatSendPayload): Promise<ChatResult>;
        cancelActive(payload: ChatCancelPayload): Promise<boolean>;
        getGreeting(payload: { characterId: string; userId: string }): Promise<ChatResponse>;
      };
      tts: {
        synthesize(payload: TtsSynthesizePayload): Promise<TtsSynthesizeResult>;
        cancelActive(payload?: TtsCancelPayload): Promise<boolean>;
        getStatus(): Promise<TtsProviderStatus>;
      };
      asr: {
        start(payload: AsrStartPayload): Promise<AsrProviderStatus>;
        sendAudio(payload: AsrAudioPayload): void;
        stop(payload: AsrStopPayload): Promise<boolean>;
        getStatus(): Promise<AsrProviderStatus>;
        onTranscript(callback: (event: AsrTranscriptEvent) => void): () => void;
        onError(callback: (event: AsrErrorEvent) => void): () => void;
      };
      character: {
        getCurrent(characterId: string): Promise<CharacterConfig>;
        saveCurrent(payload: { characterId: string; character: CharacterConfig }): Promise<CharacterConfig>;
      };
      timeline: {
        list(userId: string): Promise<TimelineItem[]>;
      };
      relationship: {
        get(userId: string): Promise<Relationship>;
        save(payload: { userId: string; relationship: Relationship }): Promise<Relationship>;
        setIntimacyForDemo(payload: { userId: string; intimacy: number }): Promise<Relationship>;
      };
      memory: {
        summaries(userId: string): Promise<MemorySummary[]>;
        history(userId: string): Promise<ChatHistoryEntry[]>;
      };
      airjelly: {
        getContext(): Promise<AirJellyContext>;
      };
      hermes: {
        getStatus(): Promise<HermesRuntimeStatus>;
        onStatusChanged(callback: (status: HermesRuntimeStatus) => void): () => void;
      };
      imageGen: {
        generate(payload: ImageGenPayload): Promise<ImageGenResult>;
      };
    };
  }
}
```

## 5. 逐接口说明

### 5.1 Chat

#### `window.ocWorld.chat.sendMessage(payload)`

向指定角色发送用户消息，返回 OC 回复。该接口会读取 AirJelly 上下文、近期记忆、聊天历史、关系状态和角色配置，构建 prompt 后调用 LLM；成功后会写入聊天历史并更新关系亲密度。

请求：

```ts
{
  characterId: "char-001",
  userId: "user-001",
  userMessage: "今天我有点累，但还想把 demo 跑通。",
  userMessages?: ["第一段消息", "第二段消息"],
  requestId?: "client-generated-id",
  interrupt?: true
}
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---:|---|
| `characterId` | 是 | 角色 ID，对应 `oc-data/characters/{characterId}.json` |
| `userId` | 是 | 用户 ID，对应关系、记忆、历史文件 |
| `userMessage` | 是 | 用户当前输入 |
| `userMessages` | 否 | 多段输入。存在且非空时会替代 `userMessage`，用换行合并 |
| `requestId` | 否 | 前端自定义请求 ID，当前后端不强依赖 |
| `interrupt` | 否 | 默认等同 `true`。新请求会取消同一 `userId:characterId` 的上一个请求 |

返回：

```ts
{
  text: "看得出来你已经绷很久了。先把最能演示的那条链路跑通。",
  emotion: "sad",
  growthEvent: "她注意到你已经在强撑，开始主动提醒你别把自己压垮。",
  intimacy: 72,
  stage: "friend",
  source: "airjelly"
}
```

注意：

- `emotion` 只会是 `"idle" | "happy" | "shy" | "thinking" | "sad" | "angry"`。
- `source` 表示上下文来源，可能是 `airjelly` 或 `mock`。
- LLM provider 失败时，当前实现会尽量返回 mock 兜底回复，而不是直接把 provider 错误抛给前端。
- 取消请求时，底层可能抛出 `AbortError`。

#### `window.ocWorld.chat.cancelActive(payload)`

取消某个用户与角色的活跃聊天请求。

请求：

```ts
{
  userId: "user-001",
  characterId: "char-001"
}
```

返回：

```ts
true
```

`true` 表示确实取消了一个活跃请求，`false` 表示没有找到活跃请求。

#### `window.ocWorld.chat.getGreeting(payload)`

生成应用打开时的主动欢迎语。不写入聊天历史，也不更新关系状态。

请求：

```ts
{
  userId: "user-001",
  characterId: "char-001"
}
```

返回：

```ts
{
  text: "在。今天先别散，直接把最重要的那条链路跑通。",
  emotion: "thinking",
  growthEvent: null
}
```

### 5.2 TTS

#### `window.ocWorld.tts.getStatus()`

查询 TTS 配置状态。

返回：

```ts
{
  provider: "doubao",
  configured: true,
  voiceType: "zh_female_xiaohe_uranus_bigtts",
  lastError: null
}
```

如果返回：

```ts
{
  provider: "browser",
  configured: true,
  voiceType: null,
  lastError: null
}
```

表示后端不走豆包 TTS，前端应该使用浏览器 `speechSynthesis` 自行播放。当前 `tts.synthesize` 只有在豆包/火山 TTS 配好时才可用。

#### `window.ocWorld.tts.synthesize(payload)`

将文本合成为音频，返回 base64 音频数据。

请求：

```ts
{
  text: "别停，先把能演示的链路跑通。",
  requestId: "tts-001",
  userId: "user-001",
  interrupt: true
}
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---:|---|
| `text` | 是 | 要合成的文本，不能为空 |
| `requestId` | 否 | 前端请求 ID。不传则后端生成 |
| `userId` | 否 | TTS 服务侧用户标识，不传用 `oc-world` |
| `interrupt` | 否 | 默认等同 `true`。新 TTS 请求会取消当前所有活跃 TTS |

返回：

```ts
{
  provider: "doubao",
  requestId: "tts-001",
  audioBase64: "base64-audio-data",
  mimeType: "audio/mpeg",
  encoding: "mp3",
  durationMs: 1800
}
```

前端播放示例：

```ts
const audioResult = await window.ocWorld.tts.synthesize({ text: "你好" });
const audio = new Audio(`data:${audioResult.mimeType};base64,${audioResult.audioBase64}`);
await audio.play();
```

可能错误：

- `TTS text is empty`
- `Doubao TTS is not configured`
- `Doubao TTS HTTP {status}: ...`
- `Doubao TTS 2.0 HTTP {status}: ...`
- `Doubao TTS response did not include audio data`

#### `window.ocWorld.tts.cancelActive(payload?)`

取消 TTS 请求。

```ts
await window.ocWorld.tts.cancelActive({ requestId: "tts-001" });
await window.ocWorld.tts.cancelActive(); // 取消全部活跃 TTS
```

返回 `boolean`。

### 5.3 ASR

ASR 使用火山引擎流式语音识别。前端负责采集麦克风并发送音频块，后端负责 WebSocket 协议和鉴权。

#### `window.ocWorld.asr.getStatus()`

返回：

```ts
{
  provider: "volcengine",
  configured: true,
  resourceId: "volc.seedasr.sauc.duration",
  lastError: null
}
```

#### `window.ocWorld.asr.start(payload)`

创建一个 ASR 会话。

请求：

```ts
{
  sessionId: "asr-session-001",
  userId: "user-001",
  language: "zh-CN"
}
```

返回当前 ASR 状态：

```ts
{
  provider: "volcengine",
  configured: true,
  resourceId: "volc.seedasr.sauc.duration",
  lastError: null
}
```

音频要求：

- `asr.sendAudio` 传入 `ArrayBuffer`。
- 后端向火山声明的格式是 raw PCM，16 kHz，16-bit，mono。
- 前端从麦克风拿到 Float32 PCM 时，需要转换为 16 kHz Int16 mono PCM 后再发送。

#### `window.ocWorld.asr.sendAudio(payload)`

发送音频块。该方法不返回 Promise。

```ts
window.ocWorld.asr.sendAudio({
  sessionId: "asr-session-001",
  audio: pcmArrayBuffer,
});
```

#### `window.ocWorld.asr.onTranscript(callback)`

监听识别结果。返回取消监听函数。

```ts
const offTranscript = window.ocWorld.asr.onTranscript((event) => {
  if (event.sessionId !== "asr-session-001") return;
  console.log(event.text, event.isFinal);
});
```

事件：

```ts
{
  sessionId: "asr-session-001",
  text: "我今天想继续推进项目",
  isFinal: true
}
```

#### `window.ocWorld.asr.onError(callback)`

监听 ASR 错误。返回取消监听函数。

```ts
const offError = window.ocWorld.asr.onError((event) => {
  console.error(event.sessionId, event.message);
});
```

#### `window.ocWorld.asr.stop(payload)`

结束 ASR 会话。

```ts
const stopped = await window.ocWorld.asr.stop({
  sessionId: "asr-session-001",
});
```

返回 `boolean`。`true` 表示找到并结束了会话，`false` 表示没有对应活跃会话。

### 5.4 Character

#### `window.ocWorld.character.getCurrent(characterId)`

读取角色配置。如果本地文件不存在，会返回默认角色配置。

```ts
const character = await window.ocWorld.character.getCurrent("char-001");
```

返回：

```ts
{
  id: "char-001",
  name: "小橘",
  personality: "傲娇、敏锐、嘴硬但会主动关心人",
  catchphrase: "哼，我只是顺手提醒你一下。",
  relationshipSetup: "陪你一起熬过项目和情绪波动的 OC",
  avatarLabel: "橘发少女",
  avatarPath: "/absolute/path/to/avatar.png"
}
```

#### `window.ocWorld.character.saveCurrent(payload)`

保存角色配置到 `oc-data/characters/{characterId}.json`。

```ts
const saved = await window.ocWorld.character.saveCurrent({
  characterId: "char-001",
  character: {
    id: "char-001",
    name: "小橘",
    personality: "傲娇、敏锐、嘴硬但会主动关心人",
    catchphrase: "哼，我只是顺手提醒你一下。",
    relationshipSetup: "陪你一起熬过项目和情绪波动的 OC",
    avatarLabel: "橘发少女",
    avatarPath: "/absolute/path/to/avatar.png",
  },
});
```

注意：`characterId` 和 `character.id` 建议保持一致。

### 5.5 Relationship

#### `window.ocWorld.relationship.get(userId)`

读取关系状态。如果本地文件不存在，会返回默认关系状态，并把 `userId` 设置为请求值。

```ts
const relationship = await window.ocWorld.relationship.get("user-001");
```

#### `window.ocWorld.relationship.save(payload)`

覆盖保存关系状态到 `oc-data/relationships/{userId}.json`。

```ts
const next = await window.ocWorld.relationship.save({
  userId: "user-001",
  relationship: {
    userId: "user-001",
    userName: "小智",
    intimacy: 65,
    stage: "friend",
    preferences: {
      topics: ["AI 产品", "黑客松"],
      avoid: ["空话"],
      communicationStyle: "直给，但要有安慰",
    },
    keyMoments: [],
    lastInteraction: Date.now(),
    moodBaseline: "最近偏累，但还撑着一股劲。",
  },
});
```

#### `window.ocWorld.relationship.setIntimacyForDemo(payload)`

演示用接口，直接设置亲密度并自动计算阶段。

```ts
const next = await window.ocWorld.relationship.setIntimacyForDemo({
  userId: "user-001",
  intimacy: 80,
});
```

亲密度会被限制在 `0` 到 `100`。

阶段映射由后端 `relationship.ts` 计算，前端不要自己硬编码为最终业务规则。

### 5.6 Timeline

#### `window.ocWorld.timeline.list(userId)`

读取成长时间线。当前实现从 `relationship.keyMoments` 派生，不是单独的数据表。

```ts
const timeline = await window.ocWorld.timeline.list("user-001");
```

返回：

```ts
[
  {
    date: "2026-04-18T10:00:00.000Z",
    event: "她第一次记住你正在做 OC World",
    impact: 8,
    intimacyAfter: 8
  }
]
```

### 5.7 Memory

#### `window.ocWorld.memory.summaries(userId)`

读取最近 10 条记忆摘要。

数据来源：

```text
oc-data/memories/wechat/{userId}_summaries.json
```

调用：

```ts
const summaries = await window.ocWorld.memory.summaries("user-001");
```

#### `window.ocWorld.memory.history(userId)`

读取最近 20 条 OC 聊天历史。

数据来源：

```text
oc-data/memories/oc_conversations/{userId}_history.json
```

调用：

```ts
const history = await window.ocWorld.memory.history("user-001");
```

### 5.8 AirJelly

#### `window.ocWorld.airjelly.getContext()`

读取最近生活上下文，包括事件、待办和应用使用情况。

```ts
const context = await window.ocWorld.airjelly.getContext();
```

返回：

```ts
{
  source: "airjelly",
  events: [
    {
      title: "整理 OC World 技术方案",
      appName: "Feishu",
      durationSeconds: 3120,
      timestamp: 1770000000000
    }
  ],
  tasks: [
    {
      title: "跑通 Chat 主链路",
      progressSummary: "高优先级",
      dueDate: 1770000000000
    }
  ],
  appUsage: [
    {
      appName: "VS Code",
      totalSeconds: 15120
    }
  ]
}
```

注意：

- 结果缓存 5 分钟。
- 如果 AirJelly SDK 不可用或读取失败，会 fallback 到 `oc-data/mock/airjelly-context.json` 或内置 mock 数据。
- `source` 为 `mock` 时，前端可以提示“正在使用演示上下文”。

### 5.9 Hermes

#### `window.ocWorld.hermes.getStatus()`

查询本地 Hermes Agent 运行状态。

```ts
const status = await window.ocWorld.hermes.getStatus();
```

返回：

```ts
{
  state: "healthy",
  pid: 12345,
  restartCount: 0,
  lastError: null,
  lastStartedAt: 1770000000000,
  lastHealthCheckAt: 1770000005000
}
```

状态值：

| 状态 | 含义 |
|---|---|
| `disabled` | 配置禁用了 Hermes 自动启动 |
| `starting` | 正在启动 |
| `healthy` | 已启动且健康检查通过 |
| `unhealthy` | 进程存在但健康检查失败 |
| `crashed` | 进程异常退出 |
| `stopped` | 未运行 |

#### `window.ocWorld.hermes.onStatusChanged(callback)`

监听 Hermes 状态变化。返回取消监听函数。

```ts
const offHermes = window.ocWorld.hermes.onStatusChanged((status) => {
  console.log(status.state, status.lastError);
});
```

### 5.10 Image Generation

#### `window.ocWorld.imageGen.generate(payload)`

调用 Marswave 图像生成接口，生成图片并缓存到本地头像目录。

请求：

```ts
{
  prompt: "anime style orange hair OC avatar, warm expression",
  aspectRatio: "1:1",
  imageSize: "1K",
  cacheKey: "char-001-avatar-v1",
  force: false
}
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---:|---|
| `prompt` | 是 | 生成提示词 |
| `provider` | 否 | 当前实现会固定发给 Marswave 的 `openai` provider |
| `model` | 否 | 当前实现会固定使用 `gpt-image-2` |
| `aspectRatio` | 否 | 默认 `1:1` |
| `imageSize` | 否 | 默认 `1K` |
| `imageConfig` | 否 | 可覆盖 `aspectRatio` / `imageSize` |
| `cacheKey` | 否 | 自定义缓存 key，会清理为安全文件名 |
| `force` | 否 | 默认 `false`。为 `true` 时跳过缓存重新生成 |

返回：

```ts
{
  imageBase64: "base64-image-data",
  mimeType: "image/png",
  savedPath: "/absolute/path/to/oc-world/oc-data/avatars/char-001-char-001-avatar-v1.png",
  cached: false
}
```

注意：

- 当前 API 没有暴露 `characterId` 参数，后端默认按 `char-001` 缓存。
- 成功后会写入两个文件：一个 cache 文件，以及 `oc-data/avatars/char-001.{ext}`。
- 如果没有 `MARSWAVE_API_KEY`，会抛出 `MARSWAVE_API_KEY not configured`。
- 前端展示可直接使用 `data:${mimeType};base64,${imageBase64}`。

## 6. 数据持久化

当前数据都写在项目工作目录下的 `oc-data`：

| 数据 | 路径 |
|---|---|
| 角色配置 | `oc-data/characters/{characterId}.json` |
| 关系状态 | `oc-data/relationships/{userId}.json` |
| OC 聊天历史 | `oc-data/memories/oc_conversations/{userId}_history.json` |
| 微信/生活摘要 | `oc-data/memories/wechat/{userId}_summaries.json` |
| AirJelly mock 上下文 | `oc-data/mock/airjelly-context.json` |
| 生成头像/图片 | `oc-data/avatars/` |

前端不应该直接读写这些文件，统一走 `window.ocWorld` API。

## 7. 环境变量

关键环境变量来自 `.env` 或 `OC_WORLD_ENV_FILE` 指定的文件。

### 7.1 Chat / LLM

| 变量 | 示例 | 说明 |
|---|---|---|
| `OC_CHAT_PROVIDER` | `hermes` | 可选 `hermes`、`legacy`、`siliconflow`；默认 `hermes` |
| `HERMES_BASE_URL` | `http://127.0.0.1:8642` | Hermes OpenAI-compatible 地址 |
| `HERMES_MODEL` | `glm-5.1` | Hermes 使用的模型名 |
| `HERMES_API_KEY` | `oc-world-local-key` | Hermes 本地 API key |
| `ANTHROPIC_AUTH_TOKEN` |  | `legacy` provider 的鉴权 |
| `ANTHROPIC_BASE_URL` | `https://open.bigmodel.cn/api/anthropic` | Claude-compatible endpoint |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | `glm-5.1` | legacy 模型 |
| `SILICONFLOW_API_KEY` |  | SiliconFlow 鉴权 |
| `SILICONFLOW_BASE_URL` | `https://api.siliconflow.cn/v1` | SiliconFlow OpenAI-compatible 地址 |
| `SILICONFLOW_MODEL` | `deepseek-ai/DeepSeek-V4-Flash` | SiliconFlow 模型 |
| `OC_DEMO_FORCE_MOCK_LLM` | `0` | 设为 `1` 时强制使用 mock 回复 |

### 7.2 Hermes Runtime

| 变量 | 示例 | 说明 |
|---|---|---|
| `HERMES_AUTOSTART` | `1` | 是否随 Electron 自动启动 Hermes |
| `HERMES_RUNTIME_INSTALL` | `1` | 是否准备/安装 bundled runtime |
| `HERMES_EXECUTABLE_PATH` |  | 显式指定 Hermes 可执行文件 |
| `HERMES_EXECUTABLE_ARGS_JSON` | `["gateway","run","--replace"]` | 自定义启动参数 |
| `HERMES_HEALTH_PATH` | `/health` | 健康检查路径 |
| `HERMES_HEALTH_INTERVAL_MS` | `5000` | 健康检查间隔 |
| `HERMES_HEALTH_FAILURE_THRESHOLD` | `3` | 连续失败阈值 |
| `HERMES_RESTART_BASE_DELAY_MS` | `1000` | 重启基础延迟 |
| `HERMES_RESTART_MAX_DELAY_MS` | `30000` | 重启最大延迟 |
| `HERMES_STOP_TIMEOUT_MS` | `5000` | 停止超时 |

### 7.3 TTS

| 变量 | 示例 | 说明 |
|---|---|---|
| `OC_TTS_PROVIDER` | `doubao2` | 可选 `browser`、`doubao`、`doubao2`、`volcengine`、`volcengine2` |
| `DOUBAO_TTS_APP_ID` |  | 豆包/火山 TTS app id |
| `DOUBAO_TTS_ACCESS_TOKEN` |  | 豆包/火山 TTS access token |
| `DOUBAO_TTS_RESOURCE_ID` | `seed-tts-2.0` | TTS 2.0 resource id |
| `DOUBAO_TTS_V2_ENDPOINT` | `https://openspeech.bytedance.com/api/v3/tts/unidirectional` | TTS 2.0 endpoint |
| `DOUBAO_TTS_SPEAKER` | `zh_female_xiaohe_uranus_bigtts` | TTS 2.0 speaker |
| `DOUBAO_TTS_ENCODING` | `mp3` | 返回音频编码 |
| `DOUBAO_TTS_RATE` | `24000` | 采样率 |
| `DOUBAO_TTS_SPEED_RATIO` | `0.96` | 语速 |
| `DOUBAO_TTS_VOLUME_RATIO` | `1` | 音量 |
| `DOUBAO_TTS_PITCH_RATIO` | `1` | 音高 |

兼容变量：`VOLCENGINE_TTS_*` 也会被读取。

### 7.4 ASR

| 变量 | 示例 | 说明 |
|---|---|---|
| `VOLCENGINE_ASR_APP_ID` |  | ASR app id / app key |
| `VOLCENGINE_ASR_ACCESS_TOKEN` |  | ASR access token / access key |
| `VOLCENGINE_ASR_RESOURCE_ID` | `volc.seedasr.sauc.duration` | ASR resource id |
| `VOLCENGINE_ASR_ENDPOINT` | `wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async` | ASR WebSocket endpoint |
| `VOLCENGINE_ASR_LANGUAGE` | `zh-CN` | 默认识别语言 |

兼容变量：`DOUBAO_ASR_*` 也会被读取。

### 7.5 Image

| 变量 | 示例 | 说明 |
|---|---|---|
| `MARSWAVE_API_KEY` |  | Marswave 图像生成 key |

### 7.6 Renderer

| 变量 | 示例 | 说明 |
|---|---|---|
| `OC_WORLD_RENDERER_URL` | `http://127.0.0.1:5174` | 让 Electron 加载外部前端 URL |
| `OC_WORLD_RENDERER_FILE` | `/absolute/path/index.html` | 让 Electron 加载本地 HTML |
| `OC_WORLD_OPEN_DEVTOOLS` | `1` | 加载外部 renderer 时打开 DevTools |
| `OC_WORLD_ENV_FILE` | `/absolute/path/.env` | 指定 env 文件 |

## 8. 错误处理建议

前端统一按以下策略处理：

```ts
try {
  const result = await window.ocWorld.chat.sendMessage(payload);
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  // UI: 展示可恢复错误，允许重试/切换 browser fallback
}
```

建议：

- Chat：失败较少直接暴露，provider 异常通常会 fallback 到 mock 回复；但取消请求仍需处理。
- TTS：先调用 `tts.getStatus()`。如果 `provider === "browser"` 或 `configured === false`，前端走浏览器 `speechSynthesis`。
- ASR：先调用 `asr.getStatus()`。如果 `configured === false`，前端走浏览器 `SpeechRecognition` 或禁用语音输入。
- Image：没有 `MARSWAVE_API_KEY` 时直接不可用，前端应展示生成失败并允许用户跳过头像生成。
- Hermes：`state !== "healthy"` 不一定阻塞 Chat，因为 Chat 可能 fallback 到 legacy/siliconflow/mock；但 UI 应显示 Agent 世界不可用或启动中。

## 9. Agent 接入提示

给另一个 Agent 读本文档时，可以直接给它这段任务约束：

```text
你要接入 OC World 后端。当前后端不是 HTTP REST API，而是 Electron preload 暴露的 window.ocWorld。
你的前端必须运行在 OC World Electron renderer 里，或者让 OC World 通过 OC_WORLD_RENDERER_URL 加载你的本地前端。
不要直接调用第三方 LLM/TTS/ASR/Image 服务，不要把 API key 写进前端。
先检测 window.ocWorld 是否存在；不存在就提示需要在 OC World Electron 中运行。
优先接入 chat.sendMessage、relationship.get、character.getCurrent、memory.history、tts.getStatus、asr.getStatus。
TTS/ASR 如果后端未配置，要做浏览器 fallback。
所有调用都要 try/catch，所有事件监听都要保存 unsubscribe 并在组件卸载时调用。
```

## 10. 前端集成示例

### 10.1 React Hook 示例

```tsx
import { useEffect, useState } from "react";

export function useOcWorldChat(userId = "user-001", characterId = "char-001") {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "oc"; text: string }>>([]);

  async function send(text: string) {
    if (!window.ocWorld) {
      throw new Error("OC World backend bridge is not available");
    }

    setLoading(true);
    setMessages((items) => [...items, { role: "user", text }]);

    try {
      const result = await window.ocWorld.chat.sendMessage({
        userId,
        characterId,
        userMessage: text,
      });
      setMessages((items) => [...items, { role: "oc", text: result.text }]);
      return result;
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    if (!window.ocWorld) return false;
    return window.ocWorld.chat.cancelActive({ userId, characterId });
  }

  return { loading, messages, send, cancel };
}
```

### 10.2 初始化角色、关系、记忆

```ts
async function loadInitialOcState(userId = "user-001", characterId = "char-001") {
  if (!window.ocWorld) {
    throw new Error("OC World backend bridge is not available");
  }

  const [character, relationship, history, summaries, hermesStatus] = await Promise.all([
    window.ocWorld.character.getCurrent(characterId),
    window.ocWorld.relationship.get(userId),
    window.ocWorld.memory.history(userId),
    window.ocWorld.memory.summaries(userId),
    window.ocWorld.hermes.getStatus(),
  ]);

  return { character, relationship, history, summaries, hermesStatus };
}
```

### 10.3 ASR 生命周期

```ts
async function startAsr(sessionId: string) {
  if (!window.ocWorld) {
    throw new Error("OC World backend bridge is not available");
  }

  const offTranscript = window.ocWorld.asr.onTranscript((event) => {
    if (event.sessionId === sessionId) {
      console.log("ASR", event.text, event.isFinal);
    }
  });

  const offError = window.ocWorld.asr.onError((event) => {
    if (event.sessionId === sessionId) {
      console.error("ASR error", event.message);
    }
  });

  await window.ocWorld.asr.start({ sessionId, userId: "user-001", language: "zh-CN" });

  return async () => {
    await window.ocWorld?.asr.stop({ sessionId });
    offTranscript();
    offError();
  };
}
```

## 11. 当前限制

- 没有 HTTP REST API；外部普通网页不能直接跨进程调用这些能力。
- `imageGen.generate` 目前不能指定 `characterId`，默认缓存到 `char-001`。
- `memory.summaries`、`memory.history` 只读；没有暴露删除或批量写入接口。
- `timeline.list` 从关系关键事件派生，不是独立时间线存储。
- TTS 后端没有真正的 browser 合成接口；`provider: "browser"` 只是告诉前端应自己 fallback。
- ASR 音频编码转换由前端负责。
- Electron 会给加载的 renderer 注入 `window.ocWorld`，因此不要加载不可信远程页面。

## 12. 如果要改成 HTTP API

如果对方前端必须是独立浏览器或移动端，建议新增一个后端 Gateway，按下面映射实现。注意：这些 REST 路径当前还不存在，不能当作现有接口调用。

| 建议 REST 路径 | 对应现有能力 |
|---|---|
| `POST /api/chat/send` | `chat.sendMessage` |
| `POST /api/chat/cancel` | `chat.cancelActive` |
| `POST /api/chat/greeting` | `chat.getGreeting` |
| `GET /api/tts/status` | `tts.getStatus` |
| `POST /api/tts/synthesize` | `tts.synthesize` |
| `POST /api/tts/cancel` | `tts.cancelActive` |
| `GET /api/asr/status` | `asr.getStatus` |
| `WS /api/asr/sessions/{sessionId}` | `asr.start` + `asr.sendAudio` + `asr.onTranscript` |
| `GET /api/characters/{characterId}` | `character.getCurrent` |
| `PUT /api/characters/{characterId}` | `character.saveCurrent` |
| `GET /api/users/{userId}/relationship` | `relationship.get` |
| `PUT /api/users/{userId}/relationship` | `relationship.save` |
| `GET /api/users/{userId}/timeline` | `timeline.list` |
| `GET /api/users/{userId}/memory/summaries` | `memory.summaries` |
| `GET /api/users/{userId}/memory/history` | `memory.history` |
| `GET /api/airjelly/context` | `airjelly.getContext` |
| `GET /api/hermes/status` | `hermes.getStatus` |
| `POST /api/images/generate` | `imageGen.generate` |
