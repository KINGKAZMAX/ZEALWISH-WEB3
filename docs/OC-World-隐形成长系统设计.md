# OC World 隐形成长系统设计

> 适用仓库：`/Users/pika/ai-pika/oc-world`
>
> 一句话定义：**OC 的成长系统不应该一开始被用户管理，而应该先在后台慢慢学会用户，再在合适时机温和浮现。**
>
> 与现有文档关系：
> - `OC-World-人成长陪伴产品方案.md` 定义产品理念：OC 服务人的成长。
> - `OC-World-记忆层与架构改造详细设计.md` 定义记忆层工程骨架。
> - 本文补充产品化约束：**记忆层不是前台系统，而是 OC 的后台认知层。**

# 第1章 核心判断

## 1.1 当前问题

我们在 demo 里不断加入成长卡、能力标准、共创平台、反馈来源、人生系统，这些概念都对，但如果第一版全部展示给用户，会变成另一个人生仪表盘。

用户真正需要的第一感受不是：

> 我打开了一个复杂的成长系统。

而是：

> 这个 OC 好像越来越懂我。

因此，第一版不应该让用户主动管理目标、优势、能力、项目和成长证据。

第一版应该让这些东西先在后台形成，等 OC 有足够把握时，再用一句自然的话邀请用户探索。

## 1.2 产品原则

### 原则一：前台是关系，后台是系统

前台只保留对话和陪伴感。

后台默默整理：

- 用户可能的长期目标
- 用户反复展现的优势
- 用户真实成长证据
- 用户当前适合的下一步规划

### 原则二：不要太早给用户贴标签

OC 可以先形成候选理解，但不能一上来就断言：

- 你就是这样的人
- 你的目标就是这个
- 你的能力值是多少

更好的表达是：

> 我好像开始看见一个线索，这个判断可能还不完整。要不要看看我是怎么理解的？

### 原则三：系统由用户探索开启

成长系统不是默认展开的页面，而是被用户逐步发现的空间。

触发方式可以是：

- OC 发现连续出现的目标线索
- OC 发现某个优势反复出现
- OC 发现某段经历值得沉淀
- 用户主动问“你现在怎么理解我”
- 用户主动点“探索”

### 原则四：确认权在用户

OC 的所有成长理解都必须允许用户确认、修正、拒绝。

后台可以先学习，但进入长期记忆前要经过用户校准。

# 第2章 与现有记忆层架构的关系

## 2.1 现有架构可以保留

现有记忆层设计中的核心链路仍然成立：

```text
用户消息 + ContextSnapshot
→ Chat Runtime
→ 回复
→ relationship update
→ distillation
→ awareness
→ long-term memory / work-item / project / recall
```

但产品语义需要调整。

原来的理解更像：

```text
记忆蒸馏 → 形成记忆/任务/项目 → 前台系统展示
```

现在应该改成：

```text
记忆蒸馏 → 形成后台洞察 → reveal policy 判断 → 温和浮现 → 用户确认 → 长期沉淀
```

## 2.2 新增核心层：Growth Insight Engine

建议在现有 `awareness` 和 `memory/work-item/project` 之间增加一层：

```text
Growth Insight Engine
```

它负责把 awareness 里的信息变成更产品化的“成长洞察”。

它不直接展示给用户。

它先产出：

- 目标线索
- 优势线索
- 成长证据
- 下一步规划
- 沟通偏好
- 开放问题

然后交给 reveal policy 决定是否浮现。

## 2.3 recall 改成 reveal

现有文档里的 `recall` 不建议在产品语言里叫“提醒”。

更准确的是：

```text
reveal
```

也就是：

> OC 发现自己对用户有了一点更稳定的理解，于是邀请用户探索。

它不是打断，不是任务提醒，也不是系统通知。

它是一句轻的关系表达。

# 第3章 总体架构

## 3.1 新主链

```text
用户对话
→ ContextSnapshot
→ Chat Runtime 生成即时回复
→ 写入聊天历史与 relationship
→ Distillation Engine 生成 awareness
→ Growth Insight Engine 生成 latent insight
→ Reveal Policy 判断是否浮现
→ UI soft hint
→ 用户确认 / 修正 / 拒绝
→ 写入长期 memory / voice / growth profile
```

## 3.2 用户体验链路

### 初始状态

用户只看到：

- OC 形象
- 对话窗口
- 很轻的状态，比如“正在听”

用户不看到：

- 人生系统
- 能力值
- 项目列表
- 成长卡常驻
- 目标图谱

### 后台学习

每轮对话后，OC 后台做：

- 记录原始对话
- 提取可能的成长信号
- 判断是否重复出现
- 记录证据来源
- 更新 confidence

### 温和浮现

当某类线索足够稳定时，OC 可以说：

> 我好像开始看见一个线索：你不是想做一个管理人生的仪表盘，而是在做一个会慢慢理解人的成长伙伴。要不要看看我目前是怎么理解的？

用户可以：

- 看看
- 先不用展开
- 修正这个理解

### 长期沉淀

只有用户确认后，洞察才进入长期层：

