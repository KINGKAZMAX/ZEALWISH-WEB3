import { useLiving } from '../store/useLiving';

const ARCH: [string, string, string][] = [
  ['大脑 · Brain', '离线脚本引擎', 'Claude Opus 4.8 导演 + Haiku 4.5 群演(B)'],
  ['世界引擎', '本地确定性 step()', '本地确定性 step()(A,已就绪)'],
  ['钱包/资产', '账内记账(模拟)', 'ERC-4337 智能账户 + AgentKit(C)'],
  ['链', '模拟', 'Base Sepolia 测试网 · viem(C)'],
  ['支付', '—', 'x402(USDC over Base)'],
];

export default function WorldGoLive({ onClose }: { onClose: () => void }) {
  const liveMode = useLiving((s) => s.liveMode);
  const setLiveMode = useLiving((s) => s.setLiveMode);
  return (
    <div className="gl-bg" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('gl-bg')) onClose(); }}>
      <div className="gl">
        <div className="gl-head">
          <h2>切换真 LLM / 真链</h2>
          <button className="gl-x" onClick={onClose}>✕</button>
        </div>
        <div className="gl-body">
          <p>当前为 <b className="on">A · 离线真引擎</b>:本地确定性 <code>step()</code> 驱动整个自治世界,0 成本、可复现——你看到的地图/社交流/经济都是它实时跑出来的。下面两档把对应接缝换成真实实现。</p>

          <div className="gl-toggle">
            <div className="gl-d"><b>B · 真 Claude 大脑</b><br />群演 <code>claude-haiku-4-5</code> 逐 tick,导演 <code>claude-opus-4-8</code> 反思。人格台词由模型实时生成。</div>
            <button className={'btn' + (liveMode.cognition === 'live' ? ' primary' : '')} onClick={() => setLiveMode({ cognition: liveMode.cognition === 'live' ? 'scripted' : 'live' })}>
              {liveMode.cognition === 'live' ? '● 已开(待后端)' : '○ 切到真 Claude'}
            </button>
          </div>
          <div className="gl-toggle">
            <div className="gl-d"><b>C · 真 Base Sepolia 链</b><br />viem + AgentKit:每个 OC 一个 ERC-4337 智能账户,转账/铸 NFT 真实上链。</div>
            <button className={'btn' + (liveMode.chain === 'live' ? ' primary' : '')} onClick={() => setLiveMode({ chain: liveMode.chain === 'live' ? 'mock' : 'live' })}>
              {liveMode.chain === 'live' ? '● 已开(待后端)' : '○ 切到真 Base'}
            </button>
          </div>

          <div className="gl-grid">
            <div className="gl-cell h">现在(A)</div><div className="gl-cell h">2026 升级</div>
            {ARCH.map(([lab, o, n], i) => (
              <div key={i} className="gl-cell full">
                <div><div className="gl-lab">{lab}</div><div className="gl-old">{o}</div></div>
                <div><div className="gl-lab">{lab}</div><div className="gl-new">{n}</div></div>
              </div>
            ))}
          </div>

          <p className="gl-note">⚠ B/C 的"真接"需要一个服务端(把 key 留在后端、签链上交易);浏览器直连会泄露 key。当前 living-oc 是纯前端,所以这两档是<b>接缝预留</b>——离线引擎(A)持续运行不受影响。下一步可加一个轻后端(Next.js API / 小 Express)来真正点亮 B/C(需 Anthropic key + Base Sepolia 测试币)。</p>
        </div>
      </div>
    </div>
  );
}
