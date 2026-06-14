# OC World 记忆层与架构改造详细设计

> 适用仓库：`/Users/pika/ai-pika/06_元数据/工作区项目/oc-world`
> 
> 当前结论：**OC World 采用 Cola 方案做骨架，局部吸收 AirJelly 的上下文输入与后续 recall/task 能力。**
> 
> 关键依据：
> - 聊天主链：`electron/services/chat-engine.ts`
> - AirJelly 上下文接入：`electron/services/airjelly.ts`
> - Prompt 组装：`electron/services/prompt-builder.ts`
> - 现有本地记忆：`electron/services/memory.ts`
> - 类型定义：`src/types/index.ts`
> - IPC 边界：`electron/ipc.ts`

# 第1章 总体说明

## 1.1 项目背景

OC World 当前已经具备以下能力：

- Electron 桌面壳运行
- 基于 React + Electron 的前后端分层
- 聊天主链已经跑通
- 已接入 Hermes Runtime 作为执行层/工具层
- 已接入 AirJelly SDK 读取 `events / tasks / appUsage`
- 已接入微信摘要记忆、关系状态、角色设定、本地聊天历史
- 已接入语音、图片生成、ASR 等外围能力

现有链路的核心特点是：

1. **主入口是聊天，而不是桌面观察**
2. **AirJelly 当前只是上下文来源，不是系统骨架**
3. **记忆数据以 JSON 文件形式保存在 `oc-data/` 下**
4. **关系与社交记忆已开始存在，但没有统一记忆仓和蒸馏主链**

当前代码表现如下：

- `chat-engine.ts` 在每轮对话前并行加载：AirJelly 状态、微信摘要、最近聊天、关系状态、角色信息，然后构造 system prompt，再调用 LLM，最后回写关系和聊天记录。
- `airjelly.ts` 当前只拉取 AirJelly 的 `events / openTasks / dailyAppUsage`。
- `memory.ts` 当前只维护三类本地 JSON：微信摘要、OC 聊天历史、关系状态、角色配置。
- `prompt-builder.ts` 当前把上述状态以文本方式拼进 prompt，属于典型上下文拼接方案。

这意味着 OC World 现在更像：

**陪伴式聊天产品 + 多源上下文拼接**

它还不是：

**拥有统一 observation → memory → recall → task 的成长型 Agent OS**

这次改造的目标，不是把 OC World 直接改成 AirJelly 的复制品，而是让它在不打散现有产品链路的前提下，升级成：

**以 Cola 式记忆架构为骨架、逐步吸收 AirJelly 式观察输入与主动性能力的陪伴型成长 Agent。**

## 1.2 设计思路

本次改造采用三条原则：

### 原则一：先收拢记忆，再扩张能力

当前 `oc-data/` 下的记忆是分散的：

- `memories/wechat/*.json`
- `memories/oc_conversations/*.json`
- `relationships/*.json`
- `characters/*.json`
- `mock/airjelly-context.json`

这些数据能用，但不是统一记忆系统。

第一步必须先做统一记忆层，把关系、社交、对话、项目、角色偏好收拢到一套可持续演进的数据结构中。

### 原则二：保留聊天主入口，不把产品改散

当前 OC World 的价值表达是“搭档式陪伴”，不是纯桌面观察工具。

所以主入口仍然保持：

`用户对话 → 角色回应 → 关系变化 → 记忆更新`

而不是直接切成：

`桌面采集 → 自动理解 → 自动提醒 → 自动执行`

AirJelly 的观察链很强，但它更像操作系统层。OC World 当前还不适合直接用那套做主骨架。

### 原则三：AirJelly 只先吸收最值钱的两块

不是全盘照搬。

本次只吸收两块：

1. **结构化现实上下文输入**  
   把 AirJelly 的 `events / tasks / appUsage` 从“拼 prompt 的文本”升级成“统一 observation 输入源”。

2. **轻量 recall / task worthy 能力**  
   让系统开始识别“哪些事值得记住”“哪些信号值得提醒”“哪些状态值得升级成任务”。

