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

## 架构

- `src/sim/` — 确定性生命引擎(单主角私有世界:`createPrivateWorld`/`runDay`)+ 记忆沉淀(`scoreImportance`/`retrieve`)+ 反思日记(`reflectToDiary`)+ 记忆驱动对话(`openingLine`/`replyTo`)。认知默认离线脚本,留有 ✦ Claude 切换缝。
- `src/oc/` — 主权 OC 模型(`createOc`/`sedimentGuidance`,带 `profile` 自沉淀)+ 本地优先持久化/导出(`saveOc`/`loadOc`/`exportOcFile`)= 所有制。
- `src/store/useLiving.ts` — 状态编排(create → liveADay → send → guide → persist)。
- `src/components/` — 近景对话/引导(Chat)+ 中景生活流/日记(LifeFeed)+ OcHeader。

## 不在 MVP(见 spec 路线图)

多人/互访 · 链上身份钱包(ERC-8004 / AgentKit / x402)· Electron 桌面 · 真 LLM 实接(B)· 真链实接(C)· 衍生资产交易。
(远景「世界」观测台 — 地图 + 实时社交流 + 像素小人 + 人格检查面板 — 已内置,见「世界」标签。)

对应设计与计划:
- `../docs/superpowers/specs/2026-06-14-zealwish-living-oc-design.md`
- `../docs/superpowers/plans/2026-06-14-living-oc-mvp.md`

## 素材署名 / Credits

- 地图像素小人精灵 `public/sprites/folk.png` —— 采用 AI 小镇(a16z `ai-town`)同款 `32x32folk.png`(384×256,8 角色 RPGMaker 角色集)。原始美术由 [ansimuz](https://opengameart.org/content/tiny-rpg-forest) / George Bailey([OpenGameArt 16x16 game assets](https://opengameart.org/content/16x16-game-assets),CC0)提供。
- 小镇地面/房子图块集 `public/sprites/rpg-tileset.png` 与 Tiled 地图 `public/sprites/town.json`(40×40 格、16px)—— 来自 AI 小镇(a16z `ai-town`)的 `environment/rpg-tileset` 与 `tilemap.json`,底层图块为 [OpenGameArt](https://opengameart.org/) 社区 CC0 的 16×16 RPG tileset。运行时由 `WorldView` 把 terrain/bridge/deco 三个图层合成为一张小镇底图。
- 生命引擎、记忆/对话、UI 为本项目自研。