- `memory.md`
- `voice.md`
- `growth profile`
- confirmed goals
- confirmed strengths

# 第4章 数据模型

## 4.1 GrowthInsight

```ts
export type GrowthInsightType =
  | "goal"
  | "strength"
  | "evidence"
  | "plan"
  | "preference"
  | "open_question";

export type GrowthInsightStatus =
  | "latent"
  | "suggested"
  | "confirmed"
  | "rejected"
  | "archived";

export interface GrowthInsight {
  id: string;
  userId: string;
  type: GrowthInsightType;
  title: string;
  text: string;
  evidence: GrowthEvidence[];
  confidence: number;
  status: GrowthInsightStatus;
  createdAt: number;
  updatedAt: number;
  lastSuggestedAt?: number;
  userFeedback?: string;
}
```

## 4.2 GrowthEvidence

```ts
export type GrowthEvidenceSource =
  | "chat"
  | "airjelly"
  | "wechat"
  | "manual"
  | "relationship";

export interface GrowthEvidence {
  id: string;
  source: GrowthEvidenceSource;
  text: string;
  timestamp: number;
  ref?: {
    messageId?: string;
    eventId?: string;
    filePath?: string;
  };
}
```

## 4.3 GrowthProfile

```ts
export interface GrowthProfile {
  userId: string;
  updatedAt: number;
  goals: ConfirmedGrowthItem[];
  strengths: ConfirmedGrowthItem[];
  currentFocus: ConfirmedGrowthItem[];
  preferences: ConfirmedGrowthItem[];
  openQuestions: ConfirmedGrowthItem[];
}

export interface ConfirmedGrowthItem {
  id: string;
  title: string;
  text: string;
  evidenceIds: string[];
  confidence: number;
  confirmedAt: number;
}
```

## 4.4 RevealCandidate

```ts
export interface RevealCandidate {
  id: string;
  userId: string;
  insightId: string;
  reason: string;
  priority: number;
  status: "pending" | "shown" | "dismissed" | "confirmed";
  createdAt: number;
  shownAt?: number;
}
```

# 第5章 本地数据结构

建议在保留现有 `oc-data/memories`、`relationships`、`characters` 的基础上新增：

```text
oc-data/
  growth/
    user-001/
      profile.json
      insights.json
      evidence.json
      reveal-queue.json
      logs/
        2026-04-30.jsonl
```

说明：

- `profile.json`：只放 confirmed 的长期画像。
- `insights.json`：放 latent / suggested / confirmed / rejected 洞察。
- `evidence.json`：放所有证据片段。
- `reveal-queue.json`：放等待浮现或已经浮现过的候选。
- `logs/*.jsonl`：记录 distillation / reveal 决策，便于调试。

# 第6章 模块设计

## 6.1 `context-snapshot.ts`

职责：

- 统一读取当前一轮可用上下文
- 给 chat、distillation、reveal 使用同一份输入

输出：

```ts
interface ContextSnapshot {
  builtAt: number;
  realtimeContext: AirJellyContext;
  socialMemory: MemorySummary[];
  conversationState: {
    recentChat: ChatHistoryEntry[];
  };
  relationshipState: Relationship;
  characterState: CharacterConfig;
  growthProfile: GrowthProfile;
  latentInsights: GrowthInsight[];
}
```

## 6.2 `distillation.ts`

职责：

- 每轮聊天结束后异步运行
- 从用户消息、OC 回复、ContextSnapshot 中提取候选 insight
- 不阻塞聊天主链

输入：

```ts
interface DistillInput {
  userId: string;
  turn: {
    userMessage: string;
    ocResponse: string;
    emotion: Emotion;
    growthEvent: string | null;
  };
  snapshot: ContextSnapshot;
}
```

输出：

```ts
interface DistillResult {
  evidence: GrowthEvidence[];
  insights: GrowthInsight[];
}
```

## 6.3 `growth-insights.ts`

职责：

- 读写 `insights.json`
- 合并相似 insight
- 更新 confidence
- 管理 status

关键规则：

- 同类证据重复出现，confidence 上升。
- 用户修正后，text 和 type 以用户修正为准。
- 用户拒绝后，同类 insight 进入 cooldown。

## 6.4 `reveal-policy.ts`

职责：

- 判断 insight 是否值得浮现
- 控制打扰感
- 生成 soft hint 文案所需的 reason

V1 规则：

```text
可以浮现：
- confidence >= 0.65
- evidence >= 2
- status = latent
- 最近 30 分钟没有浮现过同类型 insight
- 当前对话不是强情绪支持场景

不浮现：
- 用户刚拒绝类似洞察
- insight 只有一次证据
- 文案会显得像诊断或贴标签
- 用户正在处理紧急任务
```

## 6.5 `growth-profile.ts`

职责：

- 管理 confirmed profile
- 将用户确认后的 insight 写入长期画像
- 给 prompt builder 提供稳定、低噪音的理解

只写 confirmed，不写 latent。

## 6.6 `prompt-builder.ts` 改造

现有 prompt builder 不需要推翻，但要改变使用方式。

新增规则：

```text
你可以使用后台理解，但不要像报告一样展示。
不要主动说“我分析了你的目标/优势/能力”。
只有当洞察对当前对话有帮助时，才自然引用。
对未确认的 insight，必须使用不确定表达，例如“我好像开始看见...”。
用户没有要求时，不展示完整系统。
```

prompt 输入要拆成：

- confirmed profile：可以稳定使用
- latent insight：只能谨慎使用
- reveal candidate：可以生成软提示

# 第7章 状态流转

## 7.1 Insight 状态

```text
latent
→ suggested
→ confirmed
→ archived
```

或者：

```text
latent
→ suggested
→ rejected
```

含义：

- `latent`：OC 后台感觉到，但不展示。
- `suggested`：OC 向用户温和浮现。
- `confirmed`：用户认可，进入长期画像。
- `rejected`：用户否定，未来降低类似判断权重。
- `archived`：过期或不再相关。

## 7.2 Reveal 状态

```text
pending → shown → confirmed
pending → shown → dismissed
```

`dismissed` 不等于 `rejected`。

用户说“先不用展开”，只是暂时不看，不代表洞察错误。

## 7.3 Profile 写入

只有满足以下任一条件才写入 `profile.json`：

- 用户明确确认
- 同类证据多次出现，且用户没有反对
- 用户主动要求沉淀

# 第8章 UI 策略

## 8.1 第一屏

只显示：

- OC
- 对话
- 极轻状态，例如“正在听”“正在学会你”

不显示：

- 能力值
- 目标图谱
- 项目系统
- 成长卡常驻
- 后台 tab

## 8.2 Soft Hint

当 reveal policy 通过时，聊天中出现一条轻提示：

```text
我好像开始看见一个线索：你一直在寻找“人和 AI 长期共同成长”的关系。
要不要看看我目前是怎么理解的？
```

按钮：

- 看看你发现了什么
- 先不用展开
- 这个理解不对

## 8.3 探索页

探索页不是系统首页，而是“OC 当前理解”。

结构：

- 可能的长期目标
- 反复出现的优势
- 最近成长证据
- 当前下一步建议

每条都要能：

- 确认
- 修正
- 暂时隐藏

# 第9章 与现有文档的差异

## 9.1 对 `awareness` 的调整

原文档中 awareness 更像蒸馏中间产物。

本文补充：

**awareness 之后不能直接进入长期记忆，必须先成为可校准的 GrowthInsight。**

## 9.2 对 `work-item / project` 的调整

原文档中 work-item / project 是成长任务骨架。

本文建议：

V1 先不要在前台叫任务或项目。

内部可以保留，但产品层先表达为：

- 成长线索
- 正在浮现的方向
- 共同沉淀的东西

## 9.3 对 `recall` 的调整

原文档中 recall 是召回与提示。

本文建议：

产品层改成 reveal。

技术上仍可叫 recall，但 UI 和文案不要像提醒系统，而要像关系里的自然发现。

# 第10章 最小落地计划

## Phase 1：只做后台 insight，不改 UI

新增：

- `electron/services/growth-profile.ts`
- `electron/services/growth-insights.ts`
- `electron/services/distillation.ts`
- `electron/services/reveal-policy.ts`

接入：

- `chat-engine.ts` 在写入 history 后异步触发 distillation。

验收：

- 每轮聊天后生成 `insights.json`
- 聊天失败不影响 distillation
- distillation 失败不影响聊天

## Phase 2：接入 prompt，但不主动展示系统

改造：

- `context-snapshot.ts`
- `prompt-builder.ts`

验收：

- confirmed profile 能自然影响 OC 回复
- latent insight 只以不确定语气出现
- prompt 不像报告

## Phase 3：做 soft reveal

新增：

- `reveal-queue.json`
- `reveal:list-recent` IPC
- 前端 soft hint

验收：

- 只有达到阈值才出现 hint
- 用户可以选择“看看 / 先不用 / 不对”
- 用户反馈会更新 insight status

## Phase 4：探索页

新增一个隐藏入口：

- `Luma 正在学会你`

展示：

- 目标
- 优势
- 证据
- 规划

验收：

- 默认不展示
- 只从 soft hint 或用户主动探索进入
- 每条理解都能确认或修正

# 第11章 验收标准

## 产品验收

- 用户第一眼看到的是 OC 和对话，不是成长系统。
- OC 能在多轮对话后说出更懂用户的一句话。
- 用户能感觉到后台在学习，但没有被管理。
- 系统浮现时像关系里的发现，不像 dashboard 通知。

## 技术验收

- `chat:send-message` 不因 distillation 变慢。
- `insights.json` 能持续累积 latent insight。
- `profile.json` 只包含 confirmed 内容。
- reveal 有 cooldown，不会频繁打扰。
- 用户拒绝或修正会影响后续判断。

# 第12章 最终结论

OC World 的记忆层不应该只是“把信息存起来”。

它应该成为 OC 的后台认知系统：

```text
先听见用户
再默默形成线索
再等待线索稳定
再温和浮现
再由用户确认
最后沉淀成成长系统
```

第一版的关键不是把人生系统做完整，而是让用户相信：

**这个 OC 真的在慢慢学会我。**
