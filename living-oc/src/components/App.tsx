import { useState, useEffect } from 'react';
import { useLiving } from '../store/useLiving';
import OcHeader from './OcHeader';
import LifeFeed from './LifeFeed';
import Chat from './Chat';

export default function App() {
  useLiving((s) => s.version);
  const oc = useLiving.getState().oc;
  const create = useLiving((s) => s.create);
  const load = useLiving((s) => s.load);
  const [name, setName] = useState('小智');
  useEffect(() => { load(); }, [load]);

  if (!oc) {
    return (
      <div className="app create">
        <h1>ZEALWISH · 活世界</h1>
        <p>创建一个属于你的 OC——它会自己过日子,你看着它成长。</p>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary" onClick={() => create({ name, handle: '@' + name, bio: '一个待沉淀的灵魂', arche: 'creator' })}>诞生</button>
      </div>
    );
  }
  return (
    <div className="app">
      <OcHeader />
      <main className="grid2"><Chat /><LifeFeed /></main>
    </div>
  );
}
