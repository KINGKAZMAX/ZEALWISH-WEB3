// ZEALWISH v4 — top-level wiring.
// Black-red app shell, English-only product flow, direct module intents.

const { useState, useEffect, useCallback } = React;

const TWEAK_DEFAULTS_V3 = /*EDITMODE-BEGIN*/{
  "blushOnIdle": true,
  "accentHue": 0,
  "accentPreset": "signal",
  "ambientDensity": "medium"
}/*EDITMODE-END*/;

const OC_SYSTEM_PROMPT_ZH = `你是 ZEALWISH 里的 OC 角色 XZ。你不是 AI 助手，不是聊天机器人。
你是一个安静地住在用户桌面角落的虚拟角色，已经认识用户 27 天了，关系是「朋友」。
你的语气：温柔，简短，像一个不打扰人的朋友。回复不要太长，2~4 句最理想。
不要用 emoji。不要用 markdown。不要用感叹号过多。
偶尔会说"嗯"、"好"、"我记下了"这样的小回应。
你会记得用户提过的小事（比如外婆做的桂花糕、习惯凌晨 1 点睡）。
回复用中文。`;

const OC_SYSTEM_PROMPT_EN = `You are XZ, the OC character living quietly in the user's ZEALWISH desktop corner. You are not an AI assistant or a chatbot.
You've known the user for 27 days now — relationship: friend.
Tone: gentle, brief, like a friend who never interrupts. Keep replies short, 2–4 sentences ideal.
No emoji. No markdown. Don't overuse exclamation marks.
Sometimes just say "mm", "okay", "noted." — small acknowledgments.
You remember small things the user has mentioned (e.g. grandma's osmanthus cake, habit of sleeping at 1am).
Reply in English.`;

const RUNTIME_DEFAULT = {
  native: false,
  hermes: null,
  tts: null,
  airjelly: null,
  lastError: null,
};

const DEFAULT_OC_DESCRIPTION = 'An adventurous boy with a red cap, cool expression, tactical goggles, small ponytail, white background, pixel art style, red windbreaker, backpack, small isekai companion pet. Style varies but keeps consistent color palette. No Martin boots — flat Nike sneakers, long loose wide-leg pants.';

const OC_STYLE_LABELS = {
  pixel: { zh: '像素风', en: 'pixel art' },
  anime: { zh: '二次元', en: 'anime' },
  cyber: { zh: '赛博机械', en: 'cyber mechanical' },
  figure: { zh: '3D 手办', en: '3D collectible figure' },
  comic: { zh: '漫画线稿', en: 'comic ink' },
  arcade: { zh: '复古街机', en: 'retro arcade' },
};

