# 灵宠美术接入(仅限合规授权素材)

把**合规授权**的像素怪物 PNG 放进这个文件夹,然后在 `src/world/spirits.ts` 的 `SPIRIT_ART`
里登记 `物种id -> 文件名`,重新 `vite build` 即可替换内置的程序化美术。

- 6 个物种 id:`ember` `ripple` `moss` `breeze` `pebble` `glimmer`
- 单张正面像素图即可(运行时居中绘制 + 水平翻转 + 呼吸抖动);建议透明背景、≥48px。
- 登记示例(`spirits.ts`):
  ```ts
  export const SPIRIT_ART = { ember: 'ember.png', ripple: 'ripple.png' };
  ```
- 留空 = 使用内置原创程序化美术(零版权风险、零 404)。

## 只能用这些来源(允许商用/再分发的开放许可)

- **CC0**(公共领域,最省心):
  - OpenGameArt CC0 资源:https://opengameart.org/content/cc0-resources
  - itch.io CC0 怪物素材:https://itch.io/game-assets/assets-cc0/tag-monsters
  - awesome-cc0 清单:https://github.com/madjin/awesome-cc0
- **CC-BY / OGA-BY**:可用,但必须在仓库里署名作者(保留 LICENSE/credits)。

## 严禁

- ❌ 官方宝可梦(及任何任天堂 / Game Freak / The Pokémon Company)素材 —— 受版权与商标保护,
  「非商用」不豁免;放进公开仓 = 公开分发 = 会被 DMCA 下架。
- ❌ 从 ROM 提取、或 PokéAPI / pokesprite 等托管的官方精灵 —— 仓库的 MIT 标记**不覆盖**那些像素本身的版权。
- 加入任何素材前,确认其许可证允许「再分发 + 修改 +(最好)商用」,并保留原始 LICENSE 文件。