不做的部分：

- 不直接复刻 AirJelly 的 screenshot pipeline
- 不直接引入 LanceDB
- 不直接做主动执行调度器
- 不直接做 case / procedure 提炼

本次改造聚焦在：

**统一记忆仓 + 记忆蒸馏 + 轻量 recall + 成长任务骨架**

---

# 第2章 需求项目清单

| 编号 | 需求项 | 来源 | 优先级 | 设计响应 |
| --- | --- | --- | --- | --- |
| R01 | 统一现有本地记忆结构 | 现有 `oc-data` 分散存储 | P0 | 3.3.1、3.5 |
| R02 | 保持现有聊天主链不被破坏 | 现有产品主入口 | P0 | 3.2.1、3.3.2 |
| R03 | 将 AirJelly 上下文从纯 prompt 文本升级为结构化 observation 输入 | 当前 `airjelly.ts` 过于轻量 | P0 | 3.2.2、3.3.3 |
| R04 | 引入 Cola 式长期记忆主文件与 voice 记忆 | 需要统一人格与关系记忆 | P0 | 3.3.1、3.5 |
| R05 | 引入 awareness 蒸馏中间层 | 需要把聊天/社交/上下文提炼成长期记忆 | P0 | 3.2.3、3.3.4 |
| R06 | 保留并升级 relationship 状态，而不是废弃 | 当前已有 intimacy/stage | P0 | 3.3.5、3.5 |
| R07 | 引入 work-item / project 结构，支撑成长型任务画像 | 现有系统没有统一工作画像层 | P1 | 3.2.4、3.3.6、3.5 |
| R08 | 增加轻量 recall 机制 | 希望从被动聊天走向适时提醒 | P1 | 3.2.5、3.3.7 |
| R09 | 增加 task-worthy 判定 | 从记忆走向任务成长 | P1 | 3.2.4、3.3.6 |
| R10 | 保证现有 IPC 与 UI 可以平滑兼容 | 当前 renderer 已依赖现有 IPC | P0 | 3.4、5 |
| R11 | 保证本地数据可迁移、可回滚 | 当前用户数据已存在 | P0 | 3.5、5 |
| R12 | 保持现有 Hermes / TTS / ASR / 图片生成功能不受影响 | 现有外围能力已可用 | P0 | 3.1、3.7、5 |
| R13 | 保留 mock / demo 能力 | 当前有 demo fallback | P1 | 3.3.3、3.7 |
| R14 | 后续可继续向 AirJelly 型成长 Agent 演进 | 产品长期目标 | P1 | 3.1、3.8、8 |

---

# 第3章 详细设计

## 3.1 总体架构/方案概览

本次改造后的 OC World 架构分为六层。

### 3.1.1 Desktop Shell 层

职责：

- Electron 启动
- Window 生命周期管理
- Preload 与 IPC 桥接
- 权限与本地资源加载

现有承载：

- `electron/main.ts`
- `electron/preload.ts`
- `electron/ipc.ts`

本层本次不做重构，只要求新增能力通过 IPC 暴露，不破坏现有窗口与启动顺序。

### 3.1.2 Chat Runtime 层

职责：

- 聊天请求调度
- 历史会话读取
- 系统 prompt 组装
- LLM 调用
- 回复回写
- 关系状态更新

现有承载：

- `electron/services/chat-engine.ts`
- `electron/services/llm.ts`
- `electron/services/prompt-builder.ts`

本层继续保留为主入口。

### 3.1.3 Context Intake 层

职责：

- 采集外部上下文来源
- 统一规范化为 observation
- 给聊天与记忆层同时消费

输入源包括：

- AirJelly SDK 上下文：`events / tasks / appUsage`
- 微信摘要：`memories/wechat/*.json`
- 最近对话历史：`memories/oc_conversations/*.json`
- 关系状态：`relationships/*.json`
- 角色设定：`characters/*.json`

本次改造后，这些输入不再是孤立读取，而是统一归并为一份 `ContextSnapshot`。

