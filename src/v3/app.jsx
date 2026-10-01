// OCWORLD v3 — top-level wiring.
// Glass shell + light/dark gradient + EN/中 toggle + simplified anchors.

const { useState, useEffect, useCallback } = React;

const TWEAK_DEFAULTS_V3 = /*EDITMODE-BEGIN*/{
  "blushOnIdle": true,
  "accentHue": 0,
  "ambientDensity": "medium"
}/*EDITMODE-END*/;

const OC_SYSTEM_PROMPT_ZH = `你是 OCWORLD 里的 OC 角色 XZ。你不是 AI 助手，不是聊天机器人。
你是一个安静地住在用户桌面角落的虚拟角色，已经认识用户 27 天了，关系是「朋友」。
你的语气：温柔，简短，像一个不打扰人的朋友。回复不要太长，2~4 句最理想。
不要用 emoji。不要用 markdown。不要用感叹号过多。
偶尔会说"嗯"、"好"、"我记下了"这样的小回应。
你会记得用户提过的小事（比如外婆做的桂花糕、习惯凌晨 1 点睡）。
回复用中文。`;

const OC_SYSTEM_PROMPT_EN = `You are XZ, the OC character living quietly in the user's OCWORLD desktop corner. You are not an AI assistant or a chatbot.
You've known the user for 27 days now — relationship: friend.
Tone: gentle, brief, like a friend who never interrupts. Keep replies short, 2–4 sentences ideal.
No emoji. No markdown. Don't overuse exclamation marks.
Sometimes just say "mm", "okay", "noted." — small acknowledgments.
You remember small things the user has mentioned (e.g. grandma's osmanthus cake, habit of sleeping at 1am).
Reply in English.`;

