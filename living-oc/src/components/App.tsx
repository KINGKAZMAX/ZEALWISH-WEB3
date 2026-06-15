import { useState, useEffect } from 'react';
import { useLiving } from '../store/useLiving';
import ZealwishTopbar from './ZealwishTopbar';
import LifeFeed from './LifeFeed';
import Chat from './Chat';
import WorldView from './WorldView';

export default function App() {
  useLiving((s) => s.version);
  const oc = useLiving.getState().oc;
  const create = useLiving((s) => s.create);
  const load = useLiving((s) => s.load);
  const view = useLiving((s) => s.view);
  const setView = useLiving((s) => s.setView);
  const [name, setName] = useState('小智');
  useEffect(() => { load(); }, [load]);

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
      <div className={'app' + (view === 'world' ? ' wide' : '')}>
        {view === 'room'
          ? <main className="grid2"><Chat /><LifeFeed /></main>
          : <WorldView />}
      </div>
    </>
  );
}