### 3.1.4 Memory Engine 层

职责：

- 维护长期结构化记忆
- 维护 voice 风格记忆
- 产出 awareness 蒸馏中间层
- 将 observation / conversation / relationship change 提炼成候选记忆

这是本次新增的核心层。

### 3.1.5 Growth / Work Layer

职责：

- 管理 work-item
- 聚合 project
- 从聊天与上下文中识别 task-worthy 事项
- 为后续 recall / proactive growth 留接口

这是从“会聊天”走向“陪你成长”的关键层。

### 3.1.6 Media / Tool Layer

职责：

- Hermes Runtime
- TTS
- ASR
- Image Gen

现有承载：

- `hermes-manager.ts`
- `tts.ts`
- `volcengine-asr.ts`
- `image-gen.ts`

本次不改主结构，只要求其异常不污染记忆链。

### 3.1.7 改造后主链

改造后的主链如下：

`用户消息 + ContextSnapshot → Chat Runtime → 回复 → 写入会话 → relationship update → distillation enqueue → awareness → long-term memory / voice / work-item / project`

可选的次链：

`AirJelly context refresh → observation normalization → recall evaluator → UI hint`

这条次链是本次预留，不做重度自动化执行。

---

## 3.2 业务流程

### 3.2.1 对话主流程

当前流程保留，但插入统一上下文与蒸馏步骤。

改造后流程：

1. Renderer 通过 IPC 发起 `chat:send-message`
2. Chat Runtime 读取用户输入
3. 读取 `ContextSnapshot`
4. 读取最近会话上下文
5. 读取 `memory.md / voice.md / relationship / relevant work-items`
6. 组装 system prompt
7. 调用 LLM
8. 返回结构化 JSON 回复
9. 写入聊天历史
10. 更新 relationship
11. 投递记忆蒸馏任务
12. 必要时产生 recall candidate / task-worthy candidate

与当前的区别：

- 现在是“多份数据并行读取后直接拼 prompt”
- 改造后是“先构造统一 snapshot，再由 prompt builder 使用”

### 3.2.2 上下文采集与规范化流程

本次新增 `ContextSnapshotBuilder`。

流程：

1. 从 `getAirJellyContext()` 读取桌面现实上下文
2. 从微信摘要文件读取社交记忆摘要
3. 从聊天历史读取近期互动
4. 从 relationship 读取当前关系状态
5. 从 character 读取角色设定
6. 对这些来源做规范化，形成统一结构：
   - realtimeContext
   - socialMemory
   - relationshipState
   - conversationState
   - characterState
7. 写入短期缓存，供当前轮对话与 recall 共用

### 3.2.3 记忆蒸馏流程

本次新增 Cola 式 `awareness` 层。

触发时机：

- 每轮对话完成后
- relationship 发生显著变化后
- 检测到高价值 AirJelly 上下文更新时
- 手动触发 daily distill 时

流程：

1. 收集当前轮消息、关联 snapshot、relationship delta
2. 生成一份 awareness episode
3. 产出四段结构：
   - Key Moments
   - Behavior Signals
   - Candidate Memory Updates
   - Open Threads
4. 将候选项分类：
   - 稳定事实 → `memory.md`
   - 沟通偏好 / 在意点 / 风格约束 → `voice.md`
   - 关系事件 → `relationship` 与 `timeline`
   - 成长型事项 → `work-items`
5. 若证据不足，保留在 `Open Threads`

### 3.2.4 成长任务流程

本次新增轻量 task-worthy 流程。

目的不是复制 AirJelly 的 task engine，而是先做成长任务骨架。

流程：

1. 从对话内容、growthEvent、AirJelly task、微信摘要里识别 task-worthy 信号
2. 若匹配已有 work-item，则更新其 summary / status / notes
3. 若不匹配，则创建新 work-item
4. 周期性按 work-item 聚合成 project
5. prompt 层只读取 relevant project/work-item 摘要，不直接扫全部历史