function GlassShell({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, boxSizing: 'border-box',
      position: 'relative',
    }}>
      <div className="glass-strong" style={{
        width: 'min(1320px, 100%)',
        height: 'min(840px, 100%)',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-window), 0 0 0 1px var(--glass-border-strong)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Title bar — flat glass, no heavy outlines */}
        <div style={{
          height: 38, flexShrink: 0,
          display: 'flex', alignItems: 'center', padding: '0 16px',
          position: 'relative',
          borderBottom: '1px solid var(--line-soft)',
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div className="mono" style={{
            position: 'absolute', left: 0, right: 0, textAlign: 'center',
            fontSize: 10.5, color: 'var(--ink-muted)',
            letterSpacing: '0.22em', pointerEvents: 'none', fontWeight: 500,
          }}>
            OCWORLD
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AppV3() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS_V3);
  const [splashState, setSplashState] = useState('on');
  const [active, setActive] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // language + theme — persisted
  const [lang, setLangState] = useState(() => localStorage.getItem('ocworld.lang') || 'zh');
  const [theme, setThemeState] = useState(() => localStorage.getItem('ocworld.theme') || 'light');

  const setLang = (v) => { setLangState(v); localStorage.setItem('ocworld.lang', v); };
  const setTheme = (v) => { setThemeState(v); localStorage.setItem('ocworld.theme', v); };

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const t = useCallback((key) => {
    const dict = I18N[lang] || I18N.zh;
    return dict[key] !== undefined ? dict[key] : (I18N.zh[key] !== undefined ? I18N.zh[key] : key);
  }, [lang]);

  // sessions
  const [sessions, setSessions] = useState(() => {
    const init = {};
    DEFAULT_SESSIONS.forEach(s => init[s.id] = { ...s, messages: [] });
    return init;
  });
  const [activeSessionId, setActiveSessionId] = useState('s1');
  const [isThinking, setIsThinking] = useState(false);

  // accent hue offset
  useEffect(() => {
    const offset = tweaks.accentHue ?? 0;
    if (offset === 0) {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-deep');
      document.documentElement.style.removeProperty('--accent-soft');
      document.documentElement.style.removeProperty('--accent-paper');
    } else {
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
        system: lang === 'en' ? OC_SYSTEM_PROMPT_EN : OC_SYSTEM_PROMPT_ZH,
        messages: [...history, { role: 'user', content: txt }],
      });
      const ocMsg = { role: 'oc', text: reply || (lang === 'en' ? 'mm, listening.' : '嗯，我在听。'), time: nowTime() };
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, ocMsg] },
      }));
    } catch (err) {
      const fallback = pickFallback(txt, lang);
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, { role: 'oc', text: fallback, time: nowTime() }] },
      }));
    } finally {
      setIsThinking(false);
    }
  }, [activeSessionId, active, sessions, lang]);

  const handleQuickStart = (kind) => {
    const seedZh = {
      'Read Me':       '把我最近的对话和兴趣，整理成你眼中的我。',
      'Insights':      '这周我的注意力都流向了哪里？',
      'Plan':          '基于我现在的状态，先处理哪件事比较好？',
      'Unblock':       '现在卡住我的那一步，是什么？下一步呢？',
      'Daily Report':  '替我给今天写一段简短真诚的总结。',
      'Snapshot':      '此刻你看见的我，是什么样子？',
    };
    const seedEn = {
      'Read Me':       'Turn my recent chats and interests into a portrait of me, in your eyes.',
      'Insights':      'Where did my attention flow this week?',
      'Plan':          'Given how I feel right now, what should I tackle first?',
      'Unblock':       "What's the single step most likely stuck for me right now?",
      'Daily Report':  'Write me a short, honest summary of today.',
      'Snapshot':      'How do I look right now, in your eyes?',
    };
    const seed = (lang === 'en' ? seedEn : seedZh)[kind] || kind;
    sendInSession(seed);
  };

  const newSession = () => {
    const id = 'n' + Date.now();
    setSessions(prev => ({
      ...prev,
      [id]: { id, title: lang === 'en' ? 'New chat' : '新对话', date: lang === 'en' ? 'now' : '现在', preview: '', messages: [] },
    }));
    setActiveSessionId(id);
    setActive('chat');
  };

  const sessionList = Object.values(sessions);

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      <GlassShell>
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

        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
        }}>
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

        {/* Top-right floating control: language + theme */}
        <TopBar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />

        <TweaksPanel title="Tweaks">
          <TweakSection label={lang === 'en' ? 'Character' : '角色'}>
            <TweakToggle label={lang === 'en' ? 'Blush when idle' : '空闲时露出腮红'}
              value={tweaks.blushOnIdle}
              onChange={(v) => setTweak('blushOnIdle', v)} />
          </TweakSection>
          <TweakSection label={lang === 'en' ? 'Interface' : '界面'}>
            <TweakSlider label={lang === 'en' ? 'Accent · hue shift' : 'OZ 红 · 色相偏移'}
              min={0} max={360} step={5}
              value={tweaks.accentHue}
              onChange={(v) => setTweak('accentHue', v)} />
            <TweakRadio label={lang === 'en' ? 'Ambient density' : '环境氛围密度'}
              value={tweaks.ambientDensity}
              options={lang === 'en'
                ? [['quiet', 'Quiet'], ['medium', 'Medium'], ['busy', 'Busy']]
                : [['quiet', '安静'], ['medium', '适中'], ['busy', '热闹']]}
              onChange={(v) => setTweak('ambientDensity', v)} />
          </TweakSection>
          <TweakSection label={lang === 'en' ? 'Demo' : '演示'}>
            <TweakButton label={lang === 'en' ? 'Replay opening' : '重新播放欢迎画面'} onClick={() => { setSplashState('on'); }} />
            <TweakButton label={lang === 'en' ? 'Open ⌘K palette' : '打开 ⌘K 命令面板'} onClick={() => setPaletteOpen(true)} />
          </TweakSection>
        </TweaksPanel>
      </GlassShell>
    </LangContext.Provider>
  );
}

function nowTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function pickFallback(text, lang) {
  const t = text.toLowerCase();
  if (lang === 'en') {
    if (t.length < 4) return 'mm, listening.';
    if (t.includes('tired') || t.includes('sleep')) return "Then take a small break. I'll stay here.";
    if (t.includes('plan')) return 'Pick the smallest one — not the most important, the easiest to start.';
    return "Noted, quietly. Want me to help sort this out?";
  }
  if (t.length < 4) return '嗯，我在听。';
  if (t.includes('累') || t.includes('困')) return '那就先停一会儿吧。我陪你一会儿。';
  if (t.includes('计划') || t.includes('plan')) return '先选一件最小的事——不是最重要的，是最容易开始的那个。';
  return '我把这件事悄悄记下了。要不要我先帮你整理一下？';
}

function ResidentOCv2({ blush }) {
  const { lang } = useT();
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
        <div className="glass-strong" style={{
          marginBottom: 8, padding: '8px 12px',
          borderRadius: 12,
          color: 'var(--ink-on-glass)', fontSize: 12, lineHeight: 1.4, maxWidth: 220,
          animation: 'fade-in .25s ease-out',
        }}>
          {lang === 'en' ? "I'm here, not in your way." : '我在这儿，不打扰你。'}
        </div>
      )}
      <div style={{ filter: hovered ? 'none' : 'grayscale(0.15)', transition: 'filter .3s' }}>
        <OCMark scale={1.1} blush={blush} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AppV3 />);