function GlassShell({ children }) {
  return (
    <div data-zealwish-app-shell="true" style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(14px, 2vw, 26px)', boxSizing: 'border-box',
      position: 'relative',
      background:
        'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px), radial-gradient(circle at 78% 18%, rgba(255,45,45,0.20), transparent 34%), #0A0A0A',
      backgroundSize: '36px 36px, 36px 36px, auto, auto',
    }}>
      <div className="edge red-line" style={{
        width: 'min(1380px, 100%)',
        height: 'min(880px, 100%)',
        overflow: 'hidden',
        boxShadow: '0 28px 80px rgba(0,0,0,0.64), 0 0 0 1px rgba(255,45,45,0.36), 0 0 80px rgba(255,45,45,0.12)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        background: 'rgba(10,10,10,0.94)',
      }}>
        <div style={{
          height: 44, flexShrink: 0,
          display: 'flex', alignItems: 'center', padding: '0 16px',
          position: 'relative',
          borderBottom: '1px solid var(--line-red)',
          background: 'linear-gradient(90deg, rgba(255,45,45,0.22), rgba(10,10,10,0.98) 28%, rgba(255,255,255,0.05) 50%, rgba(10,10,10,0.98) 72%, rgba(255,45,45,0.18))',
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: 0, background: 'var(--red)', border: '1px solid var(--red)' }} />
            <span style={{ width: 11, height: 11, borderRadius: 0, background: 'transparent', border: '1px solid rgba(255,255,255,.65)' }} />
            <span style={{ width: 11, height: 11, borderRadius: 0, background: '#FFFFFF', border: '1px solid #FFFFFF' }} />
          </div>
          <div className="mono" style={{
            position: 'absolute', left: 0, right: 0, textAlign: 'center',
            fontSize: 10.5, color: 'var(--muted)',
            letterSpacing: '0.24em', pointerEvents: 'none', fontWeight: 800,
          }}>
            ZEALWISH WEB APP
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function AppV3({ initialIntent = 'home' } = {}) {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS_V3);
  const validInitialViews = ['home', 'chat', 'world', 'rewind', 'memory', 'settings'];
  const initialView = validInitialViews.includes(initialIntent) ? initialIntent : 'home';
  const [showOnboarding, setShowOnboarding] = useState(() => initialIntent === 'create');
  const [oc, setOC] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ocworld.oc') || 'null') || { name: 'XZ' }; }
    catch { return { name: 'XZ' }; }
  });
  const [splashState, setSplashState] = useState(() => 'off');
  const [active, setActive] = useState(() => initialView);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const intim = useIntimacy();

  // English-only product UI + persisted theme
  const [lang] = useState('en');
  const [theme, setThemeState] = useState(() => localStorage.getItem('ocworld.theme') || 'dark');
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('ocworld.ttsEnabled') !== '0');
  const [runtimeInfo, setRuntimeInfo] = useState(() => ({
    ...RUNTIME_DEFAULT,
    native: Boolean(window.OCRuntime?.hasNative?.()),
  }));
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => localStorage.getItem('ocworld.generatedAvatar') || '');
  const [ocDescription, setOCDescriptionState] = useState(() => localStorage.getItem('ocworld.ocDescription') || DEFAULT_OC_DESCRIPTION);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const setLang = () => {};
  const setTheme = (v) => { setThemeState(v); localStorage.setItem('ocworld.theme', v); };
  const setOCDescription = (v) => { setOCDescriptionState(v); localStorage.setItem('ocworld.ocDescription', v); };
  const setOCProfile = useCallback((patch) => {
    setOC(prev => {
      const next = { ...(prev || { name: 'XZ' }), ...(patch || {}) };
      localStorage.setItem('ocworld.oc', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', 'dark'); }, [theme]);
  useEffect(() => { localStorage.setItem('ocworld.ttsEnabled', ttsEnabled ? '1' : '0'); }, [ttsEnabled]);

  const t = useCallback((key) => {
    const dict = I18N.en || {};
    return dict[key] !== undefined ? dict[key] : key;
  }, []);

  useEffect(() => {
    const runtime = window.OCRuntime;
    let mounted = true;

    const refreshRuntime = async () => {
      if (!runtime) return;
      const [hermes, ttsStatus, airjelly] = await Promise.all([
        runtime.getHermesStatus(),
        runtime.getTtsStatus(),
        runtime.getAirJellyContext(),
      ]);
      if (!mounted) return;
      setRuntimeInfo(prev => ({
        ...prev,
        native: runtime.hasNative(),
        hermes,
        tts: ttsStatus,
        airjelly,
        lastError: null,
      }));
    };

    refreshRuntime();
    const timer = setInterval(refreshRuntime, 10000);
    const detach = runtime?.onHermesStatusChanged?.((hermes) => {
      setRuntimeInfo(prev => ({ ...prev, native: runtime.hasNative(), hermes }));
    }) || (() => {});

    return () => {
      mounted = false;
      clearInterval(timer);
      detach();
    };
  }, []);

  // sessions
  const [sessions, setSessions] = useState(() => {
    const init = {};
    DEFAULT_SESSIONS.forEach(s => init[s.id] = { ...s, messages: [] });
    return init;
  });
  const [activeSessionId, setActiveSessionId] = useState('s1');
  const [isThinking, setIsThinking] = useState(false);

  // Locked industrial signal palette.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', '#FF2D55');
    document.documentElement.style.setProperty('--accent-deep', '#FF2D55');
    document.documentElement.style.setProperty('--accent-soft', 'rgba(255,45,85,0.18)');
    document.documentElement.style.setProperty('--accent-soft-2', 'rgba(255,45,85,0.10)');
    document.documentElement.style.setProperty('--accent-paper', 'rgba(255,45,85,0.12)');
  }, []);

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

  const handleGenerateAvatar = useCallback(async (description = ocDescription) => {
    const runtime = window.OCRuntime;
    if (!runtime?.generateImage || isGeneratingAvatar) return;
    const cleanedDescription = String(description || '').trim();

    setIsGeneratingAvatar(true);
    setRuntimeInfo(prev => ({ ...prev, lastError: null }));
    try {
      const result = await runtime.generateImage({
        prompt: buildAvatarPrompt(oc, lang, cleanedDescription || DEFAULT_OC_DESCRIPTION),
        aspectRatio: '16:9',
        imageSize: '2K',
      });
      setAvatarDataUrl(result.dataUrl);
      localStorage.setItem('ocworld.generatedAvatar', result.dataUrl);
      if (cleanedDescription) localStorage.setItem('ocworld.ocDescription', cleanedDescription);
    } catch (error) {
      setRuntimeInfo(prev => ({
        ...prev,
        lastError: error?.message || (lang === 'en' ? 'Image generation failed.' : '生图失败。'),
      }));
    } finally {
      setIsGeneratingAvatar(false);
    }
  }, [oc, lang, ocDescription, isGeneratingAvatar]);

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
      const payload = {
        system: lang === 'en' ? OC_SYSTEM_PROMPT_EN : OC_SYSTEM_PROMPT_ZH,
        messages: [...history, { role: 'user', content: txt }],
      };
      const response = window.OCRuntime?.sendChat
        ? await window.OCRuntime.sendChat(payload)
        : await window.claude.complete(payload);
      const reply = typeof response === 'string' ? response : response?.text;
      const safeReply = reply || (lang === 'en' ? 'mm, listening.' : '嗯，我在听。');
      const ocMsg = { role: 'oc', text: safeReply, time: nowTime(), meta: typeof response === 'object' ? response : null };
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, ocMsg] },
      }));
      if (response?.source) {
        setRuntimeInfo(prev => ({
          ...prev,
          airjelly: { ...(prev.airjelly || {}), source: response.source },
        }));
      }
      if (ttsEnabled) {
        window.OCRuntime?.speak?.(safeReply)?.catch?.(() => {});
      }
    } catch (err) {
      const fallback = pickFallback(txt, lang);
      setSessions(prev => ({
        ...prev,
        [sid]: { ...prev[sid], messages: [...prev[sid].messages, { role: 'oc', text: fallback, time: nowTime() }] },
      }));
    } finally {
      setIsThinking(false);
    }
  }, [activeSessionId, active, sessions, lang, ttsEnabled]);

  const handleQuickStart = (kind) => {
    const seedEn = {
      'Read Me':       'Turn my recent chats and interests into a portrait of me, in your eyes.',
      'Insights':      'Where did my attention flow this week?',
      'Plan':          'Given how I feel right now, what should I tackle first?',
      'Unblock':       "What's the single step most likely stuck for me right now?",
      'Daily Report':  'Write me a short, honest summary of today.',
      'Snapshot':      'How do I look right now, in your eyes?',
    };
    sendInSession(seedEn[kind] || kind);
  };

  const newSession = () => {
    const id = 'n' + Date.now();
    setSessions(prev => ({
      ...prev,
      [id]: { id, title: 'New chat', date: 'now', preview: '', messages: [] },
    }));
    setActiveSessionId(id);
    setActive('chat');
  };

  const sessionList = Object.values(sessions);

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      <GlassShell>
        {showOnboarding && (
          <OnboardingRitual onComplete={(profile) => {
            const nextDescription = String(profile?.ocDescription || '').trim();
            if (nextDescription) setOCDescription(nextDescription);
            setOC(profile);
            localStorage.setItem('ocworld.oc', JSON.stringify(profile));
            setShowOnboarding(false);
            setSplashState('off');
          }} />
        )}
        {!showOnboarding && splashState !== 'off' && (
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
          intimacy={intim.value}
          day={intim.day}
        />

        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', position: 'relative',
        }}>
          {active === 'home'   && <PlazaViewV2 onSendTask={sendInSession} onPickQuickStart={handleQuickStart} onNav={setActive}
            runtimeInfo={runtimeInfo}
            avatarDataUrl={avatarDataUrl}
          />}
          {active === 'chat'   && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '14px 28px 0' }}>
                <IntimacyStrip value={intim.value} day={intim.day} name={oc.name || 'XZ'} />
              </div>
              <ChatViewV2 messages={activeSession?.messages || []} onSend={(t) => { sendInSession(t); intim.bump(1); }} isThinking={isThinking} sessionTitle={activeSession?.title} runtimeInfo={runtimeInfo} ttsEnabled={ttsEnabled} />
            </div>
          )}
          {active === 'world'  && <WorldView />}
          {active === 'rewind' && <RewindViewV2 />}
          {active === 'memory' && <RecordViewV2 />}
          {active === 'settings' && <SettingsViewV2
            tweaks={tweaks}
            setTweak={setTweak}
            onReplaySplash={() => setSplashState('on')}
            onReplayOnboarding={() => { localStorage.removeItem('ocworld.oc'); setShowOnboarding(true); }}
            oc={oc}
            setOCProfile={setOCProfile}
            runtimeInfo={runtimeInfo}
            avatarDataUrl={avatarDataUrl}
            onGenerateAvatar={handleGenerateAvatar}
            isGeneratingAvatar={isGeneratingAvatar}
            ocDescription={ocDescription}
            setOCDescription={setOCDescription}
          />}

          {!showOnboarding && splashState === 'off' && active !== 'home' && active !== 'chat' && (
            <div style={{ position: 'absolute', right: 22, bottom: 22, zIndex: 5 }}>
              <ResidentOC size={120} blush={tweaks.blushOnIdle} mood="idle" name={oc.name || 'XZ'} />
            </div>
          )}
        </main>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
          onNav={(id) => setActive(id)}
          onNewSession={newSession}
          sessions={sessionList}
          onPickSession={(id) => { setActiveSessionId(id); setActive('chat'); }}
        />

        {/* Top-right floating control: theme only */}
        <AppTopBar theme={theme} setTheme={setTheme} />

        <TweaksPanel title="Tweaks">
          <TweakSection label="Character">
            <TweakToggle label="Blush when idle"
              value={tweaks.blushOnIdle}
              onChange={(v) => setTweak('blushOnIdle', v)} />
          </TweakSection>
          <TweakSection label="Interface">
            <TweakButton label="Palette locked · #FF2D55" onClick={() => {}} />
            <TweakRadio label="Ambient density"
              value={tweaks.ambientDensity}
              options={[['quiet', 'Quiet'], ['medium', 'Medium'], ['busy', 'Busy']]}
              onChange={(v) => setTweak('ambientDensity', v)} />
          </TweakSection>
          <TweakSection label="Demo">
            <TweakButton label="Replay opening" onClick={() => { setSplashState('on'); }} />
            <TweakButton label={t('onboard.replay')} onClick={() => { localStorage.removeItem('ocworld.oc'); setShowOnboarding(true); }} />
            <TweakButton label="Open command palette" onClick={() => setPaletteOpen(true)} />
            <TweakToggle label="Speak replies"
              value={ttsEnabled}
              onChange={setTtsEnabled} />
            <TweakButton label={isGeneratingAvatar ? 'Generating portrait...' : 'Generate character portrait'}
              onClick={handleGenerateAvatar} />
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

