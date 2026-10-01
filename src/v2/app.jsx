// OCWORLD v2 — top-level wiring.
// Window chrome + splash + nav switching + Claude-powered chat + ⌘K + Tweaks.

const { useState, useEffect, useCallback } = React;

const TWEAK_DEFAULTS_V2 = /*EDITMODE-BEGIN*/{
  "blushOnIdle": true,
  "accentHue": 0,
  "ambientDensity": "medium"
}/*EDITMODE-END*/;

const OC_SYSTEM_PROMPT = `你是 OCWORLD 里的 OC 角色 XZ。你不是 AI 助手，不是聊天机器人。
你是一个安静地住在用户桌面角落的虚拟角色，已经认识用户 27 天了，关系是「朋友」。
你的语气：温柔，简短，像一个不打扰人的朋友。回复不要太长，2~4 句最理想。
不要用 emoji。不要用 markdown。不要用感叹号过多。
偶尔会说"嗯"、"好"、"我记下了"这样的小回应。
你会记得用户提过的小事（比如外婆做的桂花糕、习惯凌晨 1 点睡）。
回复用中文。`;

function DesktopShellV2({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, boxSizing: 'border-box',
    }}>
      <div style={{
        width: 'min(1320px, 100%)',
        height: 'min(840px, 100%)',
        background: 'var(--bg-window)',
        border: '1px solid var(--ink)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-window)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Title bar */}
        <div style={{
          height: 34, flexShrink: 0,
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--ink)',
          display: 'flex', alignItems: 'center', padding: '0 14px',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--accent)', border: '1px solid var(--ink)' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f3ecdb', border: '1px solid var(--ink)' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f3ecdb', border: '1px solid var(--ink)' }} />
          </div>
          <div className="mono" style={{
            position: 'absolute', left: 0, right: 0, textAlign: 'center',
            fontSize: 11, color: 'var(--ink)',
            letterSpacing: '0.22em', pointerEvents: 'none', fontWeight: 600,
          }}>
            OCWORLD · v0.2 · 桌面的住人
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AppV2() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS_V2);
  const [splashState, setSplashState] = useState('on');
  const [active, setActive] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // sessions: { [id]: { id, title, date, preview, messages: [] } }
  const [sessions, setSessions] = useState(() => {
    const init = {};
    DEFAULT_SESSIONS.forEach(s => init[s.id] = { ...s, messages: [] });
    return init;
  });
  const [activeSessionId, setActiveSessionId] = useState('s1');
  const [isThinking, setIsThinking] = useState(false);

  // accent hue offset (0 = OZ red default)
  useEffect(() => {
    const offset = tweaks.accentHue ?? 0;
    if (offset === 0) {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-deep');
      document.documentElement.style.removeProperty('--accent-soft');
      document.documentElement.style.removeProperty('--accent-paper');
    } else {
      // base OZ red ≈ hue 16. Shift by offset.
      const h = (16 + offset) % 360;
      document.documentElement.style.setProperty('--accent',       `oklch(0.62 0.21 ${h})`);
      document.documentElement.style.setProperty('--accent-deep',  `oklch(0.52 0.22 ${h})`);
      document.documentElement.style.setProperty('--accent-soft',  `oklch(0.92 0.06 ${h})`);
      document.documentElement.style.setProperty('--accent-paper', `oklch(0.94 0.04 ${h})`);
    }
  }, [tweaks.accentHue]);

  // ⌘K
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setPaletteOpen(o => !o);
      }
      if (e.key === 'Escape' && paletteOpen) setPaletteOpen(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [paletteOpen]);

  const dismissSplash = () => {
    setSplashState('fading');
    setTimeout(() => setSplashState('off'), 500);
  };

  const activeSession = sessions[activeSessionId];

  const sendInSession = useCallback(async (txt) => {
    if (!txt || !txt.trim()) return;
    const sid = activeSessionId;
    const userMsg = { role: 'user', text: txt, time: nowTime() };
    setSessions(prev => ({
      ...prev,
      [sid]: { ...prev[sid], messages: [...prev[sid].messages, userMsg], preview: txt.slice(0, 24) },
    }));
    if (active !== 'chat') setActive('chat');
    setIsThinking(true);

    try {
      const history = sessions[sid].messages
        .filter(m => m.role === 'user' || m.role === 'oc')
        .map(m => ({ role: m.role === 'oc' ? 'assistant' : 'user', content: m.text }));
      const reply = await window.claude.complete({
        system: OC_SYSTEM_PROMPT,
        messages: [...history, { role: 'user', content: txt }],
      });
      const ocMsg = { role: 'oc', text: reply || '嗯，我在听。', time: nowTime() };
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, ocMsg] },
      }));
    } catch (err) {
      const fallback = pickFallback(txt);
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, { role: 'oc', text: fallback, time: nowTime() }] },
      }));
    } finally {
      setIsThinking(false);
    }
  }, [activeSessionId, active, sessions]);

  const handleQuickStart = (kind) => {
    const seed = {
      'Read Me':       '把我最近的对话和兴趣，整理成你眼中的我。',
      'Insights':      '这周我的注意力都流向了哪里？',
      'Plan':          '基于我现在的状态，先处理哪件事比较好？',
      'Unblock':       '现在卡住我的那一步，是什么？下一步呢？',
      'Daily Report':  '替我给今天写一段简短真诚的总结。',
      'Snapshot':      '此刻你看见的我，是什么样子？',
    }[kind] || kind;
    sendInSession(seed);
  };

  const newSession = () => {
    const id = 'n' + Date.now();
    setSessions(prev => ({
      ...prev,
      [id]: { id, title: '新对话', date: '现在', preview: '', messages: [] },
    }));
    setActiveSessionId(id);
    setActive('chat');
  };

  const sessionList = Object.values(sessions);

  return (
    <DesktopShellV2>
      {splashState !== 'off' && (
        <SplashV2 onEnter={dismissSplash} fadingOut={splashState === 'fading'} />
      )}

      <SidebarV2
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        sessions={sessionList}
        activeSession={activeSessionId}
        setActiveSession={(id) => { setActiveSessionId(id); setActive('chat'); }}
        onNewSession={newSession}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-window)', position: 'relative' }}>
        {active === 'home'   && <PlazaViewV2 onSendTask={sendInSession} onPickQuickStart={handleQuickStart} onNav={setActive} />}
        {active === 'chat'   && <ChatViewV2 messages={activeSession?.messages || []} onSend={sendInSession} isThinking={isThinking} sessionTitle={activeSession?.title} />}
        {active === 'rewind' && <RewindViewV2 />}
        {active === 'memory' && <RecordViewV2 />}
        {active === 'settings' && <SettingsViewV2 tweaks={tweaks} setTweak={setTweak} onReplaySplash={() => setSplashState('on')} />}

        {splashState === 'off' && active !== 'home' && active !== 'chat' && (
          <ResidentOCv2 blush={tweaks.blushOnIdle} />
        )}
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
        onNav={(id) => setActive(id)}
        onNewSession={newSession}
        sessions={sessionList}
        onPickSession={(id) => { setActiveSessionId(id); setActive('chat'); }}
      />

      <TweaksPanel title="Tweaks">
        <TweakSection label="角色">
          <TweakToggle label="空闲时露出腮红"
            value={tweaks.blushOnIdle}
            onChange={(v) => setTweak('blushOnIdle', v)} />
        </TweakSection>
        <TweakSection label="界面">
          <TweakSlider label="OZ 红 · 色相偏移"
            min={0} max={360} step={5}
            value={tweaks.accentHue}
            onChange={(v) => setTweak('accentHue', v)} />
          <TweakRadio label="环境氛围密度"
            value={tweaks.ambientDensity}
            options={[['quiet', '安静'], ['medium', '适中'], ['busy', '热闹']]}
            onChange={(v) => setTweak('ambientDensity', v)} />
        </TweakSection>
        <TweakSection label="演示">
          <TweakButton label="重新播放欢迎画面" onClick={() => { setSplashState('on'); }} />
          <TweakButton label="打开 ⌘K 命令面板" onClick={() => setPaletteOpen(true)} />
        </TweakSection>
      </TweaksPanel>
    </DesktopShellV2>
  );
}

function nowTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function pickFallback(text) {
  const t = text.toLowerCase();
  if (t.length < 4) return '嗯，我在听。';
  if (t.includes('累') || t.includes('困')) return '那就先停一会儿吧。我陪你一会儿。';
  if (t.includes('计划') || t.includes('plan')) return '先选一件最小的事——不是最重要的，是最容易开始的那个。';
  return '我把这件事悄悄记下了。要不要我先帮你整理一下？';
}

function ResidentOCv2({ blush }) {
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
          marginBottom: 8, padding: '7px 11px',
          background: '#fff', border: '1px solid var(--ink)',
          color: 'var(--ink)', fontSize: 12, lineHeight: 1.4, maxWidth: 220,
          animation: 'fade-in .25s ease-out',
        }}>
          我在这儿，不打扰你。
        </div>
      )}
      <div style={{ filter: hovered ? 'none' : 'grayscale(0.15)', transition: 'filter .3s' }}>
        <OCMark scale={1.1} blush={blush} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppV2 />);