### 3.2.5 Recall 流程

本次只做轻量 recall，不做重度打扰。

流程：

1. 每次刷新 AirJelly context 时提取 signals：
   - appName
   - event title keywords
   - open task title
2. 滑动窗口确认连续重复出现的信号
3. 召回相关 memory / work-item / relationship key moment
4. 用规则判断是否值得提示
5. 若值得，则通过 IPC 推送轻量 UI 提示

V1 不做：

- 自动执行
- 浮动角色强打断
- 长链路 proactive workflow

---

## 3.3 模块设计

### 3.3.1 Unified Memory Repository

新增统一记忆仓，负责替代当前分散 JSON 的直接调用。

建议新目录：

```text
oc-data/
  memory/
    memory.md
    voice.md
    scopes/
      default/
        system-reminders.md
  awareness/
    episodes/
    notes/
  work-items/
  projects/
  memories/
    wechat/
    oc_conversations/
  relationships/
  characters/
  raw/
  mock/
```

说明：

- 保留当前 `memories/`、`relationships/`、`characters/` 不动
- 新增统一层 `memory/`、`awareness/`、`work-items/`、`projects/`
- 第一阶段采用“并存迁移”，不立即删除旧文件

职责：

- 读写 `memory.md`
- 读写 `voice.md`
- 读写 `system-reminders.md`
- 提供 memory patch merge

### 3.3.2 Chat Orchestrator 改造

改造 `chat-engine.ts`。

现状：

- 直接并行读取多个 source
- 直接拼 system prompt
- 直接回写 relationship 和 history

目标：

- 抽出 `buildContextSnapshot()`
- 抽出 `enqueueDistillation()`
- 抽出 `evaluateTaskWorthy()`

改造后职责：

- 只编排一轮 chat
- 不直接关心底层记忆落盘细节
- 通过 repository/service 调用完成写回

边界：

- `chat-engine.ts` 不负责记忆合并策略
- `chat-engine.ts` 不负责 project 聚合
- `chat-engine.ts` 不负责 recall 判断

### 3.3.3 Context Snapshot Builder

新增模块：`electron/services/context-snapshot.ts`

职责：

- 统一封装以下输入：
  - AirJellyContext
  - MemorySummary[]
  - ChatHistoryEntry[]
  - Relationship
  - CharacterConfig
- 输出单一快照对象

建议类型：

```ts
interface ContextSnapshot {
  builtAt: number;
  realtimeContext: {
    events: AppEvent[];
    tasks: TaskSummary[];
    appUsage: AppUsage[];
    source: "mock" | "airjelly";
  };
  socialMemory: MemorySummary[];
  conversationState: {
    recentChat: ChatHistoryEntry[];
  };
  relationshipState: Relationship;
  characterState: CharacterConfig;
}
```

价值：

- prompt builder 只消费 snapshot
- distiller 也消费同一份 snapshot
- recall evaluator 也消费同一份 snapshot

### 3.3.4 Distillation Engine

新增模块：

- `electron/services/distillation.ts`
- `electron/services/memory-merge.ts`

职责：

- 从对话与 snapshot 中提取 awareness
- 生成 candidate memory patches
- 合并到长期记忆

V1 蒸馏目标：

- 用户长期偏好
- 关系阶段特征
- 在意点 / 触发器 / 不喜欢的沟通方式
- 最近关键事件
- 成长中的项目/困扰/关注对象

V1 不做：

- case 抽取
- procedure 抽取
- 多实体图谱融合

### 3.3.5 Relationship State Adapter

当前 `relationship` 不能删，要保留并升级。

原因：

- 现有 UI 和 prompt 已直接依赖 `intimacy / stage / keyMoments / moodBaseline`
- 这是 OC World 作为“搭档”最核心的一层体验变量

改造思路：

- `relationship` 继续作为短中期互动状态
- `memory.md / voice.md` 作为更长期的认知层
- 两者职责分开：
  - relationship = 当前关系温度计
  - memory/voice = 长期理解与说话方式

