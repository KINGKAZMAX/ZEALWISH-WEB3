// OCWORLD v3 views — glass surfaces, simplified anchors, i18n.
// Removed: kanji medallions, "QUICK GATES · 06 ROOMS" mono header, heavy black borders.

// ─────────────────────────────────────────────
// PLAZA / HOME
// ─────────────────────────────────────────────
function PlazaViewV2({ onSendTask, onPickQuickStart, onNav }) {
  const { t, lang } = useT();
  const [text, setText] = React.useState('');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
      <ViewHeaderV2 titleKey="nav.home" subtitleKey="home.greeting.kicker" />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '32px 56px 60px', maxWidth: 960, width: '100%', margin: '0 auto',
      }}>
        {/* OC stage with greeting card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 28, alignItems: 'center', marginBottom: 32 }}>
          {/* OC — soft glass cradle */}
          <div className="glass-soft" style={{
            position: 'relative', height: 220, borderRadius: 18,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {[160, 220, 280].map((d, i) => (
              <div key={i} aria-hidden style={{
                position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)',
                width: d, height: d, borderRadius: '50%',
                border: '1px solid var(--accent)',
                opacity: 0.10 + i * 0.03,
              }} />
            ))}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <OCMark scale={1.5} />
            </div>
            <div className="mono" style={{
              position: 'absolute', top: 12, left: 12,
              fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink-muted)',
              padding: '3px 8px',
              border: '1px solid var(--line)', borderRadius: 99,
              background: 'var(--glass-bg-strong)', backdropFilter: 'blur(10px)',
            }}>OC#0001</div>
            <div className="mono" style={{
              position: 'absolute', bottom: 12, right: 12,
              fontSize: 9, letterSpacing: '0.2em', color: 'var(--accent)', fontWeight: 600,
            }}>● ALIVE</div>
          </div>

          {/* Greeting */}
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.22em', marginBottom: 10, textTransform: 'uppercase' }}>
              {t('home.greeting.kicker')}
            </div>
            <div className="serif" style={{ fontSize: 26, lineHeight: 1.45, color: 'var(--ink)', fontWeight: 500, letterSpacing: lang === 'en' ? '-0.005em' : 0 }}>
              "{t('home.greeting.line1')}<br/>
              <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{t('home.greeting.line2')}</em>"
            </div>
            <div className="mono" style={{ marginTop: 14, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>
              {t('home.greeting.log')}
            </div>
          </div>
        </div>

        {/* Composer */}
        <ComposerV2 text={text} setText={setText} onSubmit={() => { onSendTask(text); setText(''); }}
          placeholder={t('home.placeholder')} />

        {/* Quick gates — clean grid, no header, glass cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10, marginTop: 24,
        }}>
          {[
            { key: 'gate.readme',   label: t('gate.readme.label'),   body: t('gate.readme.body') },
            { key: 'gate.insights', label: t('gate.insights.label'), body: t('gate.insights.body') },
            { key: 'gate.plan',     label: t('gate.plan.label'),     body: t('gate.plan.body') },
            { key: 'gate.unblock',  label: t('gate.unblock.label'),  body: t('gate.unblock.body') },
            { key: 'gate.daily',    label: t('gate.daily.label'),    body: t('gate.daily.body') },
            { key: 'gate.snapshot', label: t('gate.snapshot.label'), body: t('gate.snapshot.body') },
          ].map((g, i) => (
            <GateV2 key={i} {...g} onClick={() => onPickQuickStart(g.label)} idx={i} />
          ))}
        </div>

        {/* corner status */}
        <div className="glass-soft" style={{
          marginTop: 22, padding: '10px 16px', borderRadius: 99,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.16em' }}>
            <span style={{ color: 'var(--accent)' }}>●</span>　{t('home.status')}
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700 }}>
            {t('home.affinity')}
          </span>
        </div>
      </div>
    </div>
  );
}

