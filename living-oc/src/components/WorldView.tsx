import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLiving } from '../store/useLiving';
import { locById, ARCHE_CN } from '../sim/data';
import { actionCN } from '../sim/text';
import type { Agent } from '../sim/types';
import WorldGoLive from './WorldGoLive';
import { liveSay, liveTalk } from '../live/liveProviders';
import { toggleBgm, bgmPlaying } from '../live/bgm';
import { makeNet, playerSelf, setPlayerName, netMode, netConfig, setNetConfig, clearNetConfig, type NetTransport, type NetSelf } from '../live/net';
import { SPECIES, ITEMS, speciesById, drawSpirit, SPIRIT_ART, type Spirit } from '../world/spirits';

const BASE = import.meta.env.BASE_URL;
// 访客观光模式(?visit=1):只读串门 —— 无操控/接管/互动,自动巡游 + 点角色聚焦查看 + 转化 CTA
const VISIT = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visit') === '1';
// 全球模式(配置了 Supabase):共享世界(主机权威)+ 固定区域,所有人同一个镇、同样的 NPC 动态
const GLOBAL = netMode() === 'global';
const MAP_SRC = 'kanto.webp';
// 关都总图 6528×6400(地图坐标系 = 原始像素)。内容是不规则陆地、含白色空白,
// 移动用降采样碰撞图限定在陆地上;6 地点放在一处镇区陆地上。
const MAP_W = 6528, MAP_H = 6400;
const MAP_SCALE = 2.5;                  // 屏上缩放(16px 瓦片 → 40px)
const TILE = 16 * MAP_SCALE;           // 屏上一格 = 32
const SPEED = 150;                     // 手控速度(地图 px/秒)
const NPC_SPEED = 78;                  // 自治居民速度
const INTERACT_R = 30;                 // 交互半径(地图 px)
const TAME_R = 50;                     // 收服半径(略大于交互,容错更友好)
// 6 个 ZEALWISH 地点 = 一处「活动区域」:活动中心点 + 固定相对偏移(成簇)。
// 中心可自定义:选预设区域,或把当前位置「设为活动中心」;选择持久化到 localStorage。
const REGION_DEFAULT: [number, number] = [0.9691, 0.5906];   // 默认:东海岸海景小屋绿地小岬
const ANCHOR_OFFSETS: Record<string, [number, number]> = {
  gallery: [0.0111, -0.0053], harbor: [0.0001, -0.0053], plaza: [0.0093, 0.0010],
  bazaar: [-0.0048, 0.0028], commons: [-0.0079, -0.0047], forge: [-0.0079, 0.0116],
};
// 预设活动区域(中心归一化坐标;由地图像素扫描挑出)
const REGIONS: { id: string; name: string; c: [number, number] }[] = [
  { id: 'seaside', name: '海边小屋', c: [0.9691, 0.5906] },
  { id: 'pier',    name: '林海码头', c: [0.9632, 0.5200] },
  { id: 'cove',    name: '海湾绿岛', c: [0.9560, 0.6320] },
  { id: 'town',    name: '红顶小镇', c: [0.5588, 0.3300] },
  { id: 'meadow',  name: '林间空地', c: [0.5833, 0.3450] },
  // 全图勘景新增(用足整张大地图;坐标经全图裁片 + 像素采样复核:中心落在可行走且视觉合理的地块)
  { id: 'bridge',  name: '金桥湖畔', c: [0.7050, 0.1350] },
  { id: 'beach',   name: '南滨沙滩', c: [0.5120, 0.8363] },   // 商铺排屋以南的开阔街面(原坐标落在店面上,审查修正)
  { id: 'isles',   name: '群岛浅滩', c: [0.1693, 0.8828] },   // 最大沙洲岛心(原坐标落在外海,审查修正;边缘锚点在浅水,符合「浅滩」主题)
];
function loadRegion(): [number, number] {
  try { const s = localStorage.getItem('oc-world-region'); if (s) { const v = JSON.parse(s); if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number') return [v[0], v[1]]; } } catch { /* ignore */ }
  return REGION_DEFAULT;
}

const NPC_CHARS = ['green_normal', 'boy', 'lass', 'youngster', 'fat_man', 'beauty', 'gentleman'];
// 玩家可选的「像素小人」身体(工作台创建流程里挑选;含主角 Red)
const PLAYER_SPRITES = ['red_normal', ...NPC_CHARS];
// 命名角色专属精灵(小智=Red 另外处理;5 个新加坡留学伙伴用对应 chr-*.png)
const NAMED_SPRITE: Record<string, string> = {
  '范范兔': 'fanfan', '熊熊': 'xiongxiong', '鹿鹿鹅': 'lulu', '猪猪仔': 'zhuzhu', '冰冰雁': 'bingbing', '杏子': 'beauty',
};
// 头顶气泡台词库(联网研究:新加坡留学日常 + 夜间动物园)。LLM 接入后由后端实时生成替换。
const LINE_BANKS: Record<string, string[]> = {
  // 小智:话少、字短、内敛;不说出口的在乎,默默记着每个人
  '小智': ['…嗯。(･ω･)', '看着你们,挺好。', '我也想…更用力点。', '今天也在。✦', '不太会说…但都记得。', '你们笑,我就安心 (˘ ˘)', '……(◞‸◟)', '走走看看就好。', '嗯,我在。', '别怕,有我。', '范范兔又中二了…我假装听懂 (･_･)', '熊熊的抱抱…其实我也需要。', '冰冰雁刚刚笑了一下,我看见了。', '鹿鹿鹅的诗,我都收着。', '猪猪仔说一起恰饭,好。', '想守住这片热闹 (｡•́‿•̀｡)', '海浪声…让人安静。', '不说出口,不代表不在乎 (◞‸◟)', '它们活着,我就踏实。', '今天风很好。'],
  // 范范兔:中二紫焰使徒;现实的加班社畜在中二外壳下偶尔漏出来
  '范范兔': ['No bone, no blood, no ash (｀∀´)Ψ', '阿姆斯特朗回旋加速喷气式阿姆斯特朗炮!', '封印在我右手的黑炎之龙…又躁动了', '哼,这点 deadline,在我「绝对领域」前不值一提', '吾乃黑暗中沉睡的紫焰使徒·范范兔 (・`ω´・)', '食阁辣椒蟹,是唤醒我封印之力的祭品!', '夜间动物园,是我与夜之眷属的契约之地', '别看我笑嘻嘻,体内住着混沌的另一个我', '上班只是我潜伏人间界的伪装 (¬‿¬)', '苏醒吧,我的「叻沙圣剑」!shiok!', '紫发是力量觉醒的证明,凡人勿视 ✧', '今日运势:黑暗终将吞噬一切…但先恰饭 (≧▽≦)', '我的另一个人格?她名为「加班」(¬‿¬)', '熊熊的拥抱…暂时压住了我的黑炎', '冰冰雁,我感应到你也是觉醒者!(才不是)', '老板的 email,才是真正的禁忌咒文…', '组屋 12 楼,是我封印结界的最高层', '哼,容我以紫焰之名守护这片海岸 (・`ω´・)', '黑暗不会消散…但夕阳真的好看呀 (´ω`)', '今天也要,元气满满地中二下去!'],
  // 熊熊:治愈系;谁来抱谁,但其实自己也偶尔想被接住
  '熊熊': ['谁 emo 都来抱抱,熊熊在 (っ◔◡◔)っ', '加东叻沙椰浆汤底,暖暖的 (´︶`)', '冷气太冻啦,披我外套吧 (｡•ᴗ•｡)', 'Deadline 别怕,先喝口 teh tarik (´▽`)', '夜间动物园水獭一家好吵好萌 (＾• ω •＾)', '组屋楼下巴刹,auntie 都认得我 (◕‿◕)', '抱一个,烦恼都会变小 (つ≧▽≦)つ', '今天也要好好吃饭哦 (｡♡‿♡｡)', '困了就靠着我睡 (´-ω-`)zzZ', '熊抱治百病,试试看?(ﾉ´ヮ`)ﾉ', '其实…偶尔也想有人抱抱我 (´-ω-`)', '小智话少,但记得我爱吃什么', '范范兔中二发作,我就多塞她块蟹 (´︶`)', '看大家好好的,我就饱了 (｡♡‿♡｡)', '夜里水獭叠在一起睡,像我们', '冰冰雁嘴硬,我就假装相信 (◕‿◕)', '情绪要被接住,抱抱不要钱', '鹿鹿鹅发呆时,我陪她一起发 (´▽`)'],
  // 鹿鹿鹅:文艺、发呆、把日子写成诗;温柔的忧郁
  '鹿鹿鹅': ['滨海湾日落…又发呆成鹅了 (´-ω-`)', '擎天树灯光秀,想写首诗 ✧', '夜里靠月光找动物,好诗意 (˘︶˘)', '果蝠倒挂啃水果,近到数牙齿 (・о・)', '炒粿条要够镬气 wok hei~ (´ ▽ `)', '风把我吹成另一个我了…(꒦ິ⌓꒦ີ)', '发呆也是一种创作嘛 (´｡• ᵕ •｡`)', '云好软,想躺上去 (｡-ω-)zzz', '今天的灵感,藏在叻沙里 (｡•̀ᴗ-)✧', '慢一点…世界更好看 (˶˘ ³˘)', '把今天写进诗里,它就不会走了', '小智的沉默,也是一种韵脚', '猪猪仔说叻沙是诗,我同意 (˘︶˘)', '灵感像夜行动物,要轻声靠近', '发呆不是浪费,是给世界留白', '海风把句子吹散了…那就再写一遍', '想给你们每个人,都写一首'],
  // 猪猪仔:美食家、佛系攒钱党;省钱的尽头是请大家恰一顿
  '猪猪仔': ['食阁一餐才 3 块,太香了 (๑´ڡ`๑)', '辣椒蟹满手酱,再来一份!(＞ڡ＜)', '沙爹配花生酱,绝了 (｡◕‿◕｡)', '佛系攒钱…美食面前破功 (´∀`)', '夜间动物园穿山甲太可爱 (♡˙︶˙♡)', '小贩中心是非遗,骄傲 ✧', '吃饱才有力气省钱 (ง•̀_•́)ง', '快乐由海南鸡饭赞助 (˶ᵔ ᵕ ᵔ˶)', 'teh tarik 拉得越高越甜 (ᵔᴥᵔ)', '今天恰三餐,一顿都不少 (๑˃̵ᴗ˂̵)', '攒钱是为了…请大家恰一顿大的 (๑˃̵ᴗ˂̵)', '谁不开心?我知道哪摊最治愈', '冰冰雁考砸了,我偷塞她份鸡饭', '美食面前众生平等 (´∀`)', '熊熊跟我抢最后一只蟹…让她 (´︶`)', '省下的每一块,都记在小本本里', '今天 auntie 多给我一勺,赚到!'],
  // 冰冰雁:高冷理科;嘴硬心软,只在夜行动物和数据面前卸防
  '冰冰雁': ['通宵 mugging,bell curve 必赢 (¬‿¬)', '高冷如我…只对夜行动物笑 (・_・)', 'MRT 早高峰,挤成 2D 了 (；￣Д￣)', '闪光灯别开!会吓到动物 (`へ´)', '波动率万岁,但叻沙更稳 (￣ω￣)', '别吵,我在算实验数据 (-ω-、)', '…那只豹子,有点可爱 (//ω//)', '考完试再说话 (´-﹏-`)', '叻沙性价比,我已建模 (¬_¬)ﾉ', '夜里我才会解冻一点点 (˶′◡‵˶)', '数据不会骗人…但人会让我心软 (-ω-、)', '才、才不是担心你们考试 (//ω//)', '熊熊的外套…我还没还,挺暖的', '夜行动物不评判我,所以我笑', '小智不吵,我能安心算题', '把焦虑做成 Excel,就没那么怕了', '范范兔的中二…理论上不可能,但有点想信'],
  // 杏子:黑长直发 · INFP 调停者 —— 内敛、理想主义、温柔、把心事写进小本子
  '杏子': ['把今天的心情,悄悄写进小本子 (｡･ω･｡)', '不太会说…但我都认真听着 (˶ᵕ ᵕ˶)', '每个人心里,应该都有一束光吧 ✧', '滨海湾的风,把烦恼吹软了 (´ω`)', '我想做的事,好像和世界有点不一样 (｡-‿-｡)', '一个人也挺好…但有你们更好 (˶˃ ᵕ ˂˶)', '范范兔的中二,其实我觉得很浪漫', '熊熊抱我的时候,眼泪差点没忍住 (ノω`*)', '夜里写诗的鹿鹿鹅,我懂那种安静', '不想赢过谁,只想成为更温柔的自己 (˘︶˘)', '理想主义总会碰壁…但我还是想信 (｡•́︿•̀｡)', '叻沙太辣,我小口小口地吃 (>﹏<)', '没说出口的话,都画成了小漫画', '今天也想,温柔地对待这个世界', '冰冰雁嘴硬,可她记得我怕黑', '和小智待着,很安心,不用硬找话 (˶ᵔ ᵕ ᵔ˶)', '难过的话,就允许自己难过一会儿吧'],
};
const FRAME: Record<string, { idle: number; walk: [number, number] }> = {
  down: { idle: 0, walk: [3, 4] }, up: { idle: 5, walk: [6, 5] }, side: { idle: 2, walk: [7, 8] },
};
// 可自由选择的世界字体(系统中文字体栈,无需联网加载;同时作用于 canvas 文字与 HTML HUD)
const FONTS: { id: string; name: string; css: string }[] = [
  { id: 'rounded', name: '圆体', css: '"Yuanti SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif' },
  { id: 'sans', name: '黑体', css: '"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif' },
  { id: 'kai', name: '楷体', css: '"Kaiti SC","STKaiti",KaiTi,"Noto Serif SC",serif' },
  { id: 'song', name: '宋体', css: '"Songti SC","Noto Serif SC",SimSun,serif' },
  { id: 'mono', name: '像素等宽', css: 'ui-monospace,"JetBrains Mono",Menlo,Consolas,monospace' },
  // 像素中文字体:自托管开放许可像素字(见 public/fonts/README);未放字体时回退到等宽,优雅降级
  { id: 'pixel', name: '像素', css: '"PixelCJK","Fusion Pixel 12px","Ark Pixel 12px SC","Cubic 11",ui-monospace,monospace' },
];
const FONT_DEFAULT = FONTS[0].css;
// 角色之间的亲密相会:成对的「呼应」台词(a 说上句,b 接下句)
const PAIR_LINES: [string, string][] = [
  ['一起去恰叻沙好不好~ (´▽`)', '好呀好呀,今天我请客!(つ≧▽≦)つ'],
  ['今晚夜间动物园,约吗?', '约!带上我的小水獭表情包 (＾• ω •＾)'],
  ['你最近好辛苦,抱一个 (つ´∀`)つ', '呜…有你在真好 (｡•́︿•̀｡)'],
  ['滨海湾看日落?我写诗你拍照 ✧', '成交~ 你的诗最好看了 (˘︶˘)'],
  ['偷偷说,布丁我留给你啦 (¬‿¬)', '哇!你对我最好了 ♥'],
  ['周末一起去小贩中心扫街?', '走!海南鸡饭辣椒蟹全都要 (๑´ڡ`๑)'],
  ['手给我,人太多别走丢 (´｡• ᵕ •｡`)', '嗯!牵紧紧的 (//ω//)'],
  ['考完试啦?抱抱奖励你 (づ｡◕‿‿◕｡)づ', '嘿嘿…再抱一会儿 (˶′◡‵˶)'],
  ['你今天有点 emo 哦?', '被你看穿了…抱一下就好 (｡•́︿•̀｡)'],
  ['我写了首诗,念给你听?', '念!我最爱听你念诗了 (˘︶˘)'],
  ['别熬夜啦,teh tarik 我请', '再赶完这一段…好啦,走 (´-﹏-`)'],
  ['那只豹子今晚还在吗?', '在!我们悄悄去看它 (//ω//)'],
  ['你头发今天好紫好酷', '哼,这是力量觉醒的证明 ✧'],
  ['留了最后一只蟹给你', '呜你最好了…分你一半 (つ´∀`)つ'],
  ['一起看日落到天黑好不好', '好,我把今天记下来 (˶˘ ³˘)'],
  ['今天画了张小画,想给你看', '哇…你把那阵风都画进去了 (˶˃ ᵕ ˂˶)'],
  ['不太会说,但我都记着呢', '有人记着,就不怕走丢了 (´ω`)'],
];
// 玩家走近伙伴后的互动动作菜单
const ACTIONS: { id: string; label: string; sub: string; glyph: string }[] = [
  { id: 'chat',   label: '闲聊', sub: '唠唠日常', glyph: '♪' },
  { id: 'praise', label: '夸夸', sub: '+好感',   glyph: '✦' },
  { id: 'meal',   label: '约饭', sub: '去恰美食', glyph: '✿' },
  { id: 'hug',    label: '抱抱', sub: '+亲密',   glyph: '♥' },
  { id: 'follow', label: '陪走', sub: '一起散步', glyph: '⇢' },
];

function hue(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h % 360; }
function rrect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
// 头顶对话气泡(cx=中心,by=气泡底部 y)
function bubble(c: CanvasRenderingContext2D, cx: number, by: number, text: string, fam: string) {
  c.font = '12px ' + fam; c.textBaseline = 'top';
  const per = 13, lines: string[] = []; for (let i = 0; i < text.length; i += per) lines.push(text.slice(i, i + per));
  const lh = 15, w = Math.max(...lines.map((l) => c.measureText(l).width)) + 16, h = lines.length * lh + 8, x = cx - w / 2, y = by - h;
  c.fillStyle = '#f7f3e3'; c.strokeStyle = '#283562'; c.lineWidth = 2;
  rrect(c, x, y, w, h, 5); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(cx - 6, by - 2); c.lineTo(cx + 6, by - 2); c.lineTo(cx, by + 6); c.closePath(); c.fillStyle = '#283562'; c.fill();
  c.fillStyle = '#27314f'; c.textAlign = 'center'; lines.forEach((l, i) => c.fillText(l, cx, y + 4 + i * lh));
  c.textBaseline = 'alphabetic';
}
// 运行时给命名女生角色改发色;src=该精灵图的原发色档(不同精灵发色不同),dst=目标发色档(一一对应)。
// 返回新 Image,避免文件 base64 round-trip 损坏。
function recolorHair(img: HTMLImageElement, src: number[][], dst: number[][]): HTMLImageElement {
  const out = new Image();
  const c = document.createElement('canvas'); c.width = img.naturalWidth || 144; c.height = img.naturalHeight || 32;
  const cx = c.getContext('2d'); if (!cx) { out.src = img.src; return out; }
  cx.imageSmoothingEnabled = false; cx.drawImage(img, 0, 0);
  try {
    const id = cx.getImageData(0, 0, c.width, c.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue; const r = d[i], g = d[i + 1], b = d[i + 2];
      for (let h = 0; h < src.length; h++) { if (Math.hypot(r - src[h][0], g - src[h][1], b - src[h][2]) < 34) { d[i] = dst[h][0]; d[i + 1] = dst[h][1]; d[i + 2] = dst[h][2]; break; } }
    }
    cx.putImageData(id, 0, 0); out.src = c.toDataURL('image/png');
  } catch { out.src = img.src; }
  return out;
}
// 范范兔 = 主角精灵(fanfan)金棕发 → 紫
const recolorHairPurple = (img: HTMLImageElement) => recolorHair(img, [[57, 57, 24], [123, 115, 65], [205, 172, 98], [156, 140, 90]], [[74, 44, 104], [138, 84, 176], [198, 154, 232], [168, 118, 205]]);
// 杏子 = beauty 精灵金发(及垂落的长发)→ 黑(黑长直)
const recolorHairBlack = (img: HTMLImageElement) => recolorHair(img, [[255, 222, 74], [213, 172, 32], [131, 98, 0]], [[86, 86, 100], [42, 42, 52], [20, 20, 26]]);

interface PP { mx: number; my: number; dir: string; moving: boolean; flip?: boolean }

function Bar({ label, v }: { label: string; v: number }) {
  return (<div className="ibar"><div className="ibar-lab"><span>{label}</span><span>{Math.round(v * 100)}</span></div><div className="ibar-track"><span style={{ width: v * 100 + '%' }} /></div></div>);
}
function Inspector({ a, isOc }: { a: Agent; isOc: boolean }) {
  return (
    <div className="insp">
      <div className="insp-top"><span className="insp-av" style={{ background: `hsl(${hue(a.id)},45%,55%)` }} />
        <div><div className="insp-nm">{a.name}{isOc && <span className="insp-you"> ★ 你的 OC</span>}</div>
          <div className="insp-hd">{a.handle} · {ARCHE_CN[a.arche]} · 「{a.mood}」</div></div></div>
      <div className="insp-wallet">{a.wallet.slice(0, 18)}…</div>
      <div className={'insp-bal ' + (a.balance < 0 ? 'neg' : 'pos')}>{a.balance.toFixed(2)} <small>◈</small></div>
      {a.nfts.length > 0 && <div className="insp-nfts">{a.nfts.slice(-6).map((n, i) => <span key={i} className="nft">◆ {n}</span>)}</div>}
      <div className="insp-sec">性格 · Traits</div>
      <Bar label="野心" v={a.traits.ambition} /><Bar label="社交" v={a.traits.sociability} /><Bar label="冒险" v={a.traits.risk} /><Bar label="创造" v={a.traits.creativity} /><Bar label="节俭" v={a.traits.frugality} />
      <div className="insp-sec">记忆流 · Memory</div>
      {a.memory.slice(0, 5).map((m, i) => <div key={i} className="insp-mem"><span className="tk">e{m.e}</span> {m.t}</div>)}
      {a.memory.length === 0 && <div className="insp-mem tk">尚无记忆</div>}
    </div>
  );
}

export default function WorldView() {
  useLiving((s) => s.version);
  const ocId = useLiving.getState().oc?.id ?? null;
  const worldRunning = useLiving((s) => s.worldRunning);
  const setRun = useLiving((s) => s.setWorldRunning);
  const tick = useLiving((s) => s.tickWorld);
  const addAgent = useLiving((s) => s.addAgentToWorld);
  const reseed = useLiving((s) => s.reseedWorld);
  const liveMode = useLiving((s) => s.liveMode);
  const [live, setLive] = useState(false);
  const [controlId, setControlId] = useState<string | null>(null);
  const [inspId, setInspId] = useState<string | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [petHidden, setPetHidden] = useState<boolean>(() => { try { return localStorage.getItem('oc-pet-hidden') === '1'; } catch { return false; } });
  const togglePet = () => setPetHidden((h) => { const n = !h; try { localStorage.setItem('oc-pet-hidden', n ? '1' : '0'); } catch { /* ignore */ } return n; });
  const petHiddenRef = useRef(petHidden); petHiddenRef.current = petHidden;
  const activeSpiritRef = useRef<Spirit | null>(null);   // 随行灵宠当前激活项,render 时同步,RAF 循环只读不查
  const ensureKit = useLiving((s) => s.ensureKit);
  const tameSpirit = useLiving((s) => s.tameSpirit);
  const useBagItem = useLiving((s) => s.useBagItem);
  const setActiveSpirit = useLiving((s) => s.setActiveSpirit);
  const [feedOpen, setFeedOpen] = useState(true);
  const [bgmOn, setBgmOn] = useState(false);
  const [font, setFont] = useState<string>(() => {
    try { const id = localStorage.getItem('oc-world-font'); return FONTS.find((f) => f.id === id)?.css || FONT_DEFAULT; } catch { return FONT_DEFAULT; }
  });
  const [regionC, setRegionC] = useState<[number, number]>(() => (GLOBAL ? REGION_DEFAULT : loadRegion()));  // 全球模式固定同一个镇
  const [showHelp, setShowHelp] = useState<boolean>(() => { try { return !localStorage.getItem('oc-world-seen'); } catch { return true; } });
  const dismissHelp = () => { setShowHelp(false); try { localStorage.setItem('oc-world-seen', '1'); } catch { /* ignore */ } };
  const [, setTalkVer] = useState(0);

  const ref = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Set<string>>(new Set());
  const apos = useRef(new Map<string, PP>());
  const cam = useRef({ cx: MAP_W * (GLOBAL ? REGION_DEFAULT[0] : loadRegion()[0]), cy: MAP_H * (GLOBAL ? REGION_DEFAULT[1] : loadRegion()[1]) });
  const view = useRef({ sx: 0, sy: 0 });
  const mapImg = useRef<CanvasImageSource | null>(null);
  const miniMap = useRef<HTMLCanvasElement | null>(null);   // 雷达用的 1/8 降采样底图(预渲染,免每帧降采)
  const collide = useRef<{ d: Uint8ClampedArray; cw: number; ch: number; cs: number } | null>(null);
  const ocSprite = useRef<HTMLImageElement | null>(null);
  const npcSprites = useRef<HTMLImageElement[]>([]);
  const named = useRef<Record<string, HTMLImageElement>>({});
  const spiritImg = useRef<Record<string, HTMLImageElement>>({});   // 外部灵宠美术(SPIRIT_ART 登记的合规素材),未登记则回退程序化绘制
  const ctrlRef = useRef<string | null>(null); ctrlRef.current = VISIT ? null : (controlId ?? ocId);
  const spectateRef = useRef<string | null>(null);   // 访客观光:当前聚焦的居民
  const nextSpectateAt = useRef(0);
  const nearRef = useRef<string | null>(null);
  const lastT = useRef(0);
  const liveLines = useRef<Map<string, string>>(new Map());  // 真 LLM 气泡台词缓存
  const liveRef = useRef(false); liveRef.current = liveMode.cognition === 'live';
  const fontRef = useRef(font); fontRef.current = font;
  const regionRef = useRef(regionC); regionRef.current = regionC;
  const talkRef = useRef<{ withId: string; lines?: { name: string; text: string }[]; i: number; menu?: boolean } | null>(null);
  const bumpTalk = () => setTalkVer((v) => v + 1);
  // 灵宠玩法本地态:随行轨迹、野生灵宠、临近野生、提示 toast
  const trail = useRef<{ mx: number; my: number }[]>([]);
  const wild = useRef<{ uid: string; species: string; bx: number; by: number; phase: number; r: number; spd: number; label?: string }[]>([]);
  const wildInit = useRef(false);
  const nearWild = useRef<string | null>(null);
  const toastTimer = useRef(0);
  const showToast = (m: string) => { setToast(m); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 1800); };
  const attemptTameRef = useRef<() => void>(() => {});
  attemptTameRef.current = () => {
    if (VISIT) return;
    const id = ctrlRef.current; const cp = id ? apos.current.get(id) : null; if (!cp) return;
    const nowt = performance.now(); let best: { uid: string; species: string } | null = null; let bd = TAME_R * TAME_R;
    for (const wd of wild.current) {
      const wx = wd.bx + Math.cos(nowt * wd.spd + wd.phase) * wd.r, wy = wd.by + Math.sin(nowt * wd.spd + wd.phase) * wd.r;
      const d = (wx - cp.mx) ** 2 + (wy - cp.my) ** 2; if (d < bd) { bd = d; best = wd; }
    }
    if (!best) { showToast('附近没有野生灵宠'); return; }
    if ((useLiving.getState().oc?.bag?.stone || 0) <= 0) { showToast('灵石不足 · 无法收服'); return; }
    if (tameSpirit(best.species)) { const sp = speciesById[best.species]; const bu = best.uid; wild.current = wild.current.filter((x) => x.uid !== bu); showToast('收服成功 · ' + (sp?.name || '灵宠') + ' 加入队伍 ✦'); }
  };
  // ── 互动:飘心表情 / 好感度 / 陪走 / NPC 亲密相会 ──
  const emotes = useRef<{ mx: number; my: number; glyph: string; born: number }[]>([]);
  const affinity = useRef<Map<string, number>>(new Map());
  const companionRef = useRef<string | null>(null);
  const meetRef = useRef<{ a: string; b: string; until: number; met: boolean; lastHeart: number } | null>(null);
  const nextMeetAt = useRef(0);
  const lastMeetEp = useRef(-1);                  // 相会按同步的 epoch 触发(各端一致),而非各自墙钟
  const meetLines = useRef<Map<string, string>>(new Map());
  const popEmote = (mx: number, my: number, glyph: string) => { emotes.current.push({ mx, my, glyph, born: performance.now() }); if (emotes.current.length > 48) emotes.current.shift(); };
  const pairKey = (a: string, b: string) => [a, b].sort().join('|');
  // ── 全球多人联机:本地玩家身份、远端玩家、世界聊天 ──
  const netRef = useRef<NetTransport | null>(null);
  const meSelf = useRef<NetSelf | null>(null);
  const remotes = useRef<Map<string, { x: number; y: number; tx: number; ty: number; dir: string; moving: boolean; flip: boolean; name: string; sprite: string; bubble?: string; bubbleAt: number; last: number }>>(new Map());
  const spriteByName = useRef<Record<string, HTMLImageElement>>({});
  const lastPosSent = useRef(0);
  const isHostRef = useRef(false);                // 主机权威:在场玩家 id 最小者为主机;选举完成前不抢当主机(防脑裂)
  const [isHost, setIsHost] = useState(false);
  const peersCountRef = useRef(1);
  const currentHostRef = useRef<string | null>(null);  // 当前选举出的主机 id(用于校验快照来源)
  const electedRef = useRef(false);
  const syncedRef = useRef(false);                     // 非主机:是否已收到首份主机快照
  const [synced, setSynced] = useState(false);
  const applySnap = useLiving((s) => s.applyWorldSnapshot);
  const [online, setOnline] = useState(1);
  const [chatLog, setChatLog] = useState<{ name: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [netOpen, setNetOpen] = useState(false);
  const [nf, setNf] = useState({ name: '', url: '', key: '' });
  const openNet = () => { const cfg = netConfig(); setNf({ name: playerSelf().name, url: cfg?.url || '', key: cfg?.key || '' }); setNetOpen(true); };
  const saveNet = () => { setPlayerName(nf.name); if (nf.url.trim() && nf.key.trim()) setNetConfig(nf.url, nf.key); else clearNetConfig(); window.location.reload(); };
  // 点击地面走过去的目标(鼠标/触屏通用,替代虚拟摇杆)
  const walkTarget = useRef<{ x: number; y: number } | null>(null);
  // 切换/自定义活动区域:迁移整簇居民到新中心,清位重新落位 + 相机移过去 + 持久化
  const applyRegion = (c: [number, number]) => {
    setRegionC(c);
    try { localStorage.setItem('oc-world-region', JSON.stringify(c)); } catch { /* ignore */ }
    apos.current.clear();
    meetRef.current = null; meetLines.current.clear(); nextMeetAt.current = 0; companionRef.current = null;
    wild.current = []; wildInit.current = false; trail.current = [];   // 随新区域重新散布野生灵宠 + 清随行轨迹
    cam.current.cx = c[0] * MAP_W; cam.current.cy = c[1] * MAP_H;
  };

  useEffect(() => { setRun(true); }, [setRun]);
  // 进世界后首次交互自动轻声播放 BGM(符合浏览器自动播放策略)
  useEffect(() => {
    const kick = () => { if (!bgmPlaying()) setBgmOn(toggleBgm()); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
    window.addEventListener('pointerdown', kick); window.addEventListener('keydown', kick);
    return () => { window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
  }, []);
  useEffect(() => { if (!worldRunning) return; const iv = setInterval(() => { if (isHostRef.current) void tick(); }, 900); return () => clearInterval(iv); }, [worldRunning, tick]);

  useEffect(() => {
    const t = new Image(); t.src = BASE + 'sprites/' + MAP_SRC; t.onload = () => {
      // 碰撞图:原图降采样(白/透明 = 阻挡,玩家只在真实陆地走)
      const cs = 8, cw = Math.ceil(MAP_W / cs), ch = Math.ceil(MAP_H / cs);
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
      const cx2 = cc.getContext('2d'); if (cx2) { cx2.drawImage(t, 0, 0, MAP_W, MAP_H, 0, 0, cw, ch); collide.current = { d: cx2.getImageData(0, 0, cw, ch).data, cw, ch, cs }; }
      // 渲染源:把白/透明填成草绿 → 去掉白色、合并成无缝大地图
      const fc = document.createElement('canvas'); fc.width = MAP_W; fc.height = MAP_H;
      const fx = fc.getContext('2d');
      if (fx) {
        fx.fillStyle = '#5b9c4a'; fx.fillRect(0, 0, MAP_W, MAP_H); fx.drawImage(t, 0, 0);
        // 白→草绿:分条带处理(每条 ~21MB,避免一次性分配 ~167MB 在低内存设备上崩溃/长卡顿)
        try {
          const BAND = 800;
          for (let y0 = 0; y0 < MAP_H; y0 += BAND) {
            const bh = Math.min(BAND, MAP_H - y0);
            const id = fx.getImageData(0, y0, MAP_W, bh), d = id.data;
            for (let i = 0; i < d.length; i += 4) if (d[i] > 228 && d[i + 1] > 228 && d[i + 2] > 228) { d[i] = 91; d[i + 1] = 156; d[i + 2] = 74; }
            fx.putImageData(id, 0, y0);
          }
        } catch { /* taint 等异常则用原绿底图 */ }
        mapImg.current = fc;
        // 预渲染 1/8 降采样底图给雷达(免每帧把 6528×6400 降采)
        const mw = Math.round(MAP_W / 8), mh = Math.round(MAP_H / 8);
        const mc = document.createElement('canvas'); mc.width = mw; mc.height = mh;
        const mcx = mc.getContext('2d'); if (mcx) { mcx.imageSmoothingEnabled = false; mcx.drawImage(fc, 0, 0, MAP_W, MAP_H, 0, 0, mw, mh); miniMap.current = mc; }
      } else mapImg.current = t;
    };
    const ocsp = useLiving.getState().oc?.sprite; const ocBody = ocsp && PLAYER_SPRITES.includes(ocsp) ? ocsp : 'red_normal';
    const r = new Image(); r.src = BASE + 'sprites/chr-' + ocBody + '.png'; ocSprite.current = r;
    npcSprites.current = NPC_CHARS.map((n) => { const im = new Image(); im.src = BASE + 'sprites/chr-' + n + '.png'; return im; });
    for (const nm in NAMED_SPRITE) {
      const im = new Image(); im.src = BASE + 'sprites/chr-' + NAMED_SPRITE[nm] + '.png';
      if (nm === '范范兔') { im.onload = () => { named.current[nm] = recolorHairPurple(im); }; named.current[nm] = im; } // 主角女生:运行时把头发染紫
      else if (nm === '杏子') { im.onload = () => { named.current[nm] = recolorHairBlack(im); }; named.current[nm] = im; } // 黑长直发
      else named.current[nm] = im;
    }
    // 小智作为常驻居民时(玩家操控自创角色)用主角红衣渲染;独立于 NAMED_SPRITE(后者还兼作联机同步白名单,加入会与 OC 重名冲突)
    { const xz = new Image(); xz.src = BASE + 'sprites/chr-red_normal.png'; named.current['小智'] = xz; }
    // 外部灵宠美术(可选):SPIRIT_ART 登记项 + 本地 localStorage 覆盖('oc-spirit-art' = {id:文件名})。
    // 默认两者皆空 = 零 404、用程序化美术。localStorage 覆盖仅供本地自测(不入代码、不影响线上)。
    const artMap: Record<string, string> = { ...SPIRIT_ART };
    try { const ov = JSON.parse(localStorage.getItem('oc-spirit-art') || 'null'); if (ov && typeof ov === 'object') Object.assign(artMap, ov); } catch { /* ignore */ }
    for (const sid in artMap) { const im = new Image(); im.src = BASE + 'sprites/spirits/' + artMap[sid]; spiritImg.current[sid] = im; }
    // 远端玩家精灵集(按玩家 id 哈希分配,玩家之间外观各异)
    for (const n of ['red_normal', 'green_normal', 'boy', 'lass', 'youngster', 'fat_man', 'beauty', 'gentleman']) {
      const im = new Image(); im.src = BASE + 'sprites/chr-' + n + '.png'; spriteByName.current[n] = im;
    }
  }, []);

  // 联机:连接全球世界(或本机多窗口),接收远端玩家与世界聊天
  useEffect(() => {
    const net = makeNet(); netRef.current = net;
    // 联机昵称默认沿用 OC 名(避免"训练师-xxxx"与 OC 名两套身份)
    const ocNm = useLiving.getState().oc?.name;
    if (ocNm && /^训练师-/.test(playerSelf().name)) setPlayerName(ocNm);
    // 访客 id 加 'z' 前缀使其排序最后 → 永不被选为主机(只读旁观)
    const base = playerSelf();
    const ocsp = useLiving.getState().oc?.sprite; if (ocsp && PLAYER_SPRITES.includes(ocsp)) base.sprite = ocsp;   // 广播给其他玩家的身体 = 所选像素小人,保证同屏一致
    const me: NetSelf = VISIT ? { ...base, id: 'z' + base.id } : base; meSelf.current = me;
    net.onPos((p) => {
      if (p.id === me.id) return;
      const r = remotes.current.get(p.id) || { x: p.x, y: p.y, tx: p.x, ty: p.y, dir: p.dir, moving: p.moving, flip: p.flip, name: p.name, sprite: p.sprite, bubbleAt: 0, last: 0 };
      r.tx = p.x; r.ty = p.y; r.dir = p.dir; r.moving = p.moving; r.flip = p.flip; r.name = p.name; r.sprite = p.sprite; r.last = performance.now();
      remotes.current.set(p.id, r);
    });
    net.onChat((m) => {
      setChatLog((l) => [...l.slice(-49), { name: m.name, text: m.text }]);
      if (m.id !== me.id) { const r = remotes.current.get(m.id); if (r) { r.bubble = m.text; r.bubbleAt = performance.now(); } }
    });
    net.onPresence((n) => setOnline(n));
    // 主机选举:在场玩家 id 最小者为主机(访客除外);记录当前主机以校验快照来源
    net.onPeers((ids) => {
      peersCountRef.current = ids.length || 1;
      const host = ids.slice().sort()[0] || me.id; currentHostRef.current = host;
      const amHost = !VISIT && host === me.id; isHostRef.current = amHost; electedRef.current = true; setIsHost(amHost);
    });
    // 非主机:仅落地"当前选举出的主机"的快照(忽略已降级旧主机的过期快照,防脑裂污染)
    net.onWorld((snap) => { if (!isHostRef.current && (!snap.host || !currentHostRef.current || snap.host === currentHostRef.current)) { applySnap(snap); if (!syncedRef.current) { syncedRef.current = true; setSynced(true); } } });
    void net.connect('global', me);
    // 安全兜底:若 2s 内仍未选举(如独自且 presence 未同步),非访客自任主机,保证世界推进
    const electTimer = setTimeout(() => { if (!electedRef.current && !VISIT) { isHostRef.current = true; setIsHost(true); currentHostRef.current = me.id; } }, 2000);
    // 主机:每 ~0.8s 广播共享世界快照(5 位居民完整内部态 + 居民 feed + 纪元 + 供给;独自时不广播)
    const snapIv = setInterval(() => {
      if (!isHostRef.current || peersCountRef.current <= 1) return;
      const w = useLiving.getState().world; if (!w) return;
      const npc = w.order.map((id) => w.agents[id]).filter((a) => a && NAMED_SPRITE[a.name] && a.id !== ocId).map((a) => ({ name: a.name, loc: a.loc, mood: a.mood, balance: a.balance, needs: a.needs as unknown as Record<string, number>, rng: a.rngState, rel: a.rel }));
      const feed = w.feed.filter((p) => NAMED_SPRITE[p.name] && p.agentId !== ocId).slice(0, 8).map((p) => ({ id: p.id, agentId: p.agentId, name: p.name, action: p.action as string, text: p.text, ev: p.ev?.kind ?? null }));
      netRef.current?.sendWorld({ host: me.id, e: w.epoch, supply: w.stats.supply, npc, feed });
    }, 800);
    return () => { clearTimeout(electTimer); clearInterval(snapIv); try { net.disconnect(); } catch { /* ignore */ } netRef.current = null; remotes.current.clear(); };
  }, []);
  const sendChat = () => { const t = chatInput.trim(); if (!t || !netRef.current) return; netRef.current.sendChat(t.slice(0, 120)); setChatInput(''); };

  // 真 LLM 气泡:开启「真 LLM」后,逐个角色每 ~3s 取一句 Claude 生成的主题台词,缓存覆盖离线库
  useEffect(() => {
    if (liveMode.cognition !== 'live') { liveLines.current.clear(); return; }
    const w0 = useLiving.getState().world; if (!w0) return;
    const names = Object.keys(LINE_BANKS); let k = 0; let stop = false;
    const pump = async () => {
      if (stop) return;
      const w = useLiving.getState().world;
      const nm = names[k % names.length]; k++;
      const a = w && Object.values(w.agents).find((x) => x.name === nm);
      if (a) { const line = await liveSay(a.name, a.bio); if (line && !stop) { liveLines.current.set(nm, line); } }
    };
    const iv = setInterval(pump, 3000); void pump();
    return () => { stop = true; clearInterval(iv); };
  }, [liveMode.cognition]);

  // 离线对话(无后端/未开真 LLM 时):用台词库拼一小段小智×伙伴的对话
  const offlineTalk = (meName: string, fr: Agent): { name: string; text: string }[] => {
    const fb = LINE_BANKS[fr.name] || ['嗨~'], s = Math.floor(Date.now() / 1000);
    return [
      { name: meName, text: `${fr.name},今天过得怎样?` },
      { name: fr.name, text: fb[s % fb.length] },
      { name: meName, text: '哈哈,那走啦,一起去恰个饭?' },
      { name: fr.name, text: fb[(s + 2) % fb.length] },
    ];
  };
  const startTalk = async (friendId: string) => {
    const w = useLiving.getState().world; if (!w) return;
    const fr = w.agents[friendId]; const me = (ctrlRef.current && w.agents[ctrlRef.current]) || null; if (!fr || !me) return;
    talkRef.current = { withId: friendId, lines: [{ name: me.name, text: '…' }], i: 0 }; bumpTalk();
    let lines: { name: string; text: string }[] | null = null;
    if (liveRef.current) lines = await liveTalk({ name: me.name, bio: me.bio }, { name: fr.name, bio: fr.bio });
    if (!lines) lines = offlineTalk(me.name, fr);
    talkRef.current = { withId: friendId, lines, i: 0 }; bumpTalk();
  };
  // 走近伙伴 → 打开互动动作菜单
  const openMenu = (friendId: string) => { talkRef.current = { withId: friendId, i: 0, menu: true }; bumpTalk(); };
  // 执行一个互动动作:闲聊(可接 LLM)/ 夸夸 / 约饭 / 抱抱 / 陪走
  const doAction = (friendId: string, action: string) => {
    const w = useLiving.getState().world; if (!w) return;
    const fr = w.agents[friendId]; const meId = ctrlRef.current; const me = (meId && w.agents[meId]) || null; if (!fr || !me || !meId) return;
    if (action === 'chat') { void startTalk(friendId); return; }
    if (action === 'follow') {
      const on = companionRef.current === friendId; companionRef.current = on ? null : friendId;
      const fp = apos.current.get(friendId); if (fp) popEmote(fp.mx, fp.my - 36, on ? '✦' : '♥');
      talkRef.current = null; bumpTalk(); return;
    }
    const fb = LINE_BANKS[fr.name] || ['嗨~']; const s = Math.floor(Date.now() / 1000);
    let lines: { name: string; text: string }[];
    let glyph = '♪', gain = 1;
    if (action === 'praise') { glyph = '✦'; gain = 2; lines = [{ name: me.name, text: `${fr.name},你今天也超棒的!` }, { name: fr.name, text: fb[s % fb.length] }, { name: me.name, text: '嘿嘿…真心的。' }]; }
    else if (action === 'meal') { glyph = '✿'; gain = 2; lines = [{ name: me.name, text: `${fr.name},一起去恰个饭?` }, { name: fr.name, text: fb[(s + 1) % fb.length] }, { name: me.name, text: '走!我跟你去。' }]; }
    else { glyph = '♥'; gain = 3; lines = [{ name: me.name, text: `${fr.name},来抱一个 (つ´∀\`)つ` }, { name: fr.name, text: fb[(s + 2) % fb.length] }]; } // hug
    const fp = apos.current.get(friendId), mp = apos.current.get(meId);
    if (fp) popEmote(fp.mx, fp.my - 36, glyph); if (mp) popEmote(mp.mx, mp.my - 36, glyph);
    const key = pairKey(meId, friendId); affinity.current.set(key, (affinity.current.get(key) || 0) + gain);
    talkRef.current = { withId: friendId, lines, i: 0 }; bumpTalk();
  };

  useEffect(() => { if (!VISIT) ensureKit(); }, [ensureKit]);
  // 切换操控角色时清空随行轨迹,避免灵宠从旧角色位置「拖影/瞬移」过来
  useEffect(() => { trail.current = []; }, [controlId]);

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (VISIT) return;                                 // 访客观光:只读,不接受键盘操控
      const ae = document.activeElement; if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return; // 输入框聚焦时不触发移动
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) { keys.current.add(k); e.preventDefault(); }
      if (k === 'b') { setBagOpen((o) => !o); return; }        // 背包
      if (k === 'c') { attemptTameRef.current(); return; }     // 收服临近野生灵宠
      if (k === ' ') {
        const tk = talkRef.current;
        if (tk) {
          if (tk.menu) { talkRef.current = null; bumpTalk(); }           // 菜单中按空格 = 关闭
          else { tk.i++; if (!tk.lines || tk.i >= tk.lines.length) talkRef.current = null; bumpTalk(); }
        } else if (nearRef.current) openMenu(nearRef.current);           // 走近按空格 = 打开互动菜单
      }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let errLogged = false; const dpr = Math.min(2, window.devicePixelRatio || 1);  // 像素画 dpr 封顶 2,省高分屏填充率
    const walkable = (mx: number, my: number) => {
      const c = collide.current; if (!c) return true;
      const gx = Math.max(0, Math.min(c.cw - 1, mx / c.cs | 0)), gy = Math.max(0, Math.min(c.ch - 1, my / c.cs | 0));
      const i = (gy * c.cw + gx) * 4; if (c.d[i + 3] < 30) return false;
      return !(c.d[i] > 232 && c.d[i + 1] > 232 && c.d[i + 2] > 232);
    };
    // 灵宠绘制:登记了合规外部美术则用图片,否则回退内置原创程序化绘制
    // frame:连续浮点「呼吸相位」(典型取值 sin(...)∈[-1,1]),驱动静止时也有的轻微上下浮动,而非旧版离散两帧硬切。
    const drawCreature = (cx: number, cy: number, size: number, sid: string, frame: number, faceLeft: boolean) => {
      const img = spiritImg.current[sid];
      if (img && img.complete && img.naturalWidth) {
        const s = size * 1.35, bob = -frame * size * 0.06;
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(cx, cy - s / 2 + bob); if (faceLeft) ctx.scale(-1, 1);
        ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore();
      } else drawSpirit(ctx, cx, cy, size, sid, frame, faceLeft);
    };
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - (lastT.current || now)) / 1000); lastT.current = now;
      const w = useLiving.getState().world;
      const VW = canvas.clientWidth, VH = canvas.clientHeight;
      if (canvas.width !== VW * dpr || canvas.height !== VH * dpr) { canvas.width = VW * dpr; canvas.height = VH * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, VW, VH);
      try {
      const ctrl = ctrlRef.current;
      // 1. 位置更新
      if (w) for (const id of w.order) {
        const a = w.agents[id]; if (!a) continue; const loc = locById[a.loc]; if (!loc) continue;
        const ro = ANCHOR_OFFSETS[loc.id] || [0, 0], rc = GLOBAL ? REGION_DEFAULT : regionRef.current; const anchor: [number, number] = [rc[0] + ro[0], rc[1] + ro[1]];
        let pp = apos.current.get(id);
        if (!pp) { pp = { mx: anchor[0] * MAP_W, my: anchor[1] * MAP_H, dir: 'down', moving: false }; apos.current.set(id, pp); }
        if (id === ctrl) {
          let vx = 0, vy = 0; const K = keys.current;
          if (!talkRef.current) { // 对话中冻结移动
            if (K.has('a') || K.has('arrowleft')) vx -= 1; if (K.has('d') || K.has('arrowright')) vx += 1;
            if (K.has('w') || K.has('arrowup')) vy -= 1; if (K.has('s') || K.has('arrowdown')) vy += 1;
            if (vx || vy) walkTarget.current = null;                       // 键盘输入取消点击寻路
            else if (walkTarget.current) {                                 // 点击地面 → 朝目标走(鼠标/触屏通用)
              const dx = walkTarget.current.x - pp.mx, dy = walkTarget.current.y - pp.my, d = Math.hypot(dx, dy);
              if (d > 6) { vx = dx / d; vy = dy / d; } else walkTarget.current = null;
            }
          }
          const len = Math.hypot(vx, vy) || 1; const nx = pp.mx + (vx / len) * SPEED * dt, ny = pp.my + (vy / len) * SPEED * dt;
          if (walkable(nx, ny)) { pp.mx = nx; pp.my = ny; }
          else { if (walkable(nx, pp.my)) pp.mx = nx; if (walkable(pp.mx, ny)) pp.my = ny; } // 贴墙滑动
          pp.mx = Math.max(8, Math.min(MAP_W - 8, pp.mx)); pp.my = Math.max(8, Math.min(MAP_H - 8, pp.my));
          pp.moving = vx !== 0 || vy !== 0;
          if (pp.moving) { pp.dir = Math.abs(vx) > Math.abs(vy) ? 'side' : (vy < 0 ? 'up' : 'down'); pp.flip = vx > 0; }
        } else {
          const jx = (hue('x' + id) / 360 - 0.5) * 44, jy = (hue('y' + id) / 360 - 0.5) * 44;
          let tx = anchor[0] * MAP_W + jx, ty = anchor[1] * MAP_H + jy;
          const m = meetRef.current;
          if (!GLOBAL && companionRef.current === id && ctrl) {
            const cp = apos.current.get(ctrl); if (cp) { tx = cp.mx - 30 + jx * 0.35; ty = cp.my + 6 + jy * 0.35; } // 陪走:跟在玩家身后(全球模式禁用,避免 NPC 偏离主机)
          } else if (m && (id === m.a || id === m.b)) {
            const op = apos.current.get(id === m.a ? m.b : m.a);                                                   // 相会:走向对方,留间距
            if (op) { const ang = Math.atan2(op.my - pp.my, op.mx - pp.mx); tx = op.mx - Math.cos(ang) * 22; ty = op.my - Math.sin(ang) * 22; }
          }
          const ddx = tx - pp.mx, ddy = ty - pp.my, dist = Math.hypot(ddx, ddy);
          if (dist > 2) { const step = Math.min(dist, NPC_SPEED * dt); pp.mx += (ddx / dist) * step; pp.my += (ddy / dist) * step; pp.moving = dist > 3; pp.dir = Math.abs(ddx) > Math.abs(ddy) ? 'side' : (ddy < 0 ? 'up' : 'down'); pp.flip = ddx > 0; }
          else pp.moving = false;
        }
      }
      // 1b. 伙伴亲密相会调度:每隔一会儿,两位伙伴自己凑到一起说悄悄话、头顶飘心
      if (w) {
        const m = meetRef.current;
        if (m) {
          const pa = apos.current.get(m.a), pb = apos.current.get(m.b);
          if (now > m.until || !pa || !pb) { meetRef.current = null; meetLines.current.clear(); }
          else if (Math.hypot(pa.mx - pb.mx, pa.my - pb.my) < 30) {
            m.met = true;
            if (now - m.lastHeart > 650) { m.lastHeart = now; popEmote((pa.mx + pb.mx) / 2, (pa.my + pb.my) / 2 - 26, '♥'); }
            const k = pairKey(m.a, m.b); affinity.current.set(k, (affinity.current.get(k) || 0) + 0.02);
          }
        } else if (w.epoch !== lastMeetEp.current && w.epoch % 8 === 0) {
          // 相会按同步的 epoch 触发、用 epoch 哈希选配对 → 全球各端一致的相遇动态
          lastMeetEp.current = w.epoch;
          const friends = w.order.filter((id) => w.agents[id] && NAMED_SPRITE[w.agents[id].name] && id !== companionRef.current && id !== ocId).sort();
          if (friends.length >= 2) {
            const h = hue('m' + w.epoch);
            const a = friends[h % friends.length];
            let b = friends[(h + 1 + ((h >> 3) % (friends.length - 1))) % friends.length];
            if (b === a) b = friends[(friends.indexOf(a) + 1) % friends.length];
            if (b !== a) {
              const pl = PAIR_LINES[h % PAIR_LINES.length];
              meetRef.current = { a, b, until: now + 9000, met: false, lastHeart: 0 };
              meetLines.current.clear(); meetLines.current.set(a, pl[0]); meetLines.current.set(b, pl[1]);
            }
          }
        }
      }
      // 1c. 广播本地玩家位置。Supabase Free 有 100 msg/s + N+1 扇出硬限(有效率≈限额/人数),
      //     故移动时 ~6.7Hz、静止每 3s 心跳,且只读访客不广播。
      if (!VISIT && netRef.current && ctrl && meSelf.current) {
        const mp = apos.current.get(ctrl);
        if (mp && now - lastPosSent.current > 150 && (mp.moving || now - lastPosSent.current > 3000)) {
          lastPosSent.current = now; const s = meSelf.current;
          netRef.current.sendPos({ id: s.id, name: s.name, sprite: s.sprite, x: +(mp.mx / MAP_W).toFixed(4), y: +(mp.my / MAP_H).toFixed(4), dir: mp.dir, moving: mp.moving, flip: !!mp.flip });
        }
      }
      // 2. 相机跟随(平滑缓动)+ 源切片。访客观光:自动巡游,每 ~10s 换一个居民聚焦
      let cpp = ctrl ? apos.current.get(ctrl) : null;
      if (VISIT && w) {
        if (now > nextSpectateAt.current || !spectateRef.current || !apos.current.get(spectateRef.current)) {
          const ids = w.order.filter((id) => apos.current.get(id));
          if (ids.length) { spectateRef.current = ids[Math.floor(Math.random() * ids.length)]; nextSpectateAt.current = now + 10000; }
        }
        cpp = spectateRef.current ? apos.current.get(spectateRef.current) || null : null;
      }
      if (cpp) { const f = Math.min(1, dt * (VISIT ? 3.5 : 8)); cam.current.cx += (cpp.mx - cam.current.cx) * f; cam.current.cy += (cpp.my - cam.current.cy) * f; }
      if (!VISIT && cpp) { trail.current.push({ mx: cpp.mx, my: cpp.my }); if (trail.current.length > 60) trail.current.shift(); }   // 随行灵宠轨迹
      const sw = VW / MAP_SCALE, sh = VH / MAP_SCALE;
      const srcX = Math.max(0, Math.min(MAP_W - sw, cam.current.cx - sw / 2));
      const srcY = Math.max(0, Math.min(MAP_H - sh, cam.current.cy - sh / 2));
      view.current.sx = srcX; view.current.sy = srcY;
      const SX = (mx: number) => (mx - srcX) * MAP_SCALE, SY = (my: number) => (my - srcY) * MAP_SCALE;
      // 3. 底图(只画可见切片)
      ctx.fillStyle = '#0b0b0d'; ctx.fillRect(0, 0, VW, VH);
      const tm = mapImg.current;
      if (tm) { ctx.imageSmoothingEnabled = false; ctx.drawImage(tm, srcX, srcY, sw, sh, 0, 0, VW, VH); }
      // 4. 昼夜(实时平滑循环:约 180s 一轮昼夜,不再随 epoch 频闪)
      const ph = (now / 180000) % 1, sun = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
      const night = Math.max(0, 1 - sun * 1.15), golden = sun > 0.02 ? Math.max(0, 1 - Math.abs(sun - 0.25) / 0.25) : 0;
      if (night > 0.01) { ctx.fillStyle = `rgba(14,18,54,${(night * 0.5).toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
      if (golden > 0.01) { ctx.fillStyle = `rgba(255,150,60,${(golden * 0.14).toFixed(3)})`; ctx.fillRect(0, 0, VW, VH); }
      // 5.(地点标签已移除:6 个据点同处海边小岬,标签会互相重叠,改为干净画面)
      const fam = fontRef.current;
      ctx.textAlign = 'center';
      if (!w) { raf = requestAnimationFrame(draw); return; }
      // 6b. 野生灵宠初始化(围绕活动区域散布,玩家本地态)
      if (!wildInit.current) {
        wildInit.current = true;
        const rc = GLOBAL ? REGION_DEFAULT : regionRef.current; const ccx = rc[0] * MAP_W, ccy = rc[1] * MAP_H;
        // 区域指纹 → 本区物种池:不同活动区域出没不同灵宠组合(SPECIES 共 7 种、7 为质数,任意步长都能取满不重复),换区有探索感。
        // 用完整 32 位哈希且起点/步长取自不同位段 —— hue() 会 %360 丢熵,曾致林海码头与南滨沙滩物种池完全相同(审查修正)。
        const key = 'wild:' + rc[0].toFixed(4) + ',' + rc[1].toFixed(4);
        let rh = 0; for (let k = 0; k < key.length; k++) rh = (rh * 31 + key.charCodeAt(k)) >>> 0;
        const start = rh % SPECIES.length, stride = 1 + ((rh >>> 8) % 3);
        for (let i = 0; i < 5; i++) { const sp = SPECIES[(start + i * stride) % SPECIES.length]; const ang = (i / 5) * Math.PI * 2; wild.current.push({ uid: 'w' + i, species: sp.id, bx: ccx + Math.cos(ang) * (84 + i * 22), by: ccy + Math.sin(ang) * (76 + i * 18), phase: i * 1.3, r: 14 + (i % 3) * 6, spd: 0.0006 + i * 0.0001 }); }
      }
      // 6. 最近可交互居民
      let near: string | null = null;
      if (cpp && ctrl) { let bd = INTERACT_R * INTERACT_R; for (const id of w.order) { if (id === ctrl) continue; const p = apos.current.get(id); if (!p) continue; const d = (p.mx - cpp.mx) ** 2 + (p.my - cpp.my) ** 2; if (d < bd) { bd = d; near = id; } } }
      nearRef.current = near;
      // 7. 居民(按 y 排序)
      const t = Math.floor(now / 180);
      const order = [...w.order].sort((a, b) => (apos.current.get(a)?.my ?? 0) - (apos.current.get(b)?.my ?? 0));
      for (const id of order) {
        const a = w.agents[id]; const pp = apos.current.get(id); if (!a || !pp) continue;
        const sx = SX(pp.mx), sy = SY(pp.my);
        if (sx < -TILE * 2 || sx > VW + TILE * 2 || sy < -TILE * 3 || sy > VH + TILE * 2) continue;
        const isOc = id === ocId, isCtrl = id === ctrl, isNear = id === near;
        const cW = TILE * 1.05, cH = cW * 2;
        const fr = FRAME[pp.dir] || FRAME.down; const fi = pp.moving ? fr.walk[t % 2] : fr.idle;
        const img = isOc ? ocSprite.current : (named.current[a.name] || npcSprites.current[hue(id) % npcSprites.current.length]);
        const flip = pp.flip && pp.dir === 'side';
        ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(sx, sy + 1, cW * 0.34, cW * 0.13, 0, 0, 7); ctx.fill();
        if (isCtrl) { ctx.strokeStyle = '#ff2d2d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, sy - cH * 0.36, cW * 0.85, 0, 7); ctx.stroke(); }
        else if (isNear) { ctx.strokeStyle = 'rgba(255,210,80,.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy - cH * 0.36, cW * 0.8, 0, 7); ctx.stroke(); }
        if (img && img.complete && img.naturalWidth) {
          ctx.imageSmoothingEnabled = false; const dy0 = sy + 2 - cH;
          if (flip) { ctx.save(); ctx.translate(sx + cW / 2, dy0); ctx.scale(-1, 1); ctx.drawImage(img, fi * 16, 0, 16, 32, 0, 0, cW, cH); ctx.restore(); }
          else ctx.drawImage(img, fi * 16, 0, 16, 32, sx - cW / 2, dy0, cW, cH);
        }
        const label = a.name + (isOc ? ' ★' : '');
        ctx.font = (isCtrl ? '600 ' : '') + '12px ' + fam;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.85)'; ctx.strokeText(label, sx, sy + 14);
        ctx.fillStyle = isCtrl ? '#ff2d2d' : 'rgba(245,245,247,.95)'; ctx.fillText(label, sx, sy + 14);
        if (isNear) { ctx.fillStyle = 'rgba(255,210,80,.95)'; ctx.font = '11px ' + fam; ctx.fillText('空格 · 互动 ♥', sx, sy - cH - 4); }
        // 与玩家的好感 / 陪走 标记
        if (!isCtrl) {
          const aff = (ocId && affinity.current.get(pairKey(ocId, id))) || 0;
          const mark = companionRef.current === id ? '✦ 陪走' : aff >= 6 ? '♥♥' : aff >= 3 ? '♥' : '';
          if (mark) { ctx.font = '11px ' + fam; ctx.fillStyle = mark[0] === '✦' ? '#ffd24d' : '#ff5d8f'; ctx.fillText(mark, sx, sy + 27); }
        }
        // 头顶对话气泡(相会悄悄话优先 → 真 LLM → 离线台词库)
        const bank = LINE_BANKS[a.name];
        const forced = (meetRef.current?.met && meetLines.current.get(id)) || null;
        if (forced || (bank && bank.length)) {
          const bline = forced || (liveRef.current && liveLines.current.get(a.name)) || bank[(Math.floor(now / 9000) + hue(id)) % bank.length];
          if (talkRef.current?.withId !== id) bubble(ctx, sx, sy - cH - (isNear ? 18 : 6), bline, fam);
        }
      }
      // 7b. 野生灵宠(原创 monster-tamer 玩法;玩家本地态,不入确定性世界)
      nearWild.current = null;
      if (wild.current.length) {
        let wbd = TAME_R * TAME_R;
        const labelFont = '10px ' + fam;   // 循环体内每只灵宠都一样,提到循环外设一次,省 canvas 状态切换
        for (const wd of wild.current) {
          const wx = wd.bx + Math.cos(now * wd.spd + wd.phase) * wd.r, wy = wd.by + Math.sin(now * wd.spd + wd.phase) * wd.r;
          const sx = SX(wx), sy = SY(wy);
          if (sx < -TILE * 2 || sx > VW + TILE * 2 || sy < -TILE * 3 || sy > VH + TILE * 2) continue;
          if (cpp) { const d = (wx - cpp.mx) ** 2 + (wy - cpp.my) ** 2; if (d < wbd) { wbd = d; nearWild.current = wd.uid; } }
          const sz = TILE * 0.78;
          ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx, sy, sz * 0.32, sz * 0.13, 0, 0, 7); ctx.fill();
          drawCreature(sx, sy, sz, wd.species, Math.sin(now / 420 + wd.phase * 3), false);   // 各自相位错开,呼吸不同步更自然
          const sp = speciesById[wd.species]; const label = wd.label ?? (wd.label = '野生·' + (sp?.name ?? ''));   // 标签字符串按个体缓存,免每帧拼接
          ctx.font = labelFont; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.8)';
          ctx.strokeText(label, sx, sy + 13); ctx.fillStyle = 'rgba(220,255,220,.9)'; ctx.fillText(label, sx, sy + 13);
          if (nearWild.current === wd.uid) { ctx.fillStyle = 'rgba(140,255,170,.96)'; ctx.font = '11px ' + fam; ctx.fillText('C · 收服', sx, sy - sz - 4); }
        }
      }
      // 7c. 随行灵宠(玩家激活的灵宠,跟在控制角色身后;可在灵宠面板隐藏)
      if (!VISIT && !petHiddenRef.current && cpp && trail.current.length > 6) {
        const act = activeSpiritRef.current;   // render 时同步好的 ref,免每帧 getState()+find()
        if (act) {
          const idx = Math.max(0, trail.current.length - 1 - 14), f = trail.current[idx], fp = trail.current[Math.max(0, idx - 4)];
          const fx = SX(f.mx), fy = SY(f.my), sz = TILE * 0.82;
          ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(fx, fy, sz * 0.32, sz * 0.13, 0, 0, 7); ctx.fill();
          drawCreature(fx, fy, sz, act.species, Math.sin(now / 420), f.mx < fp.mx - 0.5);
        }
      }
      // 7a. 远端玩家(其他真人):插值移动 + 蓝圈 + 名牌 + 聊天气泡;12s 无更新视为离线
      for (const [rid, r] of remotes.current) {
        if (now - r.last > 12000) { remotes.current.delete(rid); continue; }
        const lerp = Math.min(1, dt * 10); r.x += (r.tx - r.x) * lerp; r.y += (r.ty - r.y) * lerp;
        const rx = SX(r.x * MAP_W), ry = SY(r.y * MAP_H);
        if (rx < -TILE * 2 || rx > VW + TILE * 2 || ry < -TILE * 3 || ry > VH + TILE * 2) continue;
        const cW = TILE * 1.05, cH = cW * 2;
        const img = spriteByName.current[r.sprite] || spriteByName.current['green_normal'];
        const frRm = FRAME[r.dir] || FRAME.down; const fiRm = r.moving ? frRm.walk[t % 2] : frRm.idle;
        ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.beginPath(); ctx.ellipse(rx, ry + 1, cW * 0.34, cW * 0.13, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(110,200,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(rx, ry - cH * 0.36, cW * 0.8, 0, 7); ctx.stroke();
        if (img && img.complete && img.naturalWidth) {
          ctx.imageSmoothingEnabled = false; const dy0 = ry + 2 - cH;
          if (r.flip && r.dir === 'side') { ctx.save(); ctx.translate(rx + cW / 2, dy0); ctx.scale(-1, 1); ctx.drawImage(img, fiRm * 16, 0, 16, 32, 0, 0, cW, cH); ctx.restore(); }
          else ctx.drawImage(img, fiRm * 16, 0, 16, 32, rx - cW / 2, dy0, cW, cH);
        }
        ctx.font = '11px ' + fam; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,9,11,.85)';
        ctx.strokeText(r.name, rx, ry + 14); ctx.fillStyle = 'rgba(150,215,255,.97)'; ctx.fillText(r.name, rx, ry + 14);
        if (r.bubble && now - r.bubbleAt < 6000) bubble(ctx, rx, ry - cH - 6, r.bubble, fam);
      }
      // 7b. 飘心 / 表情粒子(互动与相会时升起)
      for (let i = emotes.current.length - 1; i >= 0; i--) {
        const e = emotes.current[i], age = now - e.born, LIFE = 1400;
        if (age > LIFE) { emotes.current.splice(i, 1); continue; }
        const kk = age / LIFE, ex = SX(e.mx), ey = SY(e.my) - kk * 28;
        if (ex < -20 || ex > VW + 20 || ey < -20 || ey > VH + 20) continue;
        ctx.globalAlpha = 1 - kk * kk; ctx.font = (15 + kk * 7) + 'px ' + fam; ctx.textAlign = 'center';
        ctx.fillStyle = e.glyph === '♥' ? '#ff5d8f' : e.glyph === '✦' ? '#ffd24d' : e.glyph === '✿' ? '#b07cf0' : '#7fd0ff';
        ctx.fillText(e.glyph, ex, ey); ctx.globalAlpha = 1;
      }
      // ── 小地图雷达(右下):黄=伙伴 红=你 ──
      if (cpp) {
        const MM = 168, mg = 16, mx0 = VW - MM - mg, my0 = VH - MM - mg, RR = 1500;
        ctx.save();
        rrect(ctx, mx0, my0, MM, MM, 10); ctx.fillStyle = 'rgba(8,9,11,.7)'; ctx.fill(); ctx.clip();
        const tmm = miniMap.current || mapImg.current; const ms = miniMap.current ? 1 / 8 : 1;
        if (tmm) { ctx.imageSmoothingEnabled = false; ctx.drawImage(tmm, (cpp.mx - RR) * ms, (cpp.my - RR) * ms, RR * 2 * ms, RR * 2 * ms, mx0, my0, MM, MM); }
        ctx.fillStyle = 'rgba(8,9,11,.32)'; ctx.fillRect(mx0, my0, MM, MM);
        for (const id of w.order) {
          const p = apos.current.get(id); if (!p) continue;
          const ddx = (p.mx - cpp.mx) / RR, ddy = (p.my - cpp.my) / RR;
          if (Math.abs(ddx) > 1 || Math.abs(ddy) > 1) continue;
          const px = mx0 + MM / 2 + ddx * MM / 2, py = my0 + MM / 2 + ddy * MM / 2, me = id === ctrl;
          ctx.fillStyle = me ? '#ff2d2d' : 'rgba(255,210,80,.95)';
          ctx.beginPath(); ctx.arc(px, py, me ? 4 : 3, 0, 7); ctx.fill();
          if (me) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
        }
        for (const [, r] of remotes.current) {                       // 远端玩家:青蓝点
          const ddx = (r.x * MAP_W - cpp.mx) / RR, ddy = (r.y * MAP_H - cpp.my) / RR;
          if (Math.abs(ddx) > 1 || Math.abs(ddy) > 1) continue;
          ctx.fillStyle = 'rgba(110,200,255,.95)'; ctx.beginPath(); ctx.arc(mx0 + MM / 2 + ddx * MM / 2, my0 + MM / 2 + ddy * MM / 2, 3, 0, 7); ctx.fill();
        }
        // 区域预设标记:绿色菱形;范围外贴雷达边缘指方向(整张大地图可导航)。当前区(≈聚落中心)不画,避免糊住中心。
        // 全球模式不画:共享世界固定在 REGION_DEFAULT,不能换区,标记会指向去不了的地方(审查修正)。
        const curRc = regionRef.current;
        if (!GLOBAL) for (const rg of REGIONS) {
          if (rg.c[0] === curRc[0] && rg.c[1] === curRc[1]) continue;
          let ddx = (rg.c[0] * MAP_W - cpp.mx) / RR, ddy = (rg.c[1] * MAP_H - cpp.my) / RR;
          const far = Math.max(Math.abs(ddx), Math.abs(ddy));
          const out = far > 0.92; if (out) { ddx = ddx / far * 0.92; ddy = ddy / far * 0.92; }   // 贴边:等比缩到方形边界,保方向
          const px = mx0 + MM / 2 + ddx * MM / 2, py = my0 + MM / 2 + ddy * MM / 2, rr2 = out ? 2.6 : 3.4;
          ctx.fillStyle = out ? 'rgba(140,230,160,.75)' : 'rgba(140,230,160,.95)';
          ctx.beginPath(); ctx.moveTo(px, py - rr2); ctx.lineTo(px + rr2, py); ctx.lineTo(px, py + rr2); ctx.lineTo(px - rr2, py); ctx.closePath(); ctx.fill();
          if (!out) { ctx.strokeStyle = 'rgba(8,9,11,.7)'; ctx.lineWidth = 1; ctx.stroke(); }
        }
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,45,45,.5)'; ctx.lineWidth = 1.5; rrect(ctx, mx0, my0, MM, MM, 10); ctx.stroke();
      }
      } catch (err) { if (!errLogged) { errLogged = true; console.error('[WorldView] 绘制循环出错(后续同类错误已抑制):', err); } }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ocId]);

  // 点击/触摸:点居民(站在旁边=互动,远处=接管),点空地=走过去 —— 鼠标与触屏通用
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = useLiving.getState().world; if (!w) return;
    if (talkRef.current) return;                                  // 对话/菜单进行中,交给对话框处理
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = view.current.sx + (e.clientX - rect.left) / MAP_SCALE, my = view.current.sy + (e.clientY - rect.top) / MAP_SCALE;
    let best: string | null = null, bd = 28 * 28;
    for (const id of w.order) { const p = apos.current.get(id); if (!p) continue; const d = (p.mx - mx) ** 2 + (p.my - 16 - my) ** 2; if (d < bd) { bd = d; best = id; } }
    if (VISIT) {                                                  // 访客观光:只读,点居民=聚焦+查看,不接管/不移动
      if (best) { spectateRef.current = best; nextSpectateAt.current = performance.now() + 12000; setInspId(best); }
      return;
    }
    if (best) {
      const c = ctrlRef.current, cp = c ? apos.current.get(c) : null, bp = apos.current.get(best);
      const adjacent = !!cp && !!bp && best !== c && ((cp.mx - bp.mx) ** 2 + (cp.my - bp.my) ** 2) < (INTERACT_R * 2.2) ** 2;
      if (adjacent) openMenu(best);                               // 站旁边点 TA → 互动菜单
      else if (GLOBAL) setInspId(best);                           // 全球模式:只看不接管(只操控自己的 OC)
      else { setControlId(best); setInspId(best); }               // 单机:点别的居民 → 接管 + 查看
    } else {
      walkTarget.current = { x: mx, y: my };                      // 点空地 → 走过去
    }
  };

  const w = useLiving.getState().world;
  const ctrl = controlId ?? ocId;
  const ctrlA = w && ctrl ? w.agents[ctrl] : undefined;
  const inspA = w && inspId ? w.agents[inspId] : undefined;
  const ocName = w && ocId ? w.agents[ocId]?.name : null;
  // 小智:可能就是玩家的 OC(默认),也可能是玩家操控自创角色时的常驻居民 —— 两种都能「回到小智」
  const xiaozhiId = (w ? (w.order.find((id) => w.agents[id]?.name === '小智') ?? null) : null) ?? ocId;
  const ocIsCustom = !!ocName && ocName !== '小智';
  const myOc = useLiving.getState().oc;
  const activeSpirit = myOc && myOc.team && myOc.team.length ? (myOc.team.find((s) => s.uid === myOc.active) ?? myOc.team[0]) : null;
  activeSpiritRef.current = activeSpirit;   // RAF 循环读这个 ref,避免每帧重复 getState()+find()

  return (
    <section className="world-fs" style={{ '--world-font': font } as CSSProperties}>
      <canvas ref={ref} className="world-canvas2" onClick={onClick} tabIndex={0} />

      <div className="hud hud-tl">
        {VISIT
          ? <div className="hud-ctrl visit">访客观光 · 只读串门</div>
          : <div className="hud-ctrl">控制中 · <b>{ctrlA?.name ?? '—'}</b>{ctrl === ocId && ' ★'}</div>}
        {!VISIT && (
          <div className="hud-kit" title="随行灵宠 · 背包灵石">
            {activeSpirit
              ? <button className="kit-mon" onClick={() => setTeamOpen(true)}><span className="kit-dot" style={{ background: speciesById[activeSpirit.species]?.body }} />{activeSpirit.name} <i>Lv{activeSpirit.level}</i></button>
              : <button className="kit-mon off" onClick={() => setTeamOpen(true)}>无随行灵宠</button>}
            <button className="kit-stone" onClick={() => setBagOpen(true)}>灵石 {myOc?.bag?.stone ?? 0}</button>
          </div>
        )}
      </div>

      <div className="hud hud-tr">
        <span className="wstat sm"><i>EPOCH</i> {w?.epoch ?? 0}</span>
        <span className="wstat sm"><i>居民</i> {w ? w.order.length : 0}</span>
        <span className="wstat sm hot"><i>供给</i> {(w ? Math.round(w.stats.supply) : 0)}◈</span>
        <span className="wstat sm" title={GLOBAL ? (isHost ? '全球联机中 · 本端为世界主机' : '全球联机中 · 镜像主机世界') : '本机多窗口(配置 Supabase 即全球联机)'}>在线 {online}{GLOBAL && isHost && online > 1 ? ' · 主机' : ''}</span>
        <button className="hud-btn" onClick={openNet} title="联机设置">联机</button>
        {VISIT ? (
          <>
            <button className={'hud-btn' + (bgmOn ? ' on' : '')} onClick={() => setBgmOn(toggleBgm())} title="背景音乐">♪ BGM {bgmOn ? '开' : '关'}</button>
            <button className="hud-btn" onClick={() => setShowHelp(true)} title="说明">?</button>
            <a className="hud-btn hud-cta" href="/web.html#/create">✦ 创建你的 OCWORLD →</a>
          </>
        ) : (
          <>
            {!GLOBAL && <button className="hud-btn" onClick={() => setRun(!worldRunning)}>{worldRunning ? '暂停' : '播放'}</button>}
            {!GLOBAL && <button className="hud-btn" onClick={() => { const n = window.prompt('克隆一个新居民(起个名字):', '@new_soul'); const v = n && n.trim(); if (v) addAgent(v); }}>＋人格</button>}
            {!GLOBAL && <button className="hud-btn" onClick={() => { reseed(); apos.current.clear(); affinity.current.clear(); meetLines.current.clear(); companionRef.current = null; meetRef.current = null; nextMeetAt.current = 0; talkRef.current = null; wild.current = []; wildInit.current = false; trail.current = []; setControlId(null); setInspId(null); }}>↻ 重置</button>}
            <button className="hud-btn" onClick={() => { setControlId(xiaozhiId); setInspId(xiaozhiId); }}>回到小智 ★</button>
            {ocIsCustom && <button className="hud-btn" onClick={() => { setControlId(ocId); setInspId(ocId); }} title="回到你创建的角色">我 · {ocName}</button>}
            <button className="hud-btn" onClick={() => setBagOpen(true)} title="背包(B 键)">背包</button>
            <button className="hud-btn" onClick={() => setTeamOpen(true)} title="灵宠队伍">灵宠</button>
            <button className="hud-btn live" onClick={() => setLive(true)}>真 LLM/链</button>
            <button className={'hud-btn' + (bgmOn ? ' on' : '')} onClick={() => setBgmOn(toggleBgm())} title="温馨 8-bit 背景音乐">♪ BGM {bgmOn ? '开' : '关'}</button>
            <button className="hud-btn" onClick={() => setShowHelp(true)} title="玩法说明">?</button>
            <button className="hud-btn" title="复制只读观光链接,发给朋友来串门" onClick={() => { const url = window.location.origin + '/world/?visit=1'; try { void navigator.clipboard?.writeText(url); } catch { /* ignore */ } window.prompt('把这个只读观光链接发给朋友来串门:', url); }}>分享观光</button>
            <select className="hud-sel" value={FONTS.find((f) => f.css === font)?.id ?? FONTS[0].id} title="选择字体" onChange={(e) => { const f = FONTS.find((x) => x.id === e.target.value) ?? FONTS[0]; setFont(f.css); try { localStorage.setItem('oc-world-font', f.id); } catch { /* ignore */ } }}>
              {FONTS.map((f) => <option key={f.id} value={f.id}>字 · {f.name}</option>)}
            </select>
            {!GLOBAL && <select className="hud-sel" value={REGIONS.find((r) => r.c[0] === regionC[0] && r.c[1] === regionC[1])?.id ?? 'custom'} title="活动区域(角色聚居的地图区域)" onChange={(e) => { const r = REGIONS.find((x) => x.id === e.target.value); if (r) applyRegion(r.c); }}>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>区 · {r.name}</option>)}
              {!REGIONS.some((r) => r.c[0] === regionC[0] && r.c[1] === regionC[1]) && <option value="custom">区 · 自定义</option>}
            </select>}
            {!GLOBAL && <button className="hud-btn" title="把当前所在位置设为活动区域中心(整簇居民迁过来)" onClick={() => { const id = ctrlRef.current; const p = id ? apos.current.get(id) : null; if (p) applyRegion([+(p.mx / MAP_W).toFixed(4), +(p.my / MAP_H).toFixed(4)]); }}>设此为区</button>}
          </>
        )}
      </div>

      <div className={'hud hud-feed' + (feedOpen ? '' : ' min')}>
        <div className="hud-feed-head" onClick={() => setFeedOpen(!feedOpen)}>实时社交流 · THE FEED <span>{w?.feed.length ?? 0}{feedOpen ? ' ▾' : ' ▸'}</span></div>
        {feedOpen && <div className="hud-feed-body">
          {(w?.feed ?? []).slice(0, 14).map((p) => (
            <div key={p.id} className={'wpost' + (p.ev ? ' ev-' + p.ev.kind : '')} title={VISIT ? '点击:镜头飞向 TA' : '点击:镜头飞向 TA 并接管'}
              onClick={() => { if (!useLiving.getState().world?.agents[p.agentId]) return; if (VISIT) { spectateRef.current = p.agentId; nextSpectateAt.current = performance.now() + 12000; setInspId(p.agentId); } else { setControlId(p.agentId); setInspId(p.agentId); } }}>
              <div className="wrow"><span className="wav" style={{ background: `hsl(${hue(p.agentId)},45%,55%)` }} /><b>{p.name}</b><span className="wact">{actionCN[p.action]}</span></div>
              <div className="wtext">{p.text}</div>
            </div>
          ))}
          {(!w || w.feed.length === 0) && <div className="world-empty">世界正在醒来…</div>}
        </div>}
      </div>

      {inspA && (
        <div className="hud hud-insp">
          <button className="hud-x" onClick={() => setInspId(null)}>✕</button>
          <Inspector a={inspA} isOc={inspId === ocId} />
        </div>
      )}

      {(() => {
        const tk = talkRef.current; if (!tk) return null;
        const fr = w && w.agents[tk.withId];
        if (tk.menu) {
          return (
            <div className="hud hud-talk">
              <div className="talk-name">{fr?.name ?? ''}</div>
              <div className="talk-prompt">想和 {fr?.name ?? 'TA'} 做点什么?</div>
              <div className="talk-menu">
                {ACTIONS.filter((ac) => !(GLOBAL && ac.id === 'follow')).map((ac) => (
                  <button key={ac.id} className="talk-act" onClick={() => doAction(tk.withId, ac.id)}>
                    {ac.glyph} {companionRef.current === tk.withId && ac.id === 'follow' ? '结束陪走' : ac.label}<small>{ac.sub}</small>
                  </button>
                ))}
              </div>
              <div className="talk-hint" onClick={() => { talkRef.current = null; bumpTalk(); }}>空格关闭 · 点击选择 ▸</div>
            </div>
          );
        }
        const ln = tk.lines && tk.lines[tk.i]; if (!ln) return null;
        return (
          <div className="hud hud-talk" onClick={() => { tk.i++; if (!tk.lines || tk.i >= tk.lines.length) talkRef.current = null; bumpTalk(); }}>
            <div className="talk-name">{ln.name}{liveRef.current && ' · ✦ Claude'}</div>
            <div className="talk-text">{ln.text}</div>
            <div className="talk-hint">空格 / 点击 继续</div>
            <span className="talk-next" aria-hidden="true" />
          </div>
        );
      })()}

      {live && <WorldGoLive onClose={() => setLive(false)} />}

      {showHelp && (
        <div className="world-help" onClick={dismissHelp}>
          <div className="world-help-card" onClick={(e) => e.stopPropagation()}>
            {VISIT ? (
              <>
                <h3>你正在串门一座 OCWORLD ✦</h3>
                <ul>
                  <li>这是别人拥有的 OCWORLD —— 你以<b>访客</b>身份<b>只读观光</b>。</li>
                  <li>镜头会自动巡游;<b>点任意 TA</b> 可聚焦并查看它的人格与记忆。</li>
                  <li>居民们自己生活:走动、相遇、说悄悄话、头顶冒 ♥ —— 一个自运转的小社会。</li>
                  <li>喜欢?<b>创建你自己的 OCWORLD</b>,养一个属于你、归你钱包的 AI 角色。</li>
                </ul>
                <button className="world-help-go" onClick={dismissHelp}>开始观光 ▸</button>
              </>
            ) : (
              <>
                <h3>欢迎来到 OCWORLD ✦</h3>
                <ul>
                  <li><b>移动</b> · WASD / 方向键 · 或<b>点击地面</b>走过去(手机轻点即可)</li>
                  <li><b>互动</b> · 走近伙伴按 空格,或<b>点一下身边的 TA</b>:闲聊 / 夸夸 / 约饭 / 抱抱 / 陪走</li>
                  <li><b>接管</b> · 点击远处任意居民,即可化身 TA 自由行走</li>
                  <li><b>飞向</b> · 点左侧 THE FEED 的动态,镜头会飞向当事人</li>
                  <li><b>灵宠</b> · 走近野生灵宠按 <b>C</b> 收服(耗 1 灵石),激活的灵宠会<b>随行</b>;<b>B</b> 开背包,点「灵宠」管理队伍</li>
                  <li>伙伴们会自己相遇、说悄悄话、头顶冒 ♥ —— 一个自运转的小社会</li>
                </ul>
                <button className="world-help-go" onClick={dismissHelp}>开始 ▸</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 全球非主机:首份主机快照到达前,提示正在进入共享世界(避免短暂看到本地私有世界) */}
      {GLOBAL && !isHost && !synced && (
        <div className="world-syncing">正在进入共享世界…</div>
      )}

      {/* 世界频道(多人聊天):消息浮在输入框上方;对话/菜单进行时隐藏,避免与对话框重叠 */}
      {!talkRef.current && <div className="world-chat">
        {chatLog.length > 0 && <div className="world-chat-log">
          {chatLog.slice(-6).map((m, i) => <div key={i} className="wc-msg"><b>{m.name}:</b> {m.text}</div>)}
        </div>}
        <input className="world-chat-in" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); e.stopPropagation(); }} placeholder={`世界频道 · 以 ${meSelf.current?.name ?? '训练师'} 发言…`} maxLength={120} />
      </div>}

      {netOpen && (
        <div className="world-help" onClick={() => setNetOpen(false)}>
          <div className="world-help-card net-card" onClick={(e) => e.stopPropagation()}>
            <h3>全球联机</h3>
            <p className="net-note">
              当前:<b>{netMode() === 'global' ? '已接入全球房间' : '本机多窗口模式'}</b>。
              {netMode() === 'global' ? ' 同一世界的玩家会实时同屏走动、聊天。' : ' 同浏览器多开窗口即可看到彼此;要真·全球联机,填一个免费 Supabase 项目(URL + anon key,均为可公开的客户端密钥):'}
            </p>
            <label className="sp-field"><span>你的昵称(其他玩家看到的名字)</span><input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} maxLength={16} /></label>
            <label className="sp-field"><span>Supabase Project URL</span><input value={nf.url} onChange={(e) => setNf({ ...nf, url: e.target.value })} placeholder="https://xxxx.supabase.co" /></label>
            <label className="sp-field"><span>Supabase anon key(public)</span><input value={nf.key} onChange={(e) => setNf({ ...nf, key: e.target.value })} placeholder="eyJ…(anon public key)" /></label>
            <p className="net-hint">免费开通:supabase.com → 新建项目 → Project Settings · API → 复制 Project URL 与 anon public key。留空 URL/key = 仅本机多窗口。保存后会重连。</p>
            <div className="sp-edit-actions">
              <button className="btn primary" onClick={saveNet}>保存并重连 ✦</button>
              <button className="btn" onClick={() => setNetOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="world-toast">{toast}</div>}

      {!VISIT && bagOpen && (
        <div className="world-modal" onClick={() => setBagOpen(false)}>
          <div className="world-card" onClick={(e) => e.stopPropagation()}>
            <div className="wc-head">背包 · BAG <button className="wc-x" onClick={() => setBagOpen(false)}>✕</button></div>
            <div className="wc-items">
              {ITEMS.map((it) => { const n = myOc?.bag?.[it.id] ?? 0; return (
                <div key={it.id} className={'wc-item' + (n ? '' : ' off')}>
                  <span className="wc-ic" style={{ background: it.color }}>{it.tag}</span>
                  <div className="wc-it-main"><b>{it.name}</b> ×{n}<small>{it.desc}</small></div>
                  {it.id === 'berry' && n > 0 && <button className="hud-btn" onClick={() => useBagItem('berry')}>喂食 +羁绊</button>}
                </div>
              ); })}
            </div>
          </div>
        </div>
      )}

      {!VISIT && teamOpen && (
        <div className="world-modal" onClick={() => setTeamOpen(false)}>
          <div className="world-card" onClick={(e) => e.stopPropagation()}>
            <div className="wc-head">灵宠队伍 · TEAM <button className="wc-x" onClick={() => setTeamOpen(false)}>✕</button></div>
            <div className="wc-team">
              {(myOc?.team ?? []).map((s) => { const sp = speciesById[s.species]; const on = s.uid === myOc?.active; return (
                <button key={s.uid} className={'wc-mon' + (on ? ' on' : '')} onClick={() => setActiveSpirit(s.uid)} title={on ? '随行中' : '设为随行'}>
                  <span className="wc-mon-dot" style={{ background: sp?.body }} />
                  <span className="wc-mon-main"><b>{s.name}</b><small>{sp?.element ?? '?'}系 · Lv{s.level} · 羁绊 {s.bond}</small></span>
                  {on && <span className="wc-on">随行中</span>}
                </button>
              ); })}
              {(!myOc?.team || myOc.team.length === 0) && <div className="wc-empty">还没有灵宠 —— 走近野生灵宠按 C 收服。</div>}
            </div>
            <button className="wc-toggle" onClick={togglePet}>随身宠物:{petHidden ? '已隐藏 —— 点此显示' : '显示中 —— 点此隐藏'}</button>
          </div>
        </div>
      )}
    </section>
  );
}
