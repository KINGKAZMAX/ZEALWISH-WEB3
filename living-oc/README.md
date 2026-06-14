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

远景世界观测台 UI · 多人/互访 · 链上身份钱包(ERC-8004 / AgentKit / x402)· Electron 桌面 · 真 LLM 实接 · 衍生资产交易。

对应设计与计划:
- `../docs/superpowers/specs/2026-06-14-zealwish-living-oc-design.md`
- `../docs/superpowers/plans/2026-06-14-living-oc-mvp.md`