### 3.3.6 Growth Task Service

新增模块：

- `electron/services/work-items.ts`
- `electron/services/projects.ts`

职责：

- 管理 work-item
- 聚合 projects
- 给 prompt / recall 提供结构化成长任务摘要

work-item 来源：

- `growthEvent`
- 高频对话主题
- AirJelly open task
- 用户明确表达的目标/焦虑/推进项

建议 work-item 字段：

- id
- userId
- title
- description
- status
- source
- relatedSignals[]
- notes[]
- summary
- createdAt
- updatedAt

project 字段：

- id
- userId
- title
- description
- workItemIds[]
- confidence
- rationale
- updatedAt

### 3.3.7 Recall Evaluator

新增模块：

- `electron/services/recall.ts`

职责：

- 监听上下文刷新
- 检测重复信号
- 召回相关记忆
- 给 UI 发轻量提示

V1 规则：

- 连续 3 次 context refresh 出现同类 app/task keyword，才触发候选 recall
- 同一类 recall 30 分钟内只提示一次
- 只发 soft hint，不直接插嘴到聊天中

### 3.3.8 Prompt Builder 改造

当前 `prompt-builder.ts` 的问题不是不能用，而是职责过重。

要改成：

- 输入只接受 `ContextSnapshot + RetrievedMemoryBundle`
- 不自己负责读取数据
- 不自己负责排序逻辑

新增一个 `RetrievedMemoryBundle`：

- longTermFacts
- voiceHints
- activeProjects
- relevantWorkItems
- recentAwarenessHighlights

这样 prompt builder 就只负责渲染，不负责数据决策。

---

## 3.4 接口设计

本次改造不引入公网 API，继续使用 Electron IPC。

### 3.4.1 保留的 IPC

以下 IPC 保持兼容：

- `chat:send-message`
- `chat:get-greeting`
- `memory:summaries`
- `memory:history`
- `relationship:get`
- `relationship:save`
- `timeline:list`
- `airjelly:get-context`

### 3.4.2 新增 IPC

建议新增：

| IPC 名称 | 输入 | 输出 | 用途 |
| --- | --- | --- | --- |
| `memory:get-long-term` | userId | memory sections | 读取长期记忆 |
| `memory:get-voice` | userId | voice sections | 读取 voice 记忆 |
| `awareness:list` | userId, limit | episode[] | 浏览蒸馏结果 |
| `work-items:list` | userId | workItem[] | 展示成长任务 |
| `projects:list` | userId | project[] | 展示成长项目 |
| `recall:list-recent` | userId | recall events | UI 提示列表 |
| `memory:run-distill` | userId | ok | 手动触发蒸馏 |

边界：

- IPC 返回只给 renderer 可读数据
- 文件系统路径不直接暴露给 renderer
- 所有写入动作由 main process 代理

---

## 3.5 数据模型/表结构设计

### 3.5.1 现有数据结构保留

当前已存在：

- `oc-data/memories/wechat/*.json`
- `oc-data/memories/oc_conversations/*.json`
- `oc-data/relationships/*.json`
- `oc-data/characters/*.json`
- `oc-data/mock/airjelly-context.json`

这些文件全部保留。

### 3.5.2 新增目录结构

```text
oc-data/
  memory/
    memory.md
    voice.md
    scopes/
      default/
        system-reminders.md
  awareness/
    episodes/
      YYYY-MM-DD.md
    notes/
      YYYY-MM-DD.md
  work-items/
    work_<ts>_<id>.json
  projects/
    projects.json
```

### 3.5.3 `memory.md`

建议结构：

- Person
- Relationship
- Growth Focus
- Work / Projects
- Preferences
- Triggers
- Recent

### 3.5.4 `voice.md`

建议结构：

- 适合的语气
- 不适合的表达方式
- 何时主动关心
- 何时应克制
- 什么内容可以直说
- 什么内容要轻一点

### 3.5.5 awareness episode

每个文件采用固定四段：

- Key Moments
- Behavior Signals
- Candidate Memory Updates
- Open Threads

