import { useState, useRef, useEffect } from 'react';
import { useLang } from '@/hooks/useLang';
import { useIsMobile } from '@/hooks/useIsMobile';
import ViewHeader from '@/components/ViewHeader';
import Composer from '@/components/Composer';
import OCMark from '@/components/OCMark';
import type { Message } from '@/types';

interface ChatViewProps {
  messages: Message[];
  onSend: (text: string) => void;
  isThinking: boolean;
  sessionTitle?: string;
  ttsEnabled?: boolean;
  avatarDataUrl?: string;
}

export default function ChatView({ messages, onSend, isThinking, sessionTitle, ttsEnabled, avatarDataUrl }: ChatViewProps) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const px = isMobile ? 16 : 56;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isThinking]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ViewHeader titleKey="nav.chat" subtitleRaw={`${t('chat.subtitle')} · ${sessionTitle || t('chat.new')}`} rightRaw={isMobile ? undefined : `${messages.length} ${t('chat.count')} · ${ttsEnabled ? 'TTS On' : 'TTS off'}`} />

      {messages.length === 0 ? (
        <ChatEmpty onSend={onSend} />
      ) : (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: `24px ${px}px 0` }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.text} time={m.time} avatarDataUrl={avatarDataUrl} />)}
              {isThinking && <ThinkingBubble avatarDataUrl={avatarDataUrl} />}
            </div>
          </div>
          <div style={{ padding: `14px ${px}px 24px` }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <Composer text={text} setText={setText}
                onSubmit={() => { if (text.trim()) { onSend(text); setText(''); } }}
                placeholder={t('chat.placeholder')}
                compact
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ChatEmpty({ onSend }: { onSend: (text: string) => void }) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const [text, setText] = useState('');
  const openers = [
    t('chat.opener.tired'),
    t('chat.opener.organize'),
    t('chat.opener.happy'),
    t('chat.opener.delay'),
  ];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: isMobile ? '0 16px' : '0 56px',
    }}>
      <OCMark scale={isMobile ? 1 : 1.5} />
      <div className="heitai" style={{ marginTop: 22, fontSize: isMobile ? 26 : 38, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
        {t('chat.empty.title')}<span style={{ color: 'var(--accent)' }}>。</span>
      </div>
      <div className="mono" style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.22em' }}>
        {t('chat.empty.sub')}
      </div>
      <div style={{ marginTop: 30, width: '100%', maxWidth: 640 }}>
        <Composer text={text} setText={setText}
          onSubmit={() => { if (text.trim()) { onSend(text); setText(''); } }}
          placeholder={t('chat.placeholder')}
        />
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 640 }}>
        {openers.map((s, i) => (
          <button key={i} onClick={() => onSend(s)}
            className="glass-soft"
            style={{
              padding: '7px 14px', fontSize: 12, letterSpacing: '0.02em',
              color: 'var(--ink-muted)', cursor: 'pointer',
              borderRadius: 99,
              transition: 'all .15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-muted)'; }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ role, text, time, avatarDataUrl }: { role: 'user' | 'oc'; text: string; time?: string; avatarDataUrl?: string }) {
  const { lang } = useLang();
  const isOC = role === 'oc';
  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 18,
      flexDirection: isOC ? 'row' : 'row-reverse',
      animation: 'fade-in .3s ease-out',
    }}>
      {isOC ? (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {avatarDataUrl ? (
            <img src={avatarDataUrl} alt="OC" style={{
              width: 30, height: 30, borderRadius: '50%',
              objectFit: 'cover', border: '1px solid var(--line)',
            }} />
          ) : (
            <OCMark scale={0.6} animated={false} />
          )}
        </div>
      ) : (
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#FFFFFF',
          fontSize: 11, fontWeight: 700,
          display: 'grid', placeItems: 'center',
          letterSpacing: '0.04em',
        }}>{lang === 'en' ? 'YOU' : '你'}</div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOC ? 'flex-start' : 'flex-end' }}>
        <div className={isOC ? 'glass-strong' : ''} style={{
          padding: '10px 14px',
          background: isOC ? undefined : 'var(--accent)',
          color: isOC ? 'var(--ink-on-glass)' : '#FFFFFF',
          fontSize: 13.5, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          borderRadius: isOC ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
          border: isOC ? undefined : '1px solid var(--accent-deep)',
          boxShadow: isOC ? undefined : '0 4px 12px -4px rgba(255,45,85,0.4)',
        }}>
          {text}
        </div>
        {time && (
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.16em', marginTop: 4 }}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble({ avatarDataUrl }: { avatarDataUrl?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        {avatarDataUrl ? (
          <img src={avatarDataUrl} alt="OC" style={{
            width: 30, height: 30, borderRadius: '50%',
            objectFit: 'cover', border: '1px solid var(--line)',
          }} />
        ) : (
          <OCMark scale={0.6} animated={false} />
        )}
      </div>
      <div className="glass-strong" style={{
        padding: '14px 16px',
        borderRadius: '16px 16px 16px 4px',
        display: 'flex', gap: 5,
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
            animation: `typing 1.2s ${i * 0.15}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