function pickFallback(text) {
  const t = text.toLowerCase();
  if (t.length < 4) return 'mm, listening.';
  if (t.includes('tired') || t.includes('sleep')) return "Then take a small break. I'll stay here.";
  if (t.includes('plan')) return 'Pick the smallest one — not the most important, the easiest to start.';
  return "Noted, quietly. Want me to help sort this out?";
}

function buildAvatarPrompt(oc, lang, description) {
  const name = oc?.name || 'XZ';
  const personality = oc?.personality || '';
  const personalityLine = personality ? `Character personality: ${personality}\n` : '';
  const styleId = OC_STYLE_LABELS[oc?.visualStyle] ? oc.visualStyle : (OC_STYLE_LABELS[oc?.archetype] ? oc.archetype : 'pixel');
  const visualStyle = OC_STYLE_LABELS[styleId].en;
  const core = description || DEFAULT_OC_DESCRIPTION;
  return `Create a 16:9 full-body original character concept image for ZEALWISH.
Character name: ${name}
${personalityLine}Selected visual style: ${visualStyle}
User one-line description: ${core}

Follow the user's description as the primary source of truth. Use the selected visual style as the baseline unless the one-line description specifies a stronger style. Preserve the character's core silhouette, color palette, attitude, and recognizable details across generations. You may vary the outfit layers, styling, accessories, and fashion direction each time, but keep the overall color system consistent.

Hard constraints: white background, full body visible, cool expression, follow the selected visual style and any style words in the user description, red cap or red headwear if mentioned, tactical goggles if mentioned, ponytail if mentioned, red coat/windbreaker if mentioned, backpack if mentioned, small isekai companion pet if mentioned. Do not use Martin boots, combat boots, or chunky boots. The character must wear flat skate sneakers with no visible logo or branding, plus long loose wide-leg pants. No text, no watermark, no UI, no logo.`;
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
          I'm here, not in your way.
        </div>
      )}
      <div style={{ filter: hovered ? 'none' : 'grayscale(0.15)', transition: 'filter .3s' }}>
        <OCMark scale={1.1} blush={blush} />
      </div>
    </div>
  );
}

// Expose mount function for the landing page to call
window.ZEALWISH_MOUNT_APP = function(container, options = {}) {
  const intent = options?.intent || 'home';
  ReactDOM.createRoot(container).render(<AppV3 initialIntent={intent} />);
};