### 3.5.6 work-item JSON

建议结构：

```json
{
  "id": "work_...",
  "userId": "user-001",
  "title": "xxx",
  "description": "xxx",
  "status": "pending|in_progress|completed|blocked",
  "source": "chat|airjelly|manual|distillation",
  "relatedSignals": [],
  "notes": [],
  "summary": "",
  "createdAt": 0,
  "updatedAt": 0
}
```

### 3.5.7 projects.json

建议结构：

```json
{
  "version": 1,
  "generatedAt": 0,
  "userId": "user-001",
  "projects": []
}
```

---

## 3.6 状态流转/时序设计

### 3.6.1 对话状态

`message received → context built → llm called → response parsed → history appended → relationship updated → distillation queued`

### 3.6.2 记忆状态

`raw signals → awareness draft → candidate patch → merged / deferred / discarded`

### 3.6.3 关系状态

`chat turn → intimacy delta → relationship next state → timeline update`

### 3.6.4 work-item 状态

`pending → in_progress → completed`

扩展：

- `blocked`
- `cancelled`

### 3.6.5 recall 状态

`signal detected → repeated confirm → memory retrieved → cooldown check → UI hint fired`

---

## 3.7 异常处理

| 场景 | 处理策略 |
| --- | --- |
| AirJelly SDK 调用失败 | 回退到 mock context，不阻断聊天 |
| 长期记忆文件不存在 | 自动创建模板文件 |
| awareness 写入失败 | 写日志，不影响当前轮回复 |
| work-item 聚合失败 | 保留旧 projects.json |
| relationship 写入失败 | 当前轮提示失败并记录日志 |
| prompt builder 读取长期记忆失败 | 降级为只使用 relationship + recentChat |
| recall 服务失败 | 只禁用提示，不影响主聊天链 |
| distillation 失败 | 可手动重试，不覆盖旧记忆 |
| Hermes / TTS / ASR 失败 | 只影响对应能力，不污染 memory chain |

---

## 3.8 权限与安全控制

### 3.8.1 本地文件边界

- Renderer 不直接读写 `oc-data`
- 所有记忆文件写入统一走 main process
- 角色、关系、记忆、项目都通过 service 层写入

### 3.8.2 环境变量与密钥

当前 LLM 走环境变量配置，保持不变。

要求：

- 不把密钥写进 `oc-data`
- 不把密钥放进角色/记忆文件
- 后续如上正式版，可切换到系统 Keychain

### 3.8.3 用户隐私

- 微信摘要属于高敏感输入
- AirJelly context 属于现实行为输入
- awareness 文件属于高密度认知产物

因此必须保证：

- 所有数据默认只保存在本地
- 不对外同步
- 未来若做导出，必须让用户明确确认

---

## 3.9 日志、监控与告警

建议新增三类日志：

- `chat.log`：聊天链路日志
- `distillation.log`：蒸馏与 memory merge 日志
- `recall.log`：recall 评估与触发日志

关键指标：

| 指标 | 说明 |
| --- | --- |
| chat_round_latency | 单轮聊天耗时 |
| context_build_latency | ContextSnapshot 构建耗时 |
| distill_success_rate | 蒸馏成功率 |
| memory_merge_conflict_count | 记忆冲突次数 |
| recall_trigger_count | recall 触发次数 |
| work_item_create_count | 新增长期任务数 |

V1 不需要接远程监控平台，本地日志足够。

---

# 第4章 性能管理评估分析

本次改造对性能的压力，主要来自三个点：

1. 聊天前上下文组装
2. 对话后蒸馏
3. 轻量 recall 检测

### 4.1 预期规模

- 单用户本地应用
- 聊天历史：每用户 20~5000 条
- 微信摘要：每用户几十到几百条摘要
- awareness：按天累积，数十到数百个文件
- work-item：每用户数十到数百条

### 4.2 性能目标

