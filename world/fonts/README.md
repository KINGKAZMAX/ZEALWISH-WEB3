# 像素中文字体(已内置开放许可字体)

世界 HUD/对话框/引导卡走 `@font-face { font-family: 'PixelCJK'; src: url('/world/fonts/pixel.woff2') }`
(见 `src/app.css`;`--pixel-font` 变量与 `FONTS` 里 id=`pixel` 均以此为首选)。

**本目录已内置** `pixel.woff2` —— **Fusion Pixel 10px(proportional / zh_hans)**,
作者 TakWolf,**OFL-1.1** 开放许可(可商用 + 可再分发),许可全文见同目录 `pixel.OFL.txt`。
来源:https://github.com/TakWolf/fusion-pixel-font (release 2026.07.01)。
如需替换成其它开放许可像素字体,改名为 `pixel.woff2` 覆盖本文件即可;缺失时「像素」优雅回退等宽,不报错。

## 推荐字体(均为开放许可,可商用 + 可再分发)

- **Ark Pixel 方舟像素字体**(TakWolf)—— MIT / OFL,覆盖中日韩,10/12/16px。
  https://github.com/TakWolf/ark-pixel-font
- **Fusion Pixel 缝合像素字体**(TakWolf)—— OFL,12px,中日韩。
  https://github.com/TakWolf/fusion-pixel-font
- **Cubic 11 俐方體**—— OFL,繁/简中文像素字。
  https://github.com/ACh-K/Cubic-11  (或作者发布页)

下载其 `.ttf/.otf/.woff2` → 转/改名为 `pixel.woff2`(建议用 woff2 压体积)→ 放本目录。
保留原字体的 `OFL.txt` / LICENSE 到本目录一并提交(OFL 要求保留许可与版权)。

## ⚠️ 不要用 Zpix(最像素)

`Zpix` 观感很好,但**不是免费商用字体**:作者(SolidZORO)保留完整版权,商用产品
需邮件 solidzoro@live.com 付费授权后才可用,且禁止未授权再分发。放进本公开仓 =
公开分发 = 侵权。CSS 里也不要 `src` 指向 Zpix 文件。(若你已获得 Zpix 商用授权,
可自行把授权版 woff2 放成 pixel.woff2,并保留授权凭证。)

## 通则

接入任何字体前,确认其许可证允许「再分发 + 嵌入网页」,并随字体保留 LICENSE 文件。
