import { useLiving } from '../store/useLiving';
import { exportOcFile } from '../oc/persist';

function hue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

type View = 'room' | 'world';

export default function ZealwishTopbar({ view, setView }: { view: View; setView: (v: View) => void }) {
  useLiving((s) => s.version);
  const oc = useLiving.getState().oc;
  return (
    <header className="zw-topbar">
      <div className="zw-left">
        <span className="zw-brand">ZEALWISH</span>
        <span className="zw-product">LIVING OC</span>
      </div>
      {oc && (
        <nav className="zw-nav">
          <button className={view === 'room' ? 'on' : ''} onClick={() => setView('room')}>卧室</button>
          <button className={view === 'world' ? 'on' : ''} onClick={() => setView('world')}>世界</button>
        </nav>
      )}
      <div className="zw-right">
        {oc && (
          <>
            <div className="zw-chip" title={oc.wallet}>
              <span className="zw-av" style={{ background: `hsl(${hue(oc.id)},48%,55%)` }} />
              <span className="zw-id">
                <b>{oc.name} <span className="zw-star">★</span></b>
                <i>{oc.wallet.slice(0, 6)}…{oc.wallet.slice(-4)} · {oc.balance}◈ · 活过 {oc.profile.daysLived} 天</i>
              </span>
            </div>
            <button className="zw-export" onClick={() => exportOcFile(oc)}>导出</button>
          </>
        )}
      </div>
    </header>
  );
}
