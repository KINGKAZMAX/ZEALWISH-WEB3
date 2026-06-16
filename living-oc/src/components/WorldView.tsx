import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLiving } from '../store/useLiving';
import { locById, ARCHE_CN } from '../sim/data';
import { actionCN } from '../sim/text';
import type { Agent } from '../sim/types';
import WorldGoLive from './WorldGoLive';
import { liveSay, liveTalk } from '../live/liveProviders';
import { toggleBgm, bgmPlaying } from '../live/bgm';

const BASE = import.meta.env.BASE_URL;
// 访客观光模式(?visit=1):只读串门 —— 无操控/接管/互动,自动巡游 + 点角色聚焦查看 + 转化 CTA
const VISIT = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visit') === '1';
const MAP_SRC = 'kanto.webp';
// 关都总图 6528×6400(地图坐标系 = 原始像素)。内容是不规则陆地、含白色空白,
// 移动用降采样碰撞图限定在陆地上;6 地点放在一处镇区陆地上。
const MAP_W = 6528, MAP_H = 6400;
const MAP_SCALE = 2.5;                  // 屏上缩放(16px 瓦片 → 40px)
const TILE = 16 * MAP_SCALE;           // 屏上一格 = 32
const SPEED = 150;                     // 手控速度(地图 px/秒)
const NPC_SPEED = 78;                  // 自治居民速度
const INTERACT_R = 30;                 // 交互半径(地图 px)
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
];
function loadRegion(): [number, number] {
  try { const s = localStorage.getItem('oc-world-region'); if (s) { const v = JSON.parse(s); if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number') return [v[0], v[1]]; } } catch { /* ignore */ }
  return REGION_DEFAULT;
}

const NPC_CHARS = ['green_normal', 'boy', 'lass', 'youngster', 'fat_man', 'beauty', 'gentleman'];
// 命名角色专属精灵(小智=Red 另外处理;5 个新加坡留学伙伴用对应 chr-*.png)
const NAMED_SPRITE: Record<string, string> = {
  '范范兔': 'fanfan', '熊熊': 'xiongxiong', '鹿鹿鹅': 'lulu', '猪猪仔': 'zhuzhu', '冰冰雁': 'bingbing',
};
// 头顶气泡台词库(联网研究:新加坡留学日常 + 夜间动物园)。LLM 接入后由后端实时生成替换。
const LINE_BANKS: Record<string, string[]> = {
  // 小智:话少、字短、内敛
  '小智': ['…嗯。(･ω･)', '看着你们,挺好。', '我也想…更用力点。', '今天也在。✦', '不太会说…但都记得。', '你们笑,我就安心 (˘ ˘)', '……(◞‸◟)', '走走看看就好。', '嗯,我在。', '别怕,有我。'],
  '范范兔': ['No bone, no blood, no ash (｀∀´)Ψ', '阿姆斯特朗回旋加速喷气式阿姆斯特朗炮!', '封印在我右手的黑炎之龙…又躁动了', '哼,这点 deadline,在我「绝对领域」前不值一提', '吾乃黑暗中沉睡的紫焰使徒·范范兔 (・`ω´・)', '食阁辣椒蟹,是唤醒我封印之力的祭品!', '夜间动物园,是我与夜之眷属的契约之地', '别看我笑嘻嘻,体内住着混沌的另一个我', '上班只是我潜伏人间界的伪装 (¬‿¬)', '苏醒吧,我的「叻沙圣剑」!shiok!', '紫发是力量觉醒的证明,凡人勿视 ✧', '今日运势:黑暗终将吞噬一切…但先恰饭 (≧▽≦)'],
  '熊熊': ['谁 emo 都来抱抱,熊熊在 (っ◔◡◔)っ', '加东叻沙椰浆汤底,暖暖的 (´︶`)', '冷气太冻啦,披我外套吧 (｡•ᴗ•｡)', 'Deadline 别怕,先喝口 teh tarik (´▽`)', '夜间动物园水獭一家好吵好萌 (＾• ω •＾)', '组屋楼下巴刹,auntie 都认得我 (◕‿◕)', '抱一个,烦恼都会变小 (つ≧▽≦)つ', '今天也要好好吃饭哦 (｡♡‿♡｡)', '困了就靠着我睡 (´-ω-`)zzZ', '熊抱治百病,试试看?(ﾉ´ヮ`)ﾉ'],
  '鹿鹿鹅': ['滨海湾日落…又发呆成鹅了 (´-ω-`)', '擎天树灯光秀,想写首诗 ✧', '夜里靠月光找动物,好诗意 (˘︶˘)', '果蝠倒挂啃水果,近到数牙齿 (・о・)', '炒粿条要够镬气 wok hei~ (´ ▽ `)', '风把我吹成另一个我了…(꒦ິ⌓꒦ີ)', '发呆也是一种创作嘛 (´｡• ᵕ •｡`)', '云好软,想躺上去 (｡-ω-)zzz', '今天的灵感,藏在叻沙里 (｡•̀ᴗ-)✧', '慢一点…世界更好看 (˶˘ ³˘)'],
  '猪猪仔': ['食阁一餐才 3 块,太香了 (๑´ڡ`๑)', '辣椒蟹满手酱,再来一份!(＞ڡ＜)', '沙爹配花生酱,绝了 (｡◕‿◕｡)', '佛系攒钱…美食面前破功 (´∀`)', '夜间动物园穿山甲太可爱 (♡˙︶˙♡)', '小贩中心是非遗,骄傲 ✧', '吃饱才有力气省钱 (ง•̀_•́)ง', '快乐由海南鸡饭赞助 (˶ᵔ ᵕ ᵔ˶)', 'teh tarik 拉得越高越甜 (ᵔᴥᵔ)', '今天恰三餐,一顿都不少 (๑˃̵ᴗ˂̵)'],
  '冰冰雁': ['通宵 mugging,bell curve 必赢 (¬‿¬)', '高冷如我…只对夜行动物笑 (・_・)', 'MRT 早高峰,挤成 2D 了 (；￣Д￣)', '闪光灯别开!会吓到动物 (`へ´)', '波动率万岁,但叻沙更稳 (￣ω￣)', '别吵,我在算实验数据 (-ω-、)', '…那只豹子,有点可爱 (//ω//)', '考完试再说话 (´-﹏-`)', '叻沙性价比,我已建模 (¬_¬)ﾉ', '夜里我才会解冻一点点 (˶′◡‵˶)'],
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
];
// 玩家走近伙伴后的互动动作菜单
const ACTIONS: { id: string; label: string; sub: string; glyph: string }[] = [
  { id: 'chat',   label: '闲聊', sub: '唠唠日常', glyph: '♪' },
  { id: 'praise', label: '夸夸', sub: '+好感',   glyph: '✦' },
  { id: 'meal',   label: '约饭', sub: '去恰美食', glyph: '✿' },
  { id: 'hug',    label: '抱抱', sub: '+亲密',   glyph: '♥' },
  { id: 'follow', label: '陪走', sub: '一起散步', glyph: '🚶' },
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
  c.fillStyle = 'rgba(255,255,255,.95)'; c.strokeStyle = 'rgba(255,45,45,.45)'; c.lineWidth = 1.2;
  rrect(c, x, y, w, h, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(cx - 5, by - 1); c.lineTo(cx + 5, by - 1); c.lineTo(cx, by + 5); c.closePath(); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill();
  c.fillStyle = '#17171c'; c.textAlign = 'center'; lines.forEach((l, i) => c.fillText(l, cx, y + 4 + i * lh));
  c.textBaseline = 'alphabetic';
}
// 运行时把金棕发染成紫色(给范范兔=主角女生);返回新 Image,避免文件 base64 round-trip 损坏
function recolorHairPurple(img: HTMLImageElement): HTMLImageElement {
  const out = new Image();
  const c = document.createElement('canvas'); c.width = img.naturalWidth || 144; c.height = img.naturalHeight || 32;
  const cx = c.getContext('2d'); if (!cx) { out.src = img.src; return out; }
  cx.imageSmoothingEnabled = false; cx.drawImage(img, 0, 0);
  try {
    const id = cx.getImageData(0, 0, c.width, c.height), d = id.data;
    const HAIR = [[57, 57, 24], [123, 115, 65], [205, 172, 98], [156, 140, 90]];
    const PURP = [[74, 44, 104], [138, 84, 176], [198, 154, 232], [168, 118, 205]];
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue; const r = d[i], g = d[i + 1], b = d[i + 2];
      for (let h = 0; h < HAIR.length; h++) { if (Math.hypot(r - HAIR[h][0], g - HAIR[h][1], b - HAIR[h][2]) < 26) { d[i] = PURP[h][0]; d[i + 1] = PURP[h][1]; d[i + 2] = PURP[h][2]; break; } }
    }
    cx.putImageData(id, 0, 0); out.src = c.toDataURL('image/png');
  } catch { out.src = img.src; }
  return out;
}

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
  const [feedOpen, setFeedOpen] = useState(true);
  const [bgmOn, setBgmOn] = useState(false);
  const [font, setFont] = useState<string>(() => {
    try { const id = localStorage.getItem('oc-world-font'); return FONTS.find((f) => f.id === id)?.css || FONT_DEFAULT; } catch { return FONT_DEFAULT; }
  });
  const [regionC, setRegionC] = useState<[number, number]>(loadRegion);
  const [showHelp, setShowHelp] = useState<boolean>(() => { try { return !localStorage.getItem('oc-world-seen'); } catch { return true; } });
  const dismissHelp = () => { setShowHelp(false); try { localStorage.setItem('oc-world-seen', '1'); } catch { /* ignore */ } };
  const [, setTalkVer] = useState(0);

  const ref = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Set<string>>(new Set());
  const apos = useRef(new Map<string, PP>());
  const cam = useRef({ cx: MAP_W * loadRegion()[0], cy: MAP_H * loadRegion()[1] });
  const view = useRef({ sx: 0, sy: 0 });
  const mapImg = useRef<CanvasImageSource | null>(null);
  const collide = useRef<{ d: Uint8ClampedArray; cw: number; ch: number; cs: number } | null>(null);
  const ocSprite = useRef<HTMLImageElement | null>(null);
  const npcSprites = useRef<HTMLImageElement[]>([]);
  const named = useRef<Record<string, HTMLImageElement>>({});
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
  // ── 互动:飘心表情 / 好感度 / 陪走 / NPC 亲密相会 ──
  const emotes = useRef<{ mx: number; my: number; glyph: string; born: number }[]>([]);
  const affinity = useRef<Map<string, number>>(new Map());
  const companionRef = useRef<string | null>(null);
  const meetRef = useRef<{ a: string; b: string; until: number; met: boolean; lastHeart: number } | null>(null);
  const nextMeetAt = useRef(0);
  const meetLines = useRef<Map<string, string>>(new Map());
  const popEmote = (mx: number, my: number, glyph: string) => { emotes.current.push({ mx, my, glyph, born: performance.now() }); if (emotes.current.length > 48) emotes.current.shift(); };
  const pairKey = (a: string, b: string) => [a, b].sort().join('|');
  // 点击地面走过去的目标(鼠标/触屏通用,替代虚拟摇杆)
  const walkTarget = useRef<{ x: number; y: number } | null>(null);
  // 切换/自定义活动区域:迁移整簇居民到新中心,清位重新落位 + 相机移过去 + 持久化
  const applyRegion = (c: [number, number]) => {
    setRegionC(c);
    try { localStorage.setItem('oc-world-region', JSON.stringify(c)); } catch { /* ignore */ }
    apos.current.clear();
    meetRef.current = null; meetLines.current.clear(); nextMeetAt.current = 0; companionRef.current = null;
    cam.current.cx = c[0] * MAP_W; cam.current.cy = c[1] * MAP_H;
  };

  useEffect(() => { setRun(true); }, [setRun]);
  // 进世界后首次交互自动轻声播放 BGM(符合浏览器自动播放策略)
  useEffect(() => {
    const kick = () => { if (!bgmPlaying()) setBgmOn(toggleBgm()); window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
    window.addEventListener('pointerdown', kick); window.addEventListener('keydown', kick);
    return () => { window.removeEventListener('pointerdown', kick); window.removeEventListener('keydown', kick); };
  }, []);
  useEffect(() => { if (!worldRunning) return; const iv = setInterval(() => { void tick(); }, 900); return () => clearInterval(iv); }, [worldRunning, tick]);

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
      } else mapImg.current = t;
    };
    const r = new Image(); r.src = BASE + 'sprites/chr-red_normal.png'; ocSprite.current = r;
    npcSprites.current = NPC_CHARS.map((n) => { const im = new Image(); im.src = BASE + 'sprites/chr-' + n + '.png'; return im; });
    for (const nm in NAMED_SPRITE) {
      const im = new Image(); im.src = BASE + 'sprites/chr-' + NAMED_SPRITE[nm] + '.png';
      if (nm === '范范兔') { im.onload = () => { named.current[nm] = recolorHairPurple(im); }; named.current[nm] = im; } // 主角女生:运行时把头发染紫
      else named.current[nm] = im;
    }
  }, []);

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

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (VISIT) return;                                 // 访客观光:只读,不接受键盘操控
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) { keys.current.add(k); e.preventDefault(); }
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
    let raf = 0; let errLogged = false; const dpr = window.devicePixelRatio || 1;
    const walkable = (mx: number, my: number) => {
      const c = collide.current; if (!c) return true;
      const gx = Math.max(0, Math.min(c.cw - 1, mx / c.cs | 0)), gy = Math.max(0, Math.min(c.ch - 1, my / c.cs | 0));
      const i = (gy * c.cw + gx) * 4; if (c.d[i + 3] < 30) return false;
      return !(c.d[i] > 232 && c.d[i + 1] > 232 && c.d[i + 2] > 232);
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
        const ro = ANCHOR_OFFSETS[loc.id] || [0, 0], rc = regionRef.current; const anchor: [number, number] = [rc[0] + ro[0], rc[1] + ro[1]];
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
          if (companionRef.current === id && ctrl) {
            const cp = apos.current.get(ctrl); if (cp) { tx = cp.mx - 30 + jx * 0.35; ty = cp.my + 6 + jy * 0.35; } // 陪走:跟在玩家身后
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
        } else if (now > nextMeetAt.current) {
          const friends = w.order.filter((id) => w.agents[id] && NAMED_SPRITE[w.agents[id].name] && id !== ctrl && id !== companionRef.current);
          if (friends.length >= 2) {
            const a = friends[Math.floor(Math.random() * friends.length)];
            let b = friends[Math.floor(Math.random() * friends.length)], guard = 0;
            while (b === a && guard++ < 8) b = friends[Math.floor(Math.random() * friends.length)];
            if (b !== a) {
              const pl = PAIR_LINES[Math.floor(Math.random() * PAIR_LINES.length)];
              meetRef.current = { a, b, until: now + 11000, met: false, lastHeart: 0 };
              meetLines.current.clear(); meetLines.current.set(a, pl[0]); meetLines.current.set(b, pl[1]);
            }
            nextMeetAt.current = now + 12000 + Math.random() * 7000;
          } else nextMeetAt.current = now + 6000;
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
        const tmm = mapImg.current;
        if (tmm) { ctx.imageSmoothingEnabled = false; ctx.drawImage(tmm, cpp.mx - RR, cpp.my - RR, RR * 2, RR * 2, mx0, my0, MM, MM); }
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
      else { setControlId(best); setInspId(best); }               // 点别的居民 → 接管 + 查看
    } else {
      walkTarget.current = { x: mx, y: my };                      // 点空地 → 走过去
    }
  };

  const w = useLiving.getState().world;
  const ctrl = controlId ?? ocId;
  const ctrlA = w && ctrl ? w.agents[ctrl] : undefined;
  const inspA = w && inspId ? w.agents[inspId] : undefined;

  return (
    <section className="world-fs" style={{ '--world-font': font } as CSSProperties}>
      <canvas ref={ref} className="world-canvas2" onClick={onClick} tabIndex={0} />

      <div className="hud hud-tl">
        {VISIT
          ? <div className="hud-ctrl visit">👁 访客观光 · 只读串门</div>
          : <div className="hud-ctrl">控制中 · <b>{ctrlA?.name ?? '—'}</b>{ctrl === ocId && ' ★'}</div>}
      </div>

      <div className="hud hud-tr">
        <span className="wstat sm"><i>EPOCH</i> {w?.epoch ?? 0}</span>
        <span className="wstat sm"><i>居民</i> {w ? w.order.length : 0}</span>
        <span className="wstat sm hot"><i>供给</i> {(w ? Math.round(w.stats.supply) : 0)}◈</span>
        {VISIT ? (
          <>
            <button className={'hud-btn' + (bgmOn ? ' on' : '')} onClick={() => setBgmOn(toggleBgm())} title="背景音乐">♪ BGM {bgmOn ? '开' : '关'}</button>
            <button className="hud-btn" onClick={() => setShowHelp(true)} title="说明">?</button>
            <a className="hud-btn hud-cta" href="/web.html#/create">✦ 创建你的活世界 →</a>
          </>
        ) : (
          <>
            <button className="hud-btn" onClick={() => setRun(!worldRunning)}>{worldRunning ? '⏸' : '▶'}</button>
            <button className="hud-btn" onClick={() => { const n = window.prompt('克隆一个新居民(起个名字):', '@new_soul'); const v = n && n.trim(); if (v) addAgent(v); }}>＋人格</button>
            <button className="hud-btn" onClick={() => { reseed(); apos.current.clear(); affinity.current.clear(); meetLines.current.clear(); companionRef.current = null; meetRef.current = null; nextMeetAt.current = 0; talkRef.current = null; setControlId(null); setInspId(null); }}>↻ 重置</button>
            <button className="hud-btn" onClick={() => setControlId(ocId)}>回到小智 ★</button>
            <button className="hud-btn live" onClick={() => setLive(true)}>⚡ 真 LLM/链</button>
            <button className={'hud-btn' + (bgmOn ? ' on' : '')} onClick={() => setBgmOn(toggleBgm())} title="温馨 8-bit 背景音乐">♪ BGM {bgmOn ? '开' : '关'}</button>
            <button className="hud-btn" onClick={() => setShowHelp(true)} title="玩法说明">?</button>
            <button className="hud-btn" title="复制只读观光链接,发给朋友来串门" onClick={() => { const url = window.location.origin + '/world/?visit=1'; try { void navigator.clipboard?.writeText(url); } catch { /* ignore */ } window.prompt('把这个只读观光链接发给朋友来串门:', url); }}>🔗 分享观光</button>
            <select className="hud-sel" value={FONTS.find((f) => f.css === font)?.id ?? FONTS[0].id} title="选择字体" onChange={(e) => { const f = FONTS.find((x) => x.id === e.target.value) ?? FONTS[0]; setFont(f.css); try { localStorage.setItem('oc-world-font', f.id); } catch { /* ignore */ } }}>
              {FONTS.map((f) => <option key={f.id} value={f.id}>字 · {f.name}</option>)}
            </select>
            <select className="hud-sel" value={REGIONS.find((r) => r.c[0] === regionC[0] && r.c[1] === regionC[1])?.id ?? 'custom'} title="活动区域(角色聚居的地图区域)" onChange={(e) => { const r = REGIONS.find((x) => x.id === e.target.value); if (r) applyRegion(r.c); }}>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>区 · {r.name}</option>)}
              {!REGIONS.some((r) => r.c[0] === regionC[0] && r.c[1] === regionC[1]) && <option value="custom">区 · 自定义</option>}
            </select>
            <button className="hud-btn" title="把当前所在位置设为活动区域中心(整簇居民迁过来)" onClick={() => { const id = ctrlRef.current; const p = id ? apos.current.get(id) : null; if (p) applyRegion([+(p.mx / MAP_W).toFixed(4), +(p.my / MAP_H).toFixed(4)]); }}>📍 设此为区</button>
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
                {ACTIONS.map((ac) => (
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
            <div className="talk-hint">空格 / 点击 继续 ▸</div>
          </div>
        );
      })()}

      {live && <WorldGoLive onClose={() => setLive(false)} />}

      {showHelp && (
        <div className="world-help" onClick={dismissHelp}>
          <div className="world-help-card" onClick={(e) => e.stopPropagation()}>
            {VISIT ? (
              <>
                <h3>你正在串门一座活世界 ✦</h3>
                <ul>
                  <li>这是别人拥有的 AI 活世界 —— 你以<b>访客</b>身份<b>只读观光</b>。</li>
                  <li>镜头会自动巡游;<b>点任意 TA</b> 可聚焦并查看它的人格与记忆。</li>
                  <li>居民们自己生活:走动、相遇、说悄悄话、头顶冒 ♥ —— 一个自运转的小社会。</li>
                  <li>喜欢?<b>创建你自己的活世界</b>,养一个属于你、归你钱包的 AI 角色。</li>
                </ul>
                <button className="world-help-go" onClick={dismissHelp}>开始观光 ▸</button>
              </>
            ) : (
              <>
                <h3>欢迎来到活世界 ✦</h3>
                <ul>
                  <li><b>移动</b> · WASD / 方向键 · 或<b>点击地面</b>走过去(手机轻点即可)</li>
                  <li><b>互动</b> · 走近伙伴按 空格,或<b>点一下身边的 TA</b>:闲聊 / 夸夸 / 约饭 / 抱抱 / 陪走</li>
                  <li><b>接管</b> · 点击远处任意居民,即可化身 TA 自由行走</li>
                  <li><b>飞向</b> · 点左侧 THE FEED 的动态,镜头会飞向当事人</li>
                  <li>伙伴们会自己相遇、说悄悄话、头顶冒 ♥ —— 一个自运转的小社会</li>
                </ul>
                <button className="world-help-go" onClick={dismissHelp}>开始 ▸</button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
