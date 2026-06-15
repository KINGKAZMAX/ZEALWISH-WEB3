// ── ZEALWISH 活世界 · 轻后端 ──
// B:真 Claude 群演(逐 tick 决策)/ 导演(反思)。C:Base Sepolia 真链(转账 / 铸造)。
// 密钥只留在这里;前端通过 fetch 调用。未配置对应密钥的接口返回 503,前端自动回退到离线引擎/mock。
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const PORT = Number(process.env.PORT || 8788);
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'http://localhost:5276';
const ACTIONS = ['work', 'social', 'mint', 'spend', 'transfer', 'gamble', 'travel', 'reflect', 'post', 'bankrupt'];

const app = express();
app.use(cors({ origin: ALLOW_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

// ── 懒加载 Anthropic 客户端(B)──
let anthropic = null;
async function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropic) { const { default: Anthropic } = await import('@anthropic-ai/sdk'); anthropic = new Anthropic(); }
  return anthropic;
}

// ── 懒加载 viem 钱包(C)──
let wallet = null, pub = null, account = null;
async function getChain() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) return null;
  if (!wallet) {
    const { createWalletClient, createPublicClient, http } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    const { baseSepolia } = await import('viem/chains');
    const rpc = http(process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org');
    account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
    wallet = createWalletClient({ account, chain: baseSepolia, transport: rpc });
    pub = createPublicClient({ chain: baseSepolia, transport: rpc });
  }
  return { wallet, pub, account };
}

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, brain: !!process.env.ANTHROPIC_API_KEY, chain: !!process.env.DEPLOYER_PRIVATE_KEY });
});

// ── B · 群演逐 tick 决策 ──
app.post('/api/cognition/decide', async (req, res) => {
  const client = await getAnthropic();
  if (!client) return res.status(503).json({ error: 'no ANTHROPIC_API_KEY' });
  const { agent, peers = [], locations = [], recent = [] } = req.body || {};
  if (!agent) return res.status(400).json({ error: 'missing agent' });
  const sys = `你在驱动一个自治链上小镇里的一个角色。只输出一个 JSON 对象,不要任何多余文字。
字段:action(必选,取值之一:${ACTIONS.join('/')})、targetName(可选,某个邻居的名字)、destKind(可选,travel 时的目标地点类型:social/work/market/mint/travel)、text(必选,该角色此刻发到社交流的一句中文台词,≤30 字,符合其人设与心情)。`;
  const usr = `角色:${agent.name}(${agent.handle})——${agent.bio}
原型:${agent.arche} 心情:${agent.mood} 余额:${agent.balance}
性格:${JSON.stringify(agent.traits)} 需求:${JSON.stringify(agent.needs)}
当前位置:${agent.loc}
可去的地点:${locations.map((l) => `${l.name}(${l.kind})`).join('、')}
在场邻居:${peers.map((p) => p.name).join('、') || '无'}
最近社交流:${recent.slice(0, 6).map((r) => `${r.name}:${r.text}`).join(' / ') || '安静'}
基于人设给出此刻最合理的一个动作。只回 JSON。`;
  try {
    const msg = await client.messages.create({
      model: process.env.CROWD_MODEL || 'claude-haiku-4-5',
      max_tokens: 300,
      system: sys,
      messages: [{ role: 'user', content: usr }],
    });
    const txt = (msg.content.find((b) => b.type === 'text')?.text || '').trim();
    const json = txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1);
    const d = JSON.parse(json);
    if (!ACTIONS.includes(d.action)) d.action = 'post';
    res.json({ action: d.action, targetName: d.targetName ?? null, destKind: d.destKind ?? null, text: String(d.text || '').slice(0, 60), reasoning: d.reasoning ?? null });
  } catch (e) {
    res.status(502).json({ error: 'claude decide failed', detail: String(e?.message || e) });
  }
});

// ── B · 导演反思(可选,opus)──
app.post('/api/cognition/reflect', async (req, res) => {
  const client = await getAnthropic();
  if (!client) return res.status(503).json({ error: 'no ANTHROPIC_API_KEY' });
  const { events = [], name = '小镇' } = req.body || {};
  try {
    const msg = await client.messages.create({
      model: process.env.DIRECTOR_MODEL || 'claude-opus-4-8',
      max_tokens: 400,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: `这是「${name}」今天发生的事:\n${events.map((e) => '· ' + e).join('\n')}\n\n用第一人称写一段 80 字内的中文日记,带一句反思。只回日记正文。` }],
    });
    res.json({ diary: (msg.content.find((b) => b.type === 'text')?.text || '').trim() });
  } catch (e) {
    res.status(502).json({ error: 'claude reflect failed', detail: String(e?.message || e) });
  }
});

