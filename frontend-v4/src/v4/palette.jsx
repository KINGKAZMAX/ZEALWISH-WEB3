// ZEALWISH v4 — English-only command palette.

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
      { kind: 'nav', id: 'home',     label: 'Signal Plaza',      code: 'HM', do: () => onNav('home') },
      { kind: 'nav', id: 'chat',     label: 'Talk',              code: 'TK', do: () => onNav('chat') },
      { kind: 'nav', id: 'world',    label: 'World Layer',       code: 'WD', do: () => onNav('world') },
      { kind: 'nav', id: 'rewind',   label: 'Rewind Timeline',   code: 'RW', do: () => onNav('rewind') },
      { kind: 'nav', id: 'memory',   label: 'Memory Vault',      code: 'MV', do: () => onNav('memory') },
      { kind: 'nav', id: 'settings', label: 'Identity Settings', code: 'ST', do: () => onNav('settings') },
      { kind: 'act', id: 'new',      label: 'New chat',          code: '+',  do: () => onNewSession() },
    ];
    const sessionItems = (sessions || []).map(s => ({
      kind: 'session', id: s.id, label: s.title, hint: s.date, code: 'CH',
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
        border: '1px solid var(--line-red)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
        animation: 'fade-in .2s',
      }}>
        <div style={{
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--line-red)',
        }}>
          <IconSearch size={14} color="var(--ink-muted)" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
              if (e.key === 'Enter' && items[sel]) { e.preventDefault(); trigger(items[sel]); }
            }}
            placeholder="Search routes, chats, or commands..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, color: 'var(--ink)',
            }} />
          <span className="mono" style={{
            padding: '2px 6px', border: '1px solid var(--line-red)',
            fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em',
          }}>ESC</span>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 4 }}>
          {items.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
              No matching command.
            </div>
          ) : items.map((it, i) => (
            <button key={it.kind + ':' + it.id} onClick={() => trigger(it)}
              onMouseEnter={() => setSel(i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', border: 'none', textAlign: 'left',
                background: sel === i ? 'var(--red)' : 'transparent',
                outline: sel === i ? '1px solid var(--red)' : 'none', outlineOffset: -1,
                cursor: 'pointer',
              }}>
              <span className="mono" style={{
                width: 28, height: 22, display: 'grid', placeItems: 'center',
                background: sel === i ? '#FFFFFF' : 'transparent',
                color: sel === i ? 'var(--red)' : 'var(--red)',
                border: '1px solid var(--red)',
                fontSize: 10, fontWeight: 800,
              }}>{it.code}</span>
              <span style={{ flex: 1, fontSize: 13, color: sel === i ? '#FFFFFF' : 'var(--ink)' }}>{it.label}</span>
              {it.hint && <span className="mono" style={{ fontSize: 9, color: sel === i ? 'rgba(255,255,255,0.74)' : 'var(--ink-faint)', letterSpacing: '0.14em' }}>{it.hint}</span>}
              <span className="mono" style={{ fontSize: 9, color: sel === i ? 'rgba(255,255,255,0.74)' : 'var(--ink-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{it.kind}</span>
            </button>
          ))}
        </div>
        <div className="mono" style={{
          padding: '8px 14px', borderTop: '1px solid var(--line-red)',
          fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>ARROWS TO SELECT · ENTER TO OPEN</span>
          <span>ZEALWISH · CMD</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette });
