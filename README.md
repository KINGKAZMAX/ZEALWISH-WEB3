<p align="center">
  <img src="docs/images/banner.jpg" width="100%" alt="ZEALWISH — Create. Grow. Own your AI character." />
</p>

# ZEALWISH-WEB3

> **A wallet-owned AI character platform — create an original AI character, grow it through persistent memory, and own its identity.**
> **钱包所有制的 AI 角色平台 —— 创建你的原创 AI 角色,用持久记忆养成它,并真正拥有它的身份。**
>
> *A companion becomes real when it remembers — and when it lives.*
> *当它记得你、并自己活着时,陪伴才成真。*

---

## 🌏 English

### What is ZEALWISH?

Most AI companions live inside one company's database and reset every session. ZEALWISH is built on a different principle: **the character belongs to the user.** It combines three layers:

1. **AI character creation** — a cinematic flow to create an original character (visual style, personality, voice, origin).
2. **Relationship memory** — conversations become a structured memory vault, so the character develops continuity instead of resetting.
3. **Wallet-owned identity** — a Character Passport designed to carry identity, provenance, permissions, and portability across future apps and worlds.

> NFT is not the product. **Ownership is the product.**

### Living OC — your character doesn't wait in a chat box, it lives

The `living-oc/` module is the web-first MVP of the next step: **your owned OC is a sovereign agent that lives an autonomous life.** While you're away it works, socializes, creates, and has ups and downs; those lived experiences accrete into its memory and identity, deepening your relationship. Because you own it (passport + wallet), that life, memory, and assets are yours and portable.

Core loop (verified, runs offline, zero keys): **create your OC → it autonomously lives a day (life feed + diary) → it proactively tells you about its day → you guide it → the guidance sediments into who it becomes.**

> Positioning: not a metaverse (an empty place you log into), not a needy companion (a bot that waits for you) — **a life you own that goes on living on its own.**

### Repository structure

```
frontend-v4/     Zero-build landing page + brand (English product story)
src/             React app shell (character, chat, memory, growth surfaces)
electron/        Desktop runtime + IPC bridge + services (chat-engine, memory, llm, tts/asr, image-gen)
ocworld-web/     Standalone web app (Express + Vite)
hermes-agent/    Local AI runtime (LLM / voice / image extension points)
oc-data/         Local-first character / relationship / memory / growth data + avatars
living-oc/       ★ "Living OC" web MVP — autonomous life engine + memory + diary + memory-grounded chat
api/ cli/ scripts/ tests/   Backend routes, CLI, tooling, tests
public/ logo/ demos/ artifacts/   Assets & materials (素材)
docs/            Product & technical documentation
```

### Quick start

```bash
# Landing page (zero build)
python3 -m http.server 8789 --bind 127.0.0.1 --directory frontend-v4   # → http://127.0.0.1:8789

# Desktop app (React + Electron)
npm install && npm run dev

# Living OC web MVP
cd living-oc && npm install && npm run dev                              # → http://localhost:5173
cd living-oc && npx vitest run                                          # 13 tests
```

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18/19, TypeScript, Vite |
| Desktop | Electron 35 |
| Local AI runtime | Hermes Agent (LLM / voice / image hooks) |
| Living OC engine | TypeScript, Zustand, deterministic life simulation, local-first memory |
| Web3 (roadmap) | Wallet-linked Character Passport; agent identity & wallet; gasless payments |
| Data | Local-first JSON + exportable, user-owned memory |
| Testing | Vitest |

### Status

Active prototype. The landing, desktop shell, character/chat/memory/growth surfaces, and the `living-oc` web MVP are working. The wallet/identity ownership layer is product architecture + roadmap (no financial functionality in the prototype). Future updates land in this repository.

---

## 🇨🇳 中文

### ZEALWISH 是什么?

大多数 AI 伴侣都活在某家公司的数据库里、每次对话都会重置。ZEALWISH 建立在另一条原则上:**角色应当属于用户。** 它由三层组成:

1. **AI 角色创建** —— 沉浸式流程创建原创角色(视觉风格、性格、语音、背景)。
2. **关系记忆** —— 对话沉淀为结构化记忆库,角色形成连续性而非每次清零。
3. **钱包所有制身份** —— Character Passport(角色护照)承载身份、来源、权限与跨应用/跨世界的可携带性。

> NFT 不是产品。**所有制才是产品。**

### 活世界(Living OC)—— 你的角色不再待在聊天框里等你,它在世界里活着

`living-oc/` 模块是下一步的 **web 首发 MVP**:**你拥有的 OC 是一个有自己人生的主权 agent。** 你不在时,它打工、社交、创作、经历起落;这些亲历沉淀成它的记忆与自我,反过来加深你们的关系。因为你拥有它(护照 + 钱包),这段人生、记忆与资产都归你、可携带。

核心闭环(已验证、离线可跑、零 key):**创建你的 OC → 它自治过一天(生活流 + 日记)→ 它主动跟你讲今天 → 你引导它 → 引导沉淀成它逐渐成为的样子。**

> 定位:不是元宇宙(一个你登录的空旷场所),也不是依附型伴侣(一个等你的机器人)—— 而是**一个你拥有、却自顾自活下去的生命**。

### 仓库结构

```
frontend-v4/     零构建落地页 + 品牌(英文产品叙事)
src/             React 应用外壳(角色、对话、记忆、成长界面)
electron/        桌面运行时 + IPC 桥 + 服务(对话引擎、记忆、LLM、语音、出图)
ocworld-web/     独立 Web 应用(Express + Vite)
hermes-agent/    本地 AI 运行时(LLM / 语音 / 图像扩展点)
oc-data/         本地优先的 角色/关系/记忆/成长 数据 + 头像
living-oc/       ★「活世界」web MVP —— 自治生命引擎 + 记忆 + 日记 + 记忆驱动对话
api/ cli/ scripts/ tests/   后端路由、CLI、工具、测试
public/ logo/ demos/ artifacts/   素材与资源
docs/            产品与技术文档
```

### 快速开始

```bash
# 落地页(零构建)
python3 -m http.server 8789 --bind 127.0.0.1 --directory frontend-v4   # → http://127.0.0.1:8789

# 桌面应用(React + Electron)
npm install && npm run dev

# 活世界 web MVP
cd living-oc && npm install && npm run dev                              # → http://localhost:5173
cd living-oc && npx vitest run                                          # 13 个测试
```

### 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18/19、TypeScript、Vite |
| 桌面 | Electron 35 |
| 本地 AI 运行时 | Hermes Agent(LLM / 语音 / 图像 钩子) |
| 活世界引擎 | TypeScript、Zustand、确定性生命模拟、本地优先记忆 |
| Web3(路线图) | 钱包绑定角色护照;agent 身份与钱包;免 gas 支付 |
| 数据 | 本地优先 JSON,可导出、用户拥有的记忆 |
| 测试 | Vitest |

### 状态

活跃原型。落地页、桌面外壳、角色/对话/记忆/成长界面、以及 `living-oc` web MVP 均可运行。钱包/身份所有制层为产品架构 + 路线图(原型中无任何金融功能)。**之后的更新都在本仓库。**

---

<p align="center"><sub>© ZEALWISH · A life you own.</sub></p>
