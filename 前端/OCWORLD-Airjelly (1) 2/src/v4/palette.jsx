// ⌘K command palette for OCWORLD v2.

function CommandPalette({ open, onClose, onNav, onNewSession, sessions, onPickSession }) {
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef(null);
  const [sel, setSel] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setQ(''); setSel(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);

  const items = React.useMemo(() => {
    const navItems = [
      { kind: 'nav', id: 'home',     label: '广场 · Plaza',    kanji: '広', do: () => onNav('home') },
      { kind: 'nav', id: 'chat',     label: '对话 · Talk',     kanji: '会', do: () => onNav('chat') },
      { kind: 'nav', id: 'rewind',   label: '回溯 · Rewind',   kanji: '記', do: () => onNav('rewind') },
      { kind: 'nav', id: 'memory',   label: '记录 · Record',   kanji: '録', do: () => onNav('memory') },
      { kind: 'nav', id: 'settings', label: '设置 · Settings', kanji: '設', do: () => onNav('settings') },
      { kind: 'act', id: 'new',      label: '新对话',           kanji: '＋', do: () => onNewSession() },
    ];
    const sessionItems = (sessions || []).map(s => ({
      kind: 'session', id: s.id, label: s.title, hint: s.date, kanji: '話',
      do: () => onPickSession(s.id),
    }));
    const all = [...navItems, ...sessionItems];
    if (!q.trim()) return all;
    const ql = q.toLowerCase();
    return all.filter(it => it.label.toLowerCase().includes(ql));
  }, [q, sessions]);

  React.useEffect(() => { setSel(0); }, [q]);

  if (!open) return null;

  const trigger = (it) => { it.do(); onClose(); };

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: 'rgba(10, 10, 10, 0.72)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 100, animation: 'fade-in .15s',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 'min(560px, 90%)',
        background: 'var(--bg-window)',
        border: '1px solid var(--ink)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
        animation: 'fade-in .2s',
      }}>
        <div style={{
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--line)',
        }}>
          <IconSearch size={14} color="var(--ink-muted)" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
              if (e.key === 'Enter' && items[sel]) { e.preventDefault(); trigger(items[sel]); }
            }}
            placeholder="搜索 / 跳转 / 命令…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, color: 'var(--ink)',
            }} />
          <span className="mono" style={{
            padding: '2px 6px', border: '1px solid var(--line)',
            fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em',
          }}>ESC</span>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 4 }}>
          {items.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
              没找到这个。
            </div>
          ) : items.map((it, i) => (
            <button key={it.kind + ':' + it.id} onClick={() => trigger(it)}
              onMouseEnter={() => setSel(i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', border: 'none', textAlign: 'left',
                background: sel === i ? '#FFFFFF' : 'transparent',
                outline: sel === i ? '1px solid var(--ink)' : 'none', outlineOffset: -1,
                cursor: 'pointer',
              }}>
              <span className="kanji" style={{
                width: 22, height: 22, display: 'grid', placeItems: 'center',
                background: sel === i ? 'var(--accent)' : 'transparent',
                color: sel === i ? '#FFFFFF' : 'var(--accent)',
                border: '1px solid var(--accent)',
                fontSize: 13, fontWeight: 700,
              }}>{it.kanji}</span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>{it.label}</span>
              {it.hint && <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>{it.hint}</span>}
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{it.kind}</span>
            </button>
          ))}
        </div>
        <div className="mono" style={{
          padding: '8px 14px', borderTop: '1px solid var(--line)',
          fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>↑↓ 选择 · ↵ 打开</span>
          <span>OCWORLD · CMD</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette });
