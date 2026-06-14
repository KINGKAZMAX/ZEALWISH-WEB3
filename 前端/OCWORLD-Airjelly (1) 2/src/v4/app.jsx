// OCWORLD v3 — top-level wiring.
// Glass shell + light/dark gradient + EN/中 toggle + simplified anchors.

const { useState, useEffect, useCallback } = React;

const TWEAK_DEFAULTS_V3 = /*EDITMODE-BEGIN*/{
  "blushOnIdle": true,
  "accentHue": 0,
  "accentPreset": "signal",
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

const RUNTIME_DEFAULT = {
  native: false,
  hermes: null,
  tts: null,
  airjelly: null,
  lastError: null,
};

const DEFAULT_OC_DESCRIPTION = '一个带红帽子的冒险少年，酷酷表情，战术护目镜，扎小马尾子，背景白色，像素风格，红色风衣，背包，随身异世界宠物，根据我的形象不断生成不同风格和服装，但色系一致，不要马丁鞋，穿平底 Nike 板鞋，长筒宽松的裤子';

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
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, boxSizing: 'border-box',
      position: 'relative',
    }}>
      <div className="glass-strong" style={{
        width: 'min(1320px, 100%)',
        height: 'min(840px, 100%)',
        borderRadius: 0,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-window), 0 0 0 1px var(--glass-border-strong)',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Title bar — industrial chrome */}
        <div style={{
          height: 38, flexShrink: 0,
          display: 'flex', alignItems: 'center', padding: '0 16px',
          position: 'relative',
          borderBottom: '1px solid var(--accent)',
          background: 'linear-gradient(90deg, rgba(255,45,85,0.16), rgba(10,10,10,0.96) 28%, rgba(255,255,255,0.06) 50%, rgba(10,10,10,0.96) 72%, rgba(255,45,85,0.16))',
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: 0, background: 'var(--accent)', border: '1px solid var(--accent)' }} />
            <span style={{ width: 11, height: 11, borderRadius: 0, background: 'transparent', border: '1px solid rgba(255,255,255,.65)' }} />
            <span style={{ width: 11, height: 11, borderRadius: 0, background: '#FFFFFF', border: '1px solid #FFFFFF' }} />
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
  // first-run onboarding ritual
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('ocworld.oc'));
  const [oc, setOC] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ocworld.oc') || 'null') || { name: 'XZ' }; }
    catch { return { name: 'XZ' }; }
  });
  const [splashState, setSplashState] = useState(() => localStorage.getItem('ocworld.oc') ? 'on' : 'off');
  const [active, setActive] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const intim = useIntimacy();

  // language + theme — persisted
  const [lang, setLangState] = useState(() => localStorage.getItem('ocworld.lang') || 'zh');
  const [theme, setThemeState] = useState(() => localStorage.getItem('ocworld.theme') || 'dark');
  const [ttsEnabled, setTtsEnabled] = useState(() => localStorage.getItem('ocworld.ttsEnabled') !== '0');
  const [runtimeInfo, setRuntimeInfo] = useState(() => ({
    ...RUNTIME_DEFAULT,
    native: Boolean(window.OCRuntime?.hasNative?.()),
  }));
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => localStorage.getItem('ocworld.generatedAvatar') || '');
  const [ocDescription, setOCDescriptionState] = useState(() => localStorage.getItem('ocworld.ocDescription') || DEFAULT_OC_DESCRIPTION);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const setLang = (v) => { setLangState(v); localStorage.setItem('ocworld.lang', v); };
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
    const dict = I18N[lang] || I18N.zh;
    return dict[key] !== undefined ? dict[key] : (I18N.zh[key] !== undefined ? I18N.zh[key] : key);
  }, [lang]);

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

        {/* Top-right floating control: language + theme */}
        <TopBar lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />

        <TweaksPanel title="Tweaks">
          <TweakSection label={lang === 'en' ? 'Character' : '角色'}>
            <TweakToggle label={lang === 'en' ? 'Blush when idle' : '空闲时露出腮红'}
              value={tweaks.blushOnIdle}
              onChange={(v) => setTweak('blushOnIdle', v)} />
          </TweakSection>
          <TweakSection label={lang === 'en' ? 'Interface' : '界面'}>
            <TweakButton label={lang === 'en' ? 'Palette locked · #FF2D55' : '信号红锁定 · #FF2D55'} onClick={() => {}} />
            <TweakRadio label={lang === 'en' ? 'Ambient density' : '环境氛围密度'}
              value={tweaks.ambientDensity}
              options={lang === 'en'
                ? [['quiet', 'Quiet'], ['medium', 'Medium'], ['busy', 'Busy']]
                : [['quiet', '安静'], ['medium', '适中'], ['busy', '热闹']]}
              onChange={(v) => setTweak('ambientDensity', v)} />
          </TweakSection>
          <TweakSection label={lang === 'en' ? 'Demo' : '演示'}>
            <TweakButton label={lang === 'en' ? 'Replay opening' : '重新播放欢迎画面'} onClick={() => { setSplashState('on'); }} />
            <TweakButton label={t('onboard.replay')} onClick={() => { localStorage.removeItem('ocworld.oc'); setShowOnboarding(true); }} />
            <TweakButton label={lang === 'en' ? 'Open ⌘K palette' : '打开 ⌘K 命令面板'} onClick={() => setPaletteOpen(true)} />
            <TweakToggle label={lang === 'en' ? 'Speak replies' : '自动朗读回复'}
              value={ttsEnabled}
              onChange={setTtsEnabled} />
            <TweakButton label={isGeneratingAvatar ? (lang === 'en' ? 'Generating portrait...' : '正在生成头像...') : (lang === 'en' ? 'Generate OC portrait' : '生成 OC 头像')}
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

