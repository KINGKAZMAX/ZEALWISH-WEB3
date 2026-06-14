import { useState } from 'react';
import { useLiving } from '../store/useLiving';
export default function Chat() {
  useLiving((s) => s.version);
  const { day, chatLog } = useLiving.getState();
  const send = useLiving((s) => s.send);
  const guide = useLiving((s) => s.guide);
  const [text, setText] = useState('');
  const [g, setG] = useState('');
  return (
    <section className="chat">
      <div className="col-head">近景 · 和它对话</div>
      <button className="btn" onClick={() => send('今天过得怎么样')} disabled={!day}>☀ 问问它今天</button>
      <div className="log">
        {chatLog.map((m, i) => <div key={i} className={'msg ' + m.who}>{m.text}</div>)}
      </div>
      <div className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="说点什么…" />
        <button className="btn" onClick={() => { if (text) { send(text); setText(''); } }}>发送</button>
      </div>
      <div className="row guide">
        <input value={g} onChange={(e) => setG(e.target.value)} placeholder="引导它(会沉淀进它的信念)…" />
        <button className="btn" onClick={() => { if (g) { guide(g); setG(''); } }}>引导</button>
      </div>
    </section>
  );
}
