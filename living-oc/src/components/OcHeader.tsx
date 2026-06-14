import { useLiving } from '../store/useLiving';
import { exportOcFile } from '../oc/persist';
export default function OcHeader() {
  useLiving((s) => s.version);
  const oc = useLiving.getState().oc;
  if (!oc) return null;
  return (
    <header className="oc-header">
      <div className="nm">{oc.name} <span className="hd">{oc.handle}</span></div>
      <div className="meta">钱包 {oc.wallet.slice(0, 8)}… · 余额 {oc.balance}◈ · 活过 {oc.profile.daysLived} 天
        <button className="btn export" onClick={() => exportOcFile(oc)}>导出</button>
      </div>
    </header>
  );
}
