# ZEALWISH · 活世界 — MVP(一个 OC 过一天)

Web 首发 · 本地优先 · 离线零 key。验证核心闭环:创建一个你拥有的 OC → 它自治过一天(生活流 + 日记)→ 在对话里主动引用今天的亲历 → 你引导它 → 沉淀进记忆。

口号:*A companion becomes real when it remembers* → **…when it lives.**

## 跑

```bash
cd living-oc && npm install && npm run dev
```

## 测

```bash
npx vitest run                       # 12 tests
npx tsc --noEmit -p tsconfig.app.json
```

## 切真 LLM / 真链(B / C,可选)

世界视图右上「⚡ 切换真 LLM / 真链」可把两条接缝换成真实实现,由 `living-oc/server` 轻后端承载(密钥只留后端):

```bash
cd living-oc/server && npm i && cp .env.example .env   # 填 ANTHROPIC_API_KEY(B)/ DEPLOYER_PRIVATE_KEY(C)
npm start                                              # http://localhost:8788
```

- **B · 真 Claude 大脑**:群演逐 tick 用 `claude-haiku-4-5` 决策,导演用 `claude-opus-4-8` 反思,台词实时生成。
- **C · 真 Base Sepolia 链**:`viem` 在 Base Sepolia 测试网产生可验证的真实 `txHash`。

未配密钥/未启后端时,切真会自动回退离线引擎(A),世界不受影响。详见 [`server/README.md`](server/README.md)。

## 架构

- `src/sim/` — 确定性生命引擎(单主角私有世界:`createPrivateWorld`/`runDay`)+ 记忆沉淀(`scoreImportance`/`retrieve`)+ 反思日记(`reflectToDiary`)+ 记忆驱动对话(`openingLine`/`replyTo`)。认知默认离线脚本,留有 ✦ Claude 切换缝。
- `src/oc/` — 主权 OC 模型(`createOc`/`sedimentGuidance`,带 `profile` 自沉淀)+ 本地优先持久化/导出(`saveOc`/`loadOc`/`exportOcFile`)= 所有制。
- `src/store/useLiving.ts` — 状态编排(create → liveADay → send → guide → persist)。
- `src/components/` — 近景对话/引导(Chat)+ 中景生活流/日记(LifeFeed)+ OcHeader。

## 不在 MVP(见 spec 路线图)

多人/互访 · 链上身份钱包(ERC-8004 / AgentKit / x402)· Electron 桌面 · 真 LLM 实接(B)· 真链实接(C)· 衍生资产交易。
(远景「世界」观测台 — 宝可梦火红风(GBA JRPG)小镇地图 + 实时社交流 + 训练师像素小人 + 人格检查面板 — 已内置,见「世界」标签。)

对应设计与计划:
- `../docs/superpowers/specs/2026-06-14-zealwish-living-oc-design.md`
- `../docs/superpowers/plans/2026-06-14-living-oc-mvp.md`

## 素材署名 / Credits

远景「世界」观测台采用 **Pokémon FireRed/LeafGreen(GBA)原版画风**:

- 世界地图 `public/sprites/kanto.webp` —— FireRed/LeafGreen 关都(Kanto)全区地表拼接图(VGMaps,拼图作者 Anthony Lin & Samuel Harbord)。`WorldView` 以相机源切片渲染,玩家用 WASD 自由漫游、可接管任一居民、靠近交互;6 个 ZEALWISH 地点叠在其上。
- 训练师/居民精灵 `public/sprites/chr-*.png` —— FRLG 主角 Red(小智)、对手与各类 NPC 的行走精灵(16×32 帧条),取自 FRLG 反汇编工程 [`pret/pokefirered`](https://github.com/pret/pokefirered)。
- 生命引擎、记忆/对话、经济与链上身份、整套观测台 UI 为本项目自研。

> ⚠ **版权与用途声明**:`frlg-town.png` 与 `chr-*.png` 为 Pokémon FireRed/LeafGreen 的游戏美术,版权归 **任天堂 / Game Freak / Creatures Inc.** 所有。本仓库仅作 **非商用粉丝/学习项目** 使用(类似 PokeMMO 等粉丝项目的精神),与任天堂无任何关联、不获其授权或背书,**不得用于任何商业用途**。如版权方提出异议,将立即移除相关素材。详见 [`public/sprites/ASSETS-NOTICE.md`](public/sprites/ASSETS-NOTICE.md)。