| 场景 | 目标 |
| --- | --- |
| 上下文构建 | < 150ms（不含 LLM） |
| 聊天主链额外开销 | < 200ms |
| 单次蒸馏 | 异步，< 5s |
| recall 评估 | < 100ms |
| work-item/project 聚合 | < 1s |

### 4.3 主要瓶颈

- `oc_conversations/*.json` 继续增长时，按文件全量读取会变慢
- `memory.md` 与 `voice.md` 若无分段控制，会影响 prompt 组装
- `awareness/episodes` 文件数持续增长后，若每次全扫会拖慢蒸馏与浏览

### 4.4 缓解措施

- 限制最近聊天窗口大小
- ContextSnapshot 引入 5 分钟缓存
- 长期记忆只读取命中 section
- awareness 读取只看最近窗口
- project 聚合只扫摘要，不扫全文历史

本次改造没有高并发压力，单机单用户足够。

---

# 第5章 投产策略说明

## 5.1 改造阶段划分

| 阶段 | 目标 | 产出 |
| --- | --- | --- |
| Phase 1 | 建统一记忆仓骨架 | `memory/`、`awareness/`、`work-items/`、`projects/` |
| Phase 2 | 改 chat-engine / prompt-builder | ContextSnapshot 接入，聊天主链兼容 |
| Phase 3 | 上 distillation | awareness 产物与 memory merge |
| Phase 4 | 上 growth task | work-item / project |
| Phase 5 | 上轻量 recall | UI soft hint |

## 5.2 发布前检查

| 检查项 | 要求 |
| --- | --- |
| 现有聊天能正常回复 | 必须通过 |
| relationship 不丢失 | 必须通过 |
| AirJelly context 可正常读取或正常 fallback | 必须通过 |
| 长期记忆文件可自动初始化 | 必须通过 |
| awareness 写入失败不影响聊天 | 必须通过 |
| 老数据目录不被破坏 | 必须通过 |

## 5.3 灰度策略

- 第一阶段只在本地开发环境启用新 memory layer
- 第二阶段通过环境变量开启 distillation
- 第三阶段再开启 recall

建议开关：

- `OC_ENABLE_UNIFIED_MEMORY=1`
- `OC_ENABLE_DISTILLATION=1`
- `OC_ENABLE_RECALL=1`

## 5.4 回滚条件

出现以下情况必须回滚：

- 聊天主链不可用
- relationship 文件被破坏
- prompt builder 因新 memory 层报错导致大面积失败
- 新增文件写入污染旧目录

## 5.5 回滚步骤

1. 关闭新 feature flags
2. 恢复旧 `chat-engine + prompt-builder + memory.ts` 读写逻辑
3. 保留已生成的 `memory/awareness/work-items/projects` 文件，但不再读取
4. 验证现有聊天与 relationship 正常工作

## 5.6 上线后验证

- 发一轮聊天，看是否正常回应
- 检查 `oc_conversations` 是否追加成功
- 检查 `relationship` 是否更新成功
- 检查是否生成 awareness 文件
- 检查是否写入长期记忆或 work-item
- 检查 recall 是否未误触发

---

# 第6章 关键风险点评估

| 风险点 | 触发条件 | 影响 | 缓解措施 | 负责人/待确认 |
| --- | --- | --- | --- | --- |
| 记忆层过早做重 | 一次性引入太多 AirJelly 机制 | 产品主链被拖慢 | 只做 Cola 骨架 + 轻量吸收 AirJelly | 开发 |
| prompt 污染 | memory/voice 拼接过多 | 回答失真、太像报告 | prompt 只读 relevant bundle，不读全量 | 开发 |
| relationship 与 long-term memory 职责冲突 | 两套状态互相覆盖 | 角色行为混乱 | 明确 relationship=短中期，memory=长期 | 开发 |
| work-item 泛滥 | task-worthy 判定太松 | 用户界面噪声太大 | 首版只接 growthEvent 和明确目标 | 开发 |
| recall 误触发 | 规则太敏感 | 打扰感强 | 连续出现确认 + cooldown | 开发 |
| awareness 写入质量低 | 蒸馏规则过粗 | 长期记忆污染 | 先写 candidate，再 merge | 开发 |
| 旧数据迁移出错 | 直接改旧文件结构 | 现有 demo 数据损坏 | 并存迁移，不覆盖旧路径 | 开发 |
| 过度依赖 AirJelly | SDK 异常或无数据 | 产品主链不可用 | 永远保留 mock / fallback | 开发 |

