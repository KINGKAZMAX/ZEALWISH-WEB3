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

远景「世界」观测台为**宝可梦火红(GBA)风格**外观,所用美术均为 **CC0 公共领域**的开源社区素材(并非任天堂/Game Freak 的游戏素材,与之无任何关联):

- 小镇地图块 `public/sprites/pkmn-overworld.png`(640×576,16px)—— ArMM1998 的 “[Zelda-like tilesets and sprites](https://opengameart.org/content/zelda-like-tilesets-and-sprites)”(OpenGameArt,**CC0**)。运行时由 `WorldView` 的 `buildPkmnTown()` 用草地/土路/房子等图块程序化铺成一座 32×32 的小镇(每个地点一栋房子,土路汇向中央广场)。
- 训练师角色精灵 `public/sprites/pkmn-chars.png`(16px 帧,4 向 × 3 帧行走,6 个变体)—— Corey Archer 的 “[Top-Down Pokémon-esque Sprites](https://opengameart.org/content/top-down-pokemon-esque-sprites)”(OpenGameArt,**CC0**)。
- 生命引擎、记忆/对话、经济与链上身份、整套观测台 UI 为本项目自研。
