// Top-level OCWORLD app — desktop window chrome + splash + main views.

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showWindowChrome": true,
  "blushOnIdle": true,
  "accentHue": 220
}/*EDITMODE-END*/;

function DesktopShell({ children }) {
  // macOS-style window chrome wrapping the whole app
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, boxSizing: 'border-box',
    }}>
      <div style={{
        width: 'min(1280px, 100%)',
        height: 'min(820px, 100%)',
        background: 'var(--bg-window)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-window)',
        border: '0.5px solid oklch(0.88 0.005 240)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Title bar */}
        <div style={{
          height: 36, flexShrink: 0,
          background: 'linear-gradient(180deg, oklch(0.985 0.003 240), oklch(0.96 0.005 240))',
          borderBottom: '0.5px solid var(--line)',
          display: 'flex', alignItems: 'center', padding: '0 14px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57', border: '0.5px solid rgba(0,0,0,0.08)' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E', border: '0.5px solid rgba(0,0,0,0.08)' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840', border: '0.5px solid rgba(0,0,0,0.08)' }} />
          </div>
          <div style={{
            position: 'absolute', left: 0, right: 0, textAlign: 'center',
            fontSize: 12, fontWeight: 600, color: 'var(--ink-muted)',
            letterSpacing: '0.04em', pointerEvents: 'none',
          }}>
            OCWORLD — 你的 OC 住在桌面角落
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [splashState, setSplashState] = useState('on'); // 'on' | 'fading' | 'off'

  const [active, setActive] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [activeSession, setActiveSession] = useState('今天降温了，记得加件外套');
  const [messages, setMessages] = useState([]);

  // Update accent hue from tweaks
  useEffect(() => {
    const h = tweaks.accentHue ?? 220;
    document.documentElement.style.setProperty('--accent', `oklch(0.78 0.10 ${h})`);
    document.documentElement.style.setProperty('--accent-deep', `oklch(0.66 0.12 ${h})`);
    document.documentElement.style.setProperty('--accent-soft', `oklch(0.94 0.04 ${h})`);
  }, [tweaks.accentHue]);

  const dismissSplash = () => {
    setSplashState('fading');
    setTimeout(() => setSplashState('off'), 500);
  };

  const handleSend = (txt) => {
    if (!txt || !txt.trim()) return;
    const reply = pickReply(txt);
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: txt },
      { role: 'oc', text: reply },
    ]);
    if (active !== 'chat') setActive('chat');
  };

  const handleQuickStart = (kind) => {
    const seed = {
      'Read Me':       '把我最近的对话和兴趣，整理成你眼中的我。',
      'Insights':      '这周我的注意力都流向了哪里？',
      'Plan':          '基于我现在的状态，先处理哪件事比较好？',
      'Unblock Me':    '现在卡住我的那一步，是什么？下一步呢？',
      'Daily Report':  '替我给今天写一段简短真诚的总结。',
      'Snapshot':      '此刻你看见的我，是什么样子？',
    }[kind] || kind;
    handleSend(seed);
  };

  const newSession = () => { setMessages([]); setActive('chat'); };

  return (
    <DesktopShell>
      {splashState !== 'off' && (
        <Splash onEnter={dismissSplash} fadingOut={splashState === 'fading'} />
      )}

      <Sidebar
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeSession={activeSession}
        setActiveSession={(n) => { setActiveSession(n); setActive('chat'); }}
        onNewSession={newSession}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-window)', position: 'relative' }}>
        {active === 'home'   && <HomeView   onSendTask={handleSend} onPickQuickStart={handleQuickStart} />}
        {active === 'chat'   && <AgentView  messages={messages} onSend={handleSend} />}
        {active === 'rewind' && <RewindView />}
        {active === 'memory' && <MemoryView />}

        {/* Resident OC at the screen edge — only on views where it won't collide */}
        {splashState === 'off' && (active === 'rewind' || active === 'memory') && (
          <ResidentOC blush={tweaks.blushOnIdle} />
        )}
      </main>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="角色">
          <TweakToggle
            label="空闲时露出腮红"
            value={tweaks.blushOnIdle}
            onChange={(v) => setTweak('blushOnIdle', v)}
          />
        </TweakSection>
        <TweakSection label="界面">
          <TweakSlider
            label="主色调 · Hue"
            min={160} max={300} step={5}
            value={tweaks.accentHue}
            onChange={(v) => setTweak('accentHue', v)}
          />
        </TweakSection>
        <TweakSection label="演示">
          <TweakButton label="重新播放欢迎画面" onClick={() => { setSplashState('on'); }} />
        </TweakSection>
      </TweaksPanel>
    </DesktopShell>
  );
}

function pickReply(text) {
  const t = text.toLowerCase();
  if (t.length < 4) return '嗯，我在听。';
  if (t.includes('累') || t.includes('困')) return '那就先停一会儿吧。我陪你一会儿。';
  if (t.includes('计划') || t.includes('plan')) return '先选一件最小的事——不是最重要的，是最容易开始的那个。';
  if (t.includes('unblock') || t.includes('卡')) return '我猜是这件：你脑子里反复想、却一直没有动手的那一件。要不要先写下它？';
  if (t.includes('snapshot') || t.includes('看见') || t.includes('我')) return '此刻的你 — 凌晨睡，咖啡不加糖，心里有几件没说出口的事。但今天你打开了我，那就是个好开始。';
  if (t.includes('总结') || t.includes('report') || t.includes('今天')) return '今天没什么轰轰烈烈的事。但你在凌晨之前回了消息、出门走了一圈、还记得喝水。我都看见了。';
  return '我把这件事悄悄记下了。要不要我先帮你整理一下？';
}

// Quietly resident OC in the corner of the main canvas — the "lives at the edge" idea
function ResidentOC({ blush }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', right: 22, bottom: 22, zIndex: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        pointerEvents: 'auto', userSelect: 'none',
      }}
    >
      {hovered && (
        <div style={{
          marginBottom: 8,
          padding: '7px 11px', borderRadius: 10,
          background: 'oklch(0.96 0.04 175)',
          border: '0.5px solid oklch(0.85 0.06 175)',
          color: 'oklch(0.32 0.07 175)',
          fontSize: 12, lineHeight: 1.4, maxWidth: 220,
          boxShadow: 'var(--shadow-pop)',
          animation: 'fade-in .25s ease-out',
        }}>
          我在这儿，不打扰你。
        </div>
      )}
      <div style={{ filter: hovered ? 'none' : 'grayscale(0.15)', transition: 'filter .3s' }}>
        <OCMark scale={1.2} blush={blush} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
