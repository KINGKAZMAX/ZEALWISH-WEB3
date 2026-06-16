import { useState, useEffect } from 'react';
import { useLiving } from '../store/useLiving';
import ZealwishTopbar from './ZealwishTopbar';
import LifeFeed from './LifeFeed';
import Chat from './Chat';
import WorldView from './WorldView';

// ?embed=1:被 ZEALWISH 工作台 World 模块 iframe 内嵌(隐藏自身顶栏,导航交给外壳)。
// ?visit=1:访客观光模式(只读串门,无需登录)——同样直接进世界、自动建世界、隐藏顶栏。
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const EMBED = params?.get('embed') === '1';
const VISIT = params?.get('visit') === '1';
const WORLD_ONLY = EMBED || VISIT;

export default function App() {
  useLiving((s) => s.version);
  const oc = useLiving.getState().oc;
  const create = useLiving((s) => s.create);
  const load = useLiving((s) => s.load);
  const view = useLiving((s) => s.view);
  const setView = useLiving((s) => s.setView);
  const [name, setName] = useState('小智');
  useEffect(() => {
    load();
    if (WORLD_ONLY) {
      document.documentElement.classList.add('oc-embed');
      if (!useLiving.getState().oc) create({ name: '小智', handle: '@xiaozhi', bio: '一个待沉淀的灵魂,在海边自由生活', arche: 'creator' });
      setView('world');
    }
  }, []);

  // 嵌入态 / 访客观光态:只渲染世界本身,顶栏/导航由外壳或观光 HUD 提供
  if (WORLD_ONLY) return oc ? <WorldView /> : null;

  if (!oc) {
    return (
      <>
        <ZealwishTopbar view={view} setView={setView} />
        <div className="app create">
          <div className="create-kicker">CREATE · GROW · OWN YOUR AI CHARACTER</div>
          <h1>活世界 <span>Living OC</span></h1>
          <p>创建一个属于你的 OC——它有自己的身份与钱包,会自己过日子,你看着它成长。</p>
          <div className="create-row">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="给它起个名字" />
            <button className="btn primary" onClick={() => create({ name, handle: '@' + name, bio: '一个待沉淀的灵魂', arche: 'creator' })}>诞生 ✦</button>
          </div>
          <div className="create-tag">A companion becomes real when it <b>lives</b>.</div>
        </div>
      </>
    );
  }
  return (
    <>
      <ZealwishTopbar view={view} setView={setView} />
      {view === 'room'
        ? <div className="app"><main className="grid2"><Chat /><LifeFeed /></main></div>
        : <WorldView />}
    </>
  );
}