---

# 第7章 非功能性需求设计

| 类别 | 要求 | 设计方案 |
| --- | --- | --- |
| 安全性 | 本地高敏感记忆不可随意暴露 | renderer 不直读文件，main process 代理 |
| 可靠性 | 新记忆链失败不能拖垮聊天主链 | 蒸馏、recall、project 聚合全部异步/降级 |
| 可用性 | AirJelly 不可用时也能聊天 | mock / fallback 保留 |
| 可维护性 | 现有服务职责更清晰 | snapshot / distillation / recall / work-item 拆模块 |
| 可审计性 | 记忆变化要能回看 | awareness 作为中间产物保留 |
| 可扩展性 | 未来能演进到成长型 Agent | 预留 observation、recall、task 接口 |
| 兼容性 | 老 UI 和 IPC 不大改 | 保持现有 IPC，新增而不破坏 |
| 隐私性 | 微信摘要、关系状态、本地行为默认不出本机 | 不做云同步，不上报外部服务 |

---

# 第8章 待定问题

| 编号 | 待定问题 | 当前状态 |
| --- | --- | --- |
| Q01 | 长期记忆是否按 userId 分文件，还是先全局单文件 | 待补充 |
| Q02 | awareness 是否每天合并一份，还是按会话一份 | 待补充 |
| Q03 | work-item 是否需要 UI 编辑能力 | 待补充 |
| Q04 | recall 提示展示在聊天区、toast，还是角色气泡 | 待补充 |
| Q05 | prompt 层是否需要显式区分“成长记忆”和“社交记忆” | 待补充 |
| Q06 | `memory.md` 是否允许用户手工编辑 | 待补充 |
| Q07 | 第二阶段是否引入 SQLite 替代部分 JSON 历史存储 | 待补充 |
| Q08 | 后续是否接入向量检索层，而不是纯文件检索 | 建议延后 |

---

# 第9章 其他

## 9.1 关键改造入口文件

建议优先改造以下文件：

- `electron/services/memory.ts`
- `electron/services/chat-engine.ts`
- `electron/services/prompt-builder.ts`
- `electron/services/airjelly.ts`
- `src/types/index.ts`
- `electron/ipc.ts`

建议新增文件：

- `electron/services/context-snapshot.ts`
- `electron/services/distillation.ts`
- `electron/services/memory-merge.ts`
- `electron/services/work-items.ts`
- `electron/services/projects.ts`
- `electron/services/recall.ts`

## 9.2 名词说明

| 名词 | 说明 |
| --- | --- |
| ContextSnapshot | 当前一轮聊天可用的统一上下文快照 |
| Long-term Memory | 长期结构化记忆 |
| Voice Memory | 沟通风格与在意点记忆 |
| Awareness | 蒸馏中间层 |
| Work Item | 成长任务单元 |
| Project | 多个成长任务的聚合画像 |
| Recall | 基于现实上下文的轻量提醒 |

## 9.3 推荐实施顺序

推荐按以下顺序实施：

1. 新建 `memory/awareness/work-items/projects` 目录与模板
2. 抽 `ContextSnapshotBuilder`
3. 改 `prompt-builder` 只吃 snapshot
4. 改 `chat-engine`，接入 distillation enqueue
5. 上 awareness 与 memory merge
6. 上 work-item / project
7. 上 recall

## 9.4 结论

这次改造不该把 OC World 拉成另一个 AirJelly。

正确方向是：

**产品骨架继续走 Cola，现实上下文输入借 AirJelly，逐步把“陪聊角色”升级成“陪你成长的搭档”。**