function buildAvatarPrompt(oc, lang, description) {
  const name = oc?.name || 'XZ';
  const personality = oc?.personality || '';
  const personalityLine = personality
    ? (lang === 'en' ? `Character personality: ${personality}\n` : `角色性格：${personality}\n`)
    : '';
  const styleId = OC_STYLE_LABELS[oc?.visualStyle] ? oc.visualStyle : (OC_STYLE_LABELS[oc?.archetype] ? oc.archetype : 'pixel');
  const visualStyle = OC_STYLE_LABELS[styleId][lang === 'en' ? 'en' : 'zh'];
  const core = description || DEFAULT_OC_DESCRIPTION;
  if (lang === 'en') {
    return `Create a 16:9 full-body original character concept image for OCWORLD.
Character name: ${name}
${personalityLine}Selected visual style: ${visualStyle}
User one-line description: ${core}

Follow the user's description as the primary source of truth. Use the selected visual style as the baseline unless the one-line description specifies a stronger style. Preserve the character's core silhouette, color palette, attitude, and recognizable details across generations. You may vary the outfit layers, styling, accessories, and fashion direction each time, but keep the overall color system consistent.

Hard constraints: white background, full body visible, cool expression, follow the selected visual style and any style words in the user description, red cap or red headwear if mentioned, tactical goggles if mentioned, ponytail if mentioned, red coat/windbreaker if mentioned, backpack if mentioned, small isekai companion pet if mentioned. Do not use Martin boots, combat boots, or chunky boots. The character must wear flat Nike-inspired skate sneakers with no visible logo or branding, plus long loose wide-leg pants. No text, no watermark, no UI, no logo.`;
  }
  return `为 OCWORLD 生成一张 16:9 的原创 OC 全身角色概念图。
角色名：${name}
${personalityLine}用户选择的视觉基底：${visualStyle}
用户一句话描述：${core}

以用户描述为最高优先级；除非一句话描述里指定了更强的风格，否则以用户选择的视觉基底作为生成风格基准。保留角色核心轮廓、色系、气质和可识别特征。每次生成可以变化服装层次、风格方向、配件和外套细节，但整体色系统一，像同一个角色在不同造型里的延展。

硬性要求：白色背景，全身可见，酷酷表情；视觉风格遵循用户选择的视觉基底和一句话描述中的风格词；如果描述中出现红帽子、战术护目镜、小马尾、红色风衣、背包、随身异世界宠物，都必须体现。不要马丁鞋，不要战斗靴，不要厚底靴；必须穿平底 Nike 风格板鞋，但不要出现可见 logo 或品牌文字；裤子是长筒、宽松、宽腿。不要文字，不要水印，不要 UI，不要 logo。`;
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
