import { useState } from 'react';
import { useLang } from '@/hooks/useLang';
import { IconAttach, IconBars, IconArrowUp } from './Icons';

interface ComposerProps {
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  compact?: boolean;
}

export default function Composer({ text, setText, onSubmit, placeholder, compact }: ComposerProps) {
  const { lang, t } = useLang();
  const [focus, setFocus] = useState(false);

  return (
    <div className="glass-strong" style={{
      width: '100%',
      padding: '12px 14px 8px',
      borderRadius: 14,
      transition: 'all .2s',
      borderColor: focus ? 'var(--accent-soft)' : undefined,
      boxShadow: focus ? '0 0 0 3px var(--accent-soft), var(--glass-shadow)' : undefined,
    }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); onSubmit();
          }
        }}
        rows={compact ? 1 : 2}
        placeholder={placeholder}
        style={{
          width: '100%', border: 'none', outline: 'none', resize: 'none',
          background: 'transparent', color: 'var(--ink)',
          fontSize: 14, lineHeight: 1.6,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <button style={iconBtnGhost} title={lang === 'en' ? 'Attach' : '附件'}><IconAttach size={14} color="var(--ink-muted)" /></button>
        <button style={iconBtnGhost} title={lang === 'en' ? 'Templates' : '模板'}><IconBars size={14} color="var(--ink-muted)" /></button>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em', marginLeft: 4 }}>
          {lang === 'en' ? 'ENTER · SHIFT+ENTER newline' : 'ENTER 发送 · SHIFT+ENTER 换行'}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onSubmit}
          disabled={!text.trim()}
          style={{
            padding: '7px 16px',
            background: text.trim() ? 'var(--accent)' : 'transparent',
            color: text.trim() ? '#FFFFFF' : 'var(--ink-faint)',
            border: '1px solid ' + (text.trim() ? 'var(--accent)' : 'var(--line)'),
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
            borderRadius: 8,
            transition: 'all .15s',
            boxShadow: text.trim() ? '0 4px 10px -2px rgba(255,45,85,0.4)' : 'none',
          }}
        >
          {t('chat.send')}
          <IconArrowUp size={11} color={text.trim() ? '#FFFFFF' : 'var(--ink-faint)'} />
        </button>
      </div>
    </div>
  );
}

const iconBtnGhost: React.CSSProperties = {
  width: 26, height: 26, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
};