// ── C · 转账(Base Sepolia 真链)──
// 演示版:从后端钱包发一笔极小自交易,calldata 记录转账意图 → 产生可验证的真实 txHash。
// 生产版:替换为 ERC-4337 智能账户之间的真实 USDC/原生币转账。
app.post('/api/chain/transfer', async (req, res) => {
  const c = await getChain();
  if (!c) return res.status(503).json({ error: 'no DEPLOYER_PRIVATE_KEY' });
  const { fromName = '?', toName = '?', amount = 0 } = req.body || {};
  try {
    const memo = `0x${Buffer.from(`XFER ${fromName}->${toName} ${amount}`).toString('hex')}`;
    const hash = await c.wallet.sendTransaction({ to: c.account.address, value: 0n, data: memo });
    res.json({ ok: true, txHash: hash });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
});

// ── C · 铸造 NFT(Base Sepolia 真链)──
// 配了 NFT_CONTRACT_ADDRESS 则调用其 mint(address,string);否则降级为 calldata 记录,仍产生真实 txHash。
app.post('/api/chain/mint', async (req, res) => {
  const c = await getChain();
  if (!c) return res.status(503).json({ error: 'no DEPLOYER_PRIVATE_KEY' });
  const { ownerName = '?', name = 'untitled' } = req.body || {};
  try {
    const contract = process.env.NFT_CONTRACT_ADDRESS;
    if (contract) {
      const abi = [{ type: 'function', name: 'mint', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'uri', type: 'string' }], outputs: [] }];
      const hash = await c.wallet.writeContract({ address: contract, abi, functionName: 'mint', args: [c.account.address, name] });
      return res.json({ ok: true, txHash: hash, tokenId: null });
    }
    const memo = `0x${Buffer.from(`MINT ${ownerName} "${name}"`).toString('hex')}`;
    const hash = await c.wallet.sendTransaction({ to: c.account.address, value: 0n, data: memo });
    res.json({ ok: true, txHash: hash, tokenId: null });
  } catch (e) {
    res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
});

// ── B · 头顶气泡:为单个角色生成一句主题台词 ──
const SG_THEME = '内容围绕在新加坡留学的日常(NUS/NTU/SMU、食阁海南鸡饭/叻沙、MRT、Kaya toast、滨海湾/擎天树)或夜间动物园(夜游 tram、马来貘、穿山甲、水獭、果蝠、Creatures of the Night),口语、可爱、有梗,可夹少量 Singlish(lah/lor/shiok/can/paiseh)。';
app.post('/api/say', async (req, res) => {
  const client = await getAnthropic();
  if (!client) return res.status(503).json({ error: 'no ANTHROPIC_API_KEY' });
  const { name = '', bio = '' } = req.body || {};
  try {
    const msg = await client.messages.create({
      model: process.env.CROWD_MODEL || 'claude-haiku-4-5', max_tokens: 60,
      system: `你为一个像素小游戏角色生成头顶气泡台词。只输出一句中文台词,≤24 字,不要引号、不要解释。${SG_THEME}`,
      messages: [{ role: 'user', content: `角色:${name} —— ${bio}\n给一句此刻的台词。` }],
    });
    const t = (msg.content.find((b) => b.type === 'text')?.text || '').trim().replace(/^["「'’]+|["」'’]+$/g, '').slice(0, 30);
    res.json({ text: t });
  } catch (e) { res.status(502).json({ error: String(e?.message || e) }); }
});

// ── B · 走近触发:两个角色的一小段对话 ──
app.post('/api/talk', async (req, res) => {
  const client = await getAnthropic();
  if (!client) return res.status(503).json({ error: 'no ANTHROPIC_API_KEY' });
  const { a, b } = req.body || {};
  if (!a || !b) return res.status(400).json({ error: 'missing a/b' });
  try {
    const msg = await client.messages.create({
      model: process.env.CROWD_MODEL || 'claude-haiku-4-5', max_tokens: 400,
      system: `生成两个角色偶遇时的一小段有趣中文对话。${SG_THEME}\n只输出 JSON 数组,4-6 个元素,每个 {"speaker","text"},speaker 用角色名,text ≤24 字,两人轮流,A 先开口。不要多余文字。`,
      messages: [{ role: 'user', content: `角色A:${a.name}(${a.bio || ''})\n角色B:${b.name}(${b.bio || ''})` }],
    });
    const txt = (msg.content.find((x) => x.type === 'text')?.text || '').trim();
    const arr = JSON.parse(txt.slice(txt.indexOf('['), txt.lastIndexOf(']') + 1));
    res.json({ lines: arr.slice(0, 6).map((t) => ({ name: String(t.speaker || t.name || '').slice(0, 10), text: String(t.text || '').slice(0, 40) })) });
  } catch (e) { res.status(502).json({ error: String(e?.message || e) }); }
});

app.listen(PORT, () => {
  console.log(`[living-oc] 轻后端 :${PORT}  B(Claude)=${!!process.env.ANTHROPIC_API_KEY}  C(Base)=${!!process.env.DEPLOYER_PRIVATE_KEY}`);
});
