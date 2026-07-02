# 随行宠物美术(已内置 Tuxemon 开源素材)

**本目录已内置** 7 系随行宠物的像素立绘 —— 来自开源怪物收集游戏 **Tuxemon**
（OpenGameArt「Tuxemon Set 1」），**CC BY-SA 4.0**。逐只署名见 `ATTRIBUTION.md`,
许可全文见 `LICENSE-CC-BY-SA-4.0.txt`。`src/world/spirits.ts` 的 `SPIRIT_ART` 已默认登记:

- 7 个物种 id → 文件:`puff→puff.png` `ember→ember.png` `ripple→ripple.png`
  `moss→moss.png` `breeze→breeze.png` `pebble→pebble.png` `glimmer→glimmer.png`
- 单张正面像素图(运行时居中绘制 + 水平翻转 + 呼吸抖动);缺图时回退到极简占位绘制。
- 构建时 `living-oc/public/sprites/spirits/` 会被 `vite build` 拷入 `frontend-v4/world/sprites/spirits/`。

## 想替换/新增素材

改名覆盖对应文件即可(改编需沿用 CC BY-SA 4.0 + 保留署名)。**只能用开放许可来源**:

- **CC0**(最省心):OpenGameArt https://opengameart.org/content/cc0-resources · itch.io https://itch.io/game-assets/assets-cc0/tag-monsters
- **CC-BY / CC BY-SA**:可用,但必须在 `ATTRIBUTION.md` 里署名并保留 LICENSE。

## 严禁

- ❌ 官方宝可梦(及任天堂 / Game Freak / The Pokémon Company)素材 —— 受版权与商标保护,
  「非商用」不豁免;放进公开仓 = 公开分发 = 会被 DMCA 下架。
- ❌ 从 ROM 提取、或 PokéAPI / pokesprite 等托管的官方精灵 —— 外壳的许可标记**不覆盖**那些像素本身的版权。