function GateV2({ label, body, onClick, idx }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={hov ? 'glass-strong' : 'glass-soft'}
      style={{
        textAlign: 'left', padding: 16, borderRadius: 14,
        cursor: 'pointer', transition: 'all .2s',
        position: 'relative', minHeight: 96,
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      <div className="grotesk" style={{
        fontSize: 13, fontWeight: 600, color: hov ? 'var(--accent)' : 'var(--ink)',
        letterSpacing: '0.01em', marginBottom: 8,
        transition: 'color .2s',
      }}>{label}</div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{body}</div>
      <span style={{
        position: 'absolute', top: 14, right: 14,
        width: 18, height: 18, borderRadius: 99,
        background: hov ? 'var(--accent)' : 'transparent',
        border: '1px solid ' + (hov ? 'var(--accent)' : 'var(--line)'),
        display: 'grid', placeItems: 'center',
        transition: 'all .2s',
      }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M2 6 L6 2 M6 2 L3 2 M6 2 L6 5" stroke={hov ? '#fff' : 'var(--ink-faint)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// CHAT — real Claude conversation
// ─────────────────────────────────────────────
function ChatViewV2({ messages, onSend, isThinking, sessionTitle }) {
  const { t } = useT();
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isThinking]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ViewHeaderV2 titleKey="nav.chat" subtitleRaw={`${t('chat.subtitle')} · ${sessionTitle || t('chat.new')}`} rightRaw={`${messages.length} ${t('chat.count')} · DAY 27`} />

      {messages.length === 0 ? (
        <ChatEmptyV2 onSend={onSend} />
      ) : (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 56px 0' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {messages.map((m, i) => <BubbleV2 key={i} role={m.role} text={m.text} time={m.time} />)}
              {isThinking && <ThinkingBubble />}
            </div>
          </div>
          <div style={{ padding: '14px 56px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <ComposerV2 text={text} setText={setText}
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

function ChatEmptyV2({ onSend }) {
  const { t, lang } = useT();
  const [text, setText] = React.useState('');
  const openers = [
    t('chat.opener.tired'),
    t('chat.opener.organize'),
    t('chat.opener.happy'),
    t('chat.opener.delay'),
  ];
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 56px',
    }}>
      <OCMark scale={1.5} />
      <div className="heitai" style={{ marginTop: 22, fontSize: 38, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
        {t('chat.empty.title')}<span style={{ color: 'var(--accent)' }}>。</span>
      </div>
      <div className="mono" style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.22em' }}>
        {t('chat.empty.sub')}
      </div>
      <div style={{ marginTop: 30, width: '100%', maxWidth: 640 }}>
        <ComposerV2 text={text} setText={setText}
          onSubmit={() => { if (text.trim()) { onSend(text); setText(''); } }}
          placeholder={t('chat.placeholder')}
        />
      </div>
      {/* opener chips — soft glass */}
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

function BubbleV2({ role, text, time }) {
  const { lang } = useT();
  const isOC = role === 'oc';
  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 18,
      flexDirection: isOC ? 'row' : 'row-reverse',
      animation: 'fade-in .3s ease-out',
    }}>
      {isOC ? (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <OCMark scale={0.6} animated={false} />
        </div>
      ) : (
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#fff',
          fontSize: 11, fontWeight: 700,
          display: 'grid', placeItems: 'center',
          letterSpacing: '0.04em',
        }}>{lang === 'en' ? 'YOU' : '你'}</div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOC ? 'flex-start' : 'flex-end' }}>
        <div className={isOC ? 'glass-strong' : ''} style={{
          padding: '10px 14px',
          background: isOC ? undefined : 'var(--accent)',
          color: isOC ? 'var(--ink-on-glass)' : '#fff',
          fontSize: 13.5, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          borderRadius: isOC ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
          border: isOC ? undefined : '1px solid var(--accent-deep)',
          boxShadow: isOC ? undefined : '0 4px 12px -4px rgba(230,59,46,0.4)',
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

function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <OCMark scale={0.6} animated={false} />
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

// ─────────────────────────────────────────────
// REWIND — relationship timeline
// ─────────────────────────────────────────────
function RewindViewV2() {
  const { t, lang } = useT();
  const daysZh = [
    { t: '今天 · 14:32', body: 'TA 给你画了一张小卡片：一杯还冒着热气的咖啡。', hl: true, tone: '画一杯咖啡' },
    { t: '今天 · 09:10', body: '"昨晚你 1 点才睡哦。" — 没有催促，只是记得。', tone: '一句问候' },
    { t: '两天前 · 20:14', body: '从「熟人」走到了「朋友」。亲密度 +3。', tone: '关系升级' },
    { t: '5天前 · 22:01',  body: '你提过一次外婆做的桂花糕。TA 把它记下了。', tone: '记下小事' },
    { t: '10天前',         body: '第一次叫你「小伙伴」，而不是「你」。', tone: '称呼变化' },
    { t: '一个月前',       body: 'TA 出现的第一天。陌生 · 0。', tone: '初次相遇' },
  ];
  const daysEn = [
    { t: 'Today · 14:32', body: 'They drew you a tiny card: a cup of coffee, still steaming.', hl: true, tone: 'sketch · coffee' },
    { t: 'Today · 09:10', body: '"You went to bed at 1am last night." — no nagging, just noticed.', tone: 'a quiet check-in' },
    { t: '2 days ago · 20:14', body: 'Moved from "acquaintance" to "friend". Affinity +3.', tone: 'level up' },
    { t: '5 days ago · 22:01',  body: 'You mentioned grandma\'s osmanthus cake once. They wrote it down.', tone: 'kept a small thing' },
    { t: '10 days ago',         body: 'Called you "kiddo" for the first time, not just "you".', tone: 'name change' },
    { t: 'A month ago',         body: 'The first day they appeared. Stranger · 0.', tone: 'first meeting' },
  ];
  const days = lang === 'en' ? daysEn : daysZh;

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeaderV2 titleKey="nav.rewind" subtitleKey="rewind.subtitle" rightRaw="6 / 412" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 56px 80px' }}>
        <div className="glass-soft" style={{
          padding: '14px 18px', marginBottom: 28,
          borderRadius: 14,
          fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6,
          position: 'relative',
        }}>
          <span className="mono" style={{
            fontSize: 9.5, color: 'var(--accent)', letterSpacing: '0.22em',
            fontWeight: 700, display: 'block', marginBottom: 4,
          }}>{t('rewind.note.kicker')}</span>
          {t('rewind.note.body')}
        </div>

        {days.map((e, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '14px 1fr',
            gap: 18, marginBottom: 14,
            position: 'relative',
            animation: `fade-in .4s ${i * 0.06}s ease-out both`,
          }}>
            {/* timeline dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: e.hl ? 'var(--accent)' : 'var(--glass-bg-strong)',
                border: '1px solid ' + (e.hl ? 'var(--accent)' : 'var(--line)'),
                marginTop: 16,
                boxShadow: e.hl ? '0 0 0 4px var(--accent-soft)' : 'none',
              }} />
              {i < days.length - 1 && (
                <div style={{
                  flex: 1, width: 1, background: 'var(--line-soft)',
                  marginTop: 4, minHeight: 18,
                }} />
              )}
            </div>
            <div className={e.hl ? 'glass-strong' : 'glass-soft'} style={{
              padding: 16, borderRadius: 14,
              borderColor: e.hl ? 'var(--accent-soft)' : undefined,
            }}>
              <div className="mono" style={{
                fontSize: 10, color: e.hl ? 'var(--accent-deep)' : 'var(--ink-faint)',
                letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6,
                display: 'flex', justifyContent: 'space-between',
                fontWeight: e.hl ? 600 : 500,
              }}>
                <span>{e.t}</span>
                <span>· {e.tone}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>
                {e.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RECORD — memory cards
// ─────────────────────────────────────────────
function RecordViewV2() {
  const { t, lang } = useT();
  const groupsZh = [
    { titleKey: 'record.group.you', count: 12, items: [
      { t: '习惯凌晨 1 点睡', d: 'day 3' },
      { t: '喝拿铁不加糖', d: 'day 5' },
      { t: '外婆做的桂花糕', d: 'day 22' },
      { t: '会因为下雨心情低落', d: 'day 14' },
    ]},
    { titleKey: 'record.group.people', count: 5, items: [
      { t: '老周（同事）', d: 'day 8' },
      { t: '阿酱（猫）', d: 'day 11' },
      { t: '妈妈', d: 'day 1' },
    ]},
    { titleKey: 'record.group.thoughts', count: 4, items: [
      { t: '周五的提案', d: '本周' },
      { t: '答应每天散步 20 分钟', d: '上周' },
    ]},
  ];
  const groupsEn = [
    { titleKey: 'record.group.you', count: 12, items: [
      { t: 'Falls asleep around 1am', d: 'day 3' },
      { t: 'Drinks latte, no sugar', d: 'day 5' },
      { t: "Grandma's osmanthus cake", d: 'day 22' },
      { t: 'Mood dips when it rains', d: 'day 14' },
    ]},
    { titleKey: 'record.group.people', count: 5, items: [
      { t: 'Lao Zhou (coworker)', d: 'day 8' },
      { t: 'Ah-jiang (cat)', d: 'day 11' },
      { t: 'Mom', d: 'day 1' },
    ]},
    { titleKey: 'record.group.thoughts', count: 4, items: [
      { t: "Friday's proposal", d: 'this week' },
      { t: 'Promised: 20-min walk every day', d: 'last week' },
    ]},
  ];
  const groups = lang === 'en' ? groupsEn : groupsZh;

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeaderV2 titleKey="nav.memory" subtitleKey="record.subtitle" rightRaw={`21 ${t('record.items')}`} />
      <div style={{ maxWidth: 940, margin: '24px auto', padding: '0 56px 80px' }}>
        {/* search row */}
        <div className="glass-soft" style={{
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18,
          padding: '10px 14px', borderRadius: 12,
        }}>
          <IconSearch size={14} color="var(--ink-muted)" />
          <input placeholder={t('record.search')} style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, color: 'var(--ink)',
          }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>21 {t('record.items')}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {groups.map((g, i) => (
            <div key={i} className="glass-strong" style={{
              borderRadius: 14, overflow: 'hidden',
              animation: `fade-in .4s ${i * 0.06}s ease-out both`,
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line-soft)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span className="grotesk" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t(g.titleKey)}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 600 }}>{g.count}</span>
              </div>
              <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none' }}>
                {g.items.map((it, j) => (
                  <li key={j} style={{
                    padding: '10px 16px',
                    fontSize: 12.5, color: 'var(--ink)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ flex: 1 }}>{it.t}</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>{it.d}</span>
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%', padding: '9px 14px',
                background: 'transparent', border: 'none',
                borderTop: '1px solid var(--line-soft)',
                color: 'var(--ink-muted)', fontSize: 11, cursor: 'pointer',
                letterSpacing: '0.04em', textAlign: 'center',
              }}>+ {lang === 'en' ? 'Add' : '添加'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────
function SettingsViewV2({ tweaks, setTweak, onReplaySplash }) {
  const { t, lang } = useT();
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeaderV2 titleKey="nav.settings" subtitleKey="settings.subtitle" rightRaw="OC#0001" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 56px 80px' }}>
        <SettingsSection title={t('settings.section.character')}>
          <SettingsRow label={t('settings.name')} hint={t('settings.name.hint')}>
            <input defaultValue="XZ" style={settingsInput} />
          </SettingsRow>
          <SettingsRow label={t('settings.callme')} hint={t('settings.callme.hint')}>
            <input defaultValue={lang === 'en' ? 'kiddo' : '小伙伴'} style={settingsInput} />
          </SettingsRow>
          <SettingsRow label={lang === 'en' ? 'Idle blush' : '空闲腮红'} hint={lang === 'en' ? 'a touch of shy when quiet' : '安静时露出一点害羞'}>
            <SettingsToggle value={tweaks.blushOnIdle} onChange={(v) => setTweak('blushOnIdle', v)} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.section.ui')}>
          <SettingsRow label={t('settings.hue')} hint={t('settings.hue.hint')}>
            <input type="range" min="0" max="360" step="5" value={tweaks.accentHue}
              onChange={(e) => setTweak('accentHue', Number(e.target.value))}
              style={{ width: 160 }} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={t('settings.section.demo')}>
          <SettingsRow label={t('settings.replay')} hint={t('settings.replay.hint')}>
            <button onClick={onReplaySplash} className="glass-soft" style={{
              padding: '7px 14px', borderRadius: 8,
              color: 'var(--ink)', cursor: 'pointer',
              fontSize: 12, fontWeight: 500,
            }}>{t('settings.replay.btn')}</button>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}

const settingsInput = {
  padding: '7px 12px', border: '1px solid var(--line)', background: 'var(--glass-bg-strong)',
  fontSize: 13, color: 'var(--ink)', outline: 'none', borderRadius: 8,
  fontFamily: 'inherit', minWidth: 160,
  backdropFilter: 'blur(10px)',
};

function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '0 4px' }}>
        <span className="grotesk" style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
      </div>
      <div className="glass-strong" style={{ borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, hint, children }) {
  return (
    <div style={{
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16,
      borderBottom: '1px solid var(--line-soft)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingsToggle({ value, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange && onChange(!value)}
      style={{
        width: 38, height: 22, padding: 2, borderRadius: 99,
        border: '1px solid var(--line)',
        background: value ? 'var(--accent)' : 'var(--glass-bg-soft)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        position: 'relative', transition: 'background .2s',
      }}>
      <span style={{
        display: 'block', width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        transform: value ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform .2s',
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────
function ViewHeaderV2({ titleKey, subtitleKey, subtitleRaw, rightRaw }) {
  const { t } = useT();
  const title = titleKey ? t(titleKey) : '';
  const subtitle = subtitleKey ? t(subtitleKey) : (subtitleRaw || '');
  return (
    <div style={{
      height: 56, padding: '0 28px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--line-soft)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span className="grotesk" style={{ fontSize: 18, color: 'var(--ink)', fontWeight: 600, letterSpacing: '-0.005em' }}>{title}</span>
        {subtitle && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{subtitle}</span>}
      </div>
      {rightRaw && (
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>{rightRaw}</span>
      )}
    </div>
  );
}

function ComposerV2({ text, setText, onSubmit, placeholder, compact }) {
  const { t, lang } = useT();
  const [focus, setFocus] = React.useState(false);
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
        <button style={iconBtnGhostV2} title={lang === 'en' ? 'Attach' : '附件'}><IconAttach size={14} color="var(--ink-muted)" /></button>
        <button style={iconBtnGhostV2} title={lang === 'en' ? 'Templates' : '模板'}><IconBars size={14} color="var(--ink-muted)" /></button>
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
            color: text.trim() ? '#fff' : 'var(--ink-faint)',
            border: '1px solid ' + (text.trim() ? 'var(--accent)' : 'var(--line)'),
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
            borderRadius: 8,
            transition: 'all .15s',
            boxShadow: text.trim() ? '0 4px 10px -2px rgba(230,59,46,0.4)' : 'none',
          }}
        >
          {t('chat.send')}
          <IconArrowUp size={11} color={text.trim() ? '#fff' : 'var(--ink-faint)'} />
        </button>
      </div>
    </div>
  );
}

const iconBtnGhostV2 = {
  width: 26, height: 26, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
};

Object.assign(window, {
  PlazaViewV2, ChatViewV2, RewindViewV2, RecordViewV2, SettingsViewV2,
  ViewHeaderV2, ComposerV2, BubbleV2, ThinkingBubble,
});
