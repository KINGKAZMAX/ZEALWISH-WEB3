// OCWORLD v2 views — paper-cream + single OZ red, kanji wayfinding.

// ─────────────────────────────────────────────
// PLAZA / HOME
// ─────────────────────────────────────────────
function PlazaViewV2({ onSendTask, onPickQuickStart, onNav }) {
  const [text, setText] = React.useState('');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
      <ViewHeaderV2 title="广场" subtitle="PLAZA · No.0001 · DAY 27" right="14:32 / FINE" />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '32px 56px 60px', maxWidth: 920, width: '100%', margin: '0 auto',
      }}>
        {/* OC stage with greeting card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, alignItems: 'center', marginBottom: 32 }}>
          {/* OC */}
          <div style={{
            position: 'relative', height: 220,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            border: '1px solid var(--ink)',
            background: 'linear-gradient(180deg, #f5e9c8, #faf6ec)',
          }}>
            {[160, 220, 280].map((d, i) => (
              <div key={i} aria-hidden style={{
                position: 'absolute', left: '50%', top: '52%', transform: 'translate(-50%,-50%)',
                width: d, height: d, borderRadius: '50%',
                border: '1px solid var(--accent)',
                opacity: 0.12 + i * 0.04,
              }} />
            ))}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <OCMark scale={1.5} />
            </div>
            <div className="mono" style={{
              position: 'absolute', top: 10, left: 10,
              fontSize: 9, letterSpacing: '0.2em', color: 'var(--ink)',
              padding: '2px 6px', background: 'rgba(255,255,255,0.7)',
              border: '1px solid var(--ink)',
            }}>OC#0001</div>
            <div className="mono" style={{
              position: 'absolute', bottom: 10, right: 10,
              fontSize: 9, letterSpacing: '0.2em', color: 'var(--accent)',
            }}>● ALIVE</div>
          </div>

          {/* Greeting */}
          <div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.22em', marginBottom: 8 }}>
              TA 今天对你说 ·
            </div>
            <div className="serif" style={{ fontSize: 24, lineHeight: 1.45, color: 'var(--ink)', fontWeight: 500 }}>
              "今天没什么大事，<br/>
              <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>但我注意到你昨晚很晚才睡。</em>"
            </div>
            <div className="mono" style={{ marginTop: 14, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>
              14:32 · LOG #0427
            </div>
          </div>
        </div>

        {/* Composer */}
        <ComposerV2 text={text} setText={setText} onSubmit={() => { onSendTask(text); setText(''); }}
          placeholder="说点什么，或交给 TA 一件小事…" />

        {/* Quick gates */}
        <div style={{
          marginTop: 28, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.18em' }}>
            快速入口 · QUICK GATES
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>
            06 ROOMS
          </span>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0, marginTop: 12, border: '1px solid var(--ink)',
        }}>
          {[
            { label: 'Read Me',      kanji: '读', body: '把最近的对话和兴趣，整理成 TA 眼中的你。' },
            { label: 'Insights',     kanji: '见', body: '看看这周的注意力都流向了哪里。' },
            { label: 'Plan',         kanji: '计', body: '基于你当前的状态，决定先处理哪件事。' },
            { label: 'Unblock',      kanji: '解', body: '找出最可能卡住你的那一步。' },
            { label: 'Daily Report', kanji: '报', body: '给今天写一段简短而真诚的总结。' },
            { label: 'Snapshot',     kanji: '影', body: '此刻 TA 看见的你，是什么样子。' },
          ].map((g, i) => (
            <GateV2 key={i} {...g} onClick={() => onPickQuickStart(g.label)} idx={i} />
          ))}
        </div>

        {/* corner status */}
        <div style={{
          marginTop: 22, padding: '8px 14px',
          border: '1px solid var(--ink)',
          background: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.16em' }}>
            <span style={{ color: 'var(--accent)' }}>●</span>　TA 安静在桌面角落 · 不会打扰你
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 700 }}>
            AFFINITY 412 / 1000
          </span>
        </div>
      </div>
    </div>
  );
}

function GateV2({ label, kanji, body, onClick, idx }) {
  const [hov, setHov] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', padding: 14,
        background: hov ? '#fff' : 'var(--bg-card)',
        border: 'none',
        borderRight: idx % 3 !== 2 ? '1px solid var(--line)' : 'none',
        borderBottom: idx < 3 ? '1px solid var(--line)' : 'none',
        cursor: 'pointer', transition: 'all .15s',
        position: 'relative', minHeight: 96,
        outline: hov ? '1px solid var(--ink)' : 'none', outlineOffset: -1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span className="kanji" style={{
          width: 22, height: 22, display: 'grid', placeItems: 'center',
          background: hov ? 'var(--accent)' : 'transparent',
          color: hov ? '#fff' : 'var(--accent)',
          border: '1px solid var(--accent)',
          fontSize: 13, fontWeight: 700, transition: 'all .15s',
        }}>{kanji}</span>
        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--ink-muted)' }}>{body}</div>
    </button>
  );
}

// ─────────────────────────────────────────────
// CHAT — real Claude conversation
// ─────────────────────────────────────────────
function ChatViewV2({ messages, onSend, isThinking, sessionTitle }) {
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isThinking]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ViewHeaderV2 title="对话" subtitle={`TALK · ${sessionTitle || '新对话'}`} right={`${messages.length} 条 · DAY 27`} />

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
                placeholder="说点什么…"
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
  const [text, setText] = React.useState('');
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 56px',
    }}>
      <OCMark scale={1.5} />
      <div className="heitai" style={{ marginTop: 18, fontSize: 36, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
        说点什么<span style={{ color: 'var(--accent)' }}>。</span>
      </div>
      <div className="mono" style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.22em' }}>
        TA IS LISTENING · 慢慢来
      </div>
      <div style={{ marginTop: 30, width: '100%', maxWidth: 640 }}>
        <ComposerV2 text={text} setText={setText}
          onSubmit={() => { if (text.trim()) { onSend(text); setText(''); } }}
          placeholder="今天怎么样…"
        />
      </div>
      {/* opener chips */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 640 }}>
        {['今天有点累', '帮我整理一下思路', '聊点开心的', '我又拖延了…'].map((s, i) => (
          <button key={i} onClick={() => onSend(s)}
            className="mono"
            style={{
              padding: '6px 12px', fontSize: 11, letterSpacing: '0.06em',
              border: '1px solid var(--ink)', background: 'transparent',
              color: 'var(--ink)', cursor: 'pointer', borderRadius: 0,
            }}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function BubbleV2({ role, text, time }) {
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
        <div className="kanji" style={{
          width: 30, height: 30, flexShrink: 0,
          background: 'var(--ink)', color: '#faf6ec',
          fontSize: 13, fontWeight: 700,
          display: 'grid', placeItems: 'center',
        }}>君</div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOC ? 'flex-start' : 'flex-end' }}>
        <div style={{
          padding: '10px 14px',
          background: isOC ? '#fff' : 'var(--accent-paper)',
          border: '1px solid ' + (isOC ? 'var(--ink)' : 'var(--accent)'),
          color: 'var(--ink)',
          fontSize: 13.5, lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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
      <div style={{
        padding: '14px 16px',
        background: '#fff', border: '1px solid var(--ink)',
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
// REWIND — relationship timeline w/ kanji medallions
// ─────────────────────────────────────────────
function RewindViewV2() {
  const days = [
    { t: '今天 · 14:32', k: '今', body: 'TA 给你画了一张小卡片：一杯还冒着热气的咖啡。', hl: true, tone: '画一杯咖啡' },
    { t: '今天 · 09:10', k: '朝', body: '"昨晚你 1 点才睡哦。" — 没有催促，只是记得。', tone: '一句问候' },
    { t: '两天前 · 20:14', k: '友', body: '从「熟人」走到了「朋友」。亲密度 +3。', tone: '关系升级' },
    { t: '5天前 · 22:01',  k: '糕', body: '你提过一次外婆做的桂花糕。TA 把它记下了。', tone: '记下小事' },
    { t: '10天前',         k: '伴', body: '第一次叫你「小伙伴」，而不是「你」。', tone: '称呼变化' },
    { t: '一个月前',       k: '初', body: 'TA 出现的第一天。陌生 · 0。', tone: '初次相遇' },
  ];
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeaderV2 title="回溯" subtitle="REWIND · 27 天的相处" right="6 / 412" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 56px 80px' }}>
        <div style={{
          padding: '14px 16px', marginBottom: 28,
          border: '1px solid var(--ink)',
          background: '#fff',
          fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.6,
          position: 'relative',
        }}>
          <span className="mono" style={{
            position: 'absolute', top: -8, left: 14,
            background: 'var(--bg-window)', padding: '0 8px',
            fontSize: 10, color: 'var(--accent)', letterSpacing: '0.18em', fontWeight: 700,
          }}>NOTE · 序</span>
          这里不是日记，也不是档案。是 TA 在和你相处的过程里，悄悄留下来的一些小事。
        </div>

        {days.map((e, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '60px 1fr',
            gap: 20, marginBottom: 18,
            position: 'relative',
            animation: `fade-in .4s ${i * 0.06}s ease-out both`,
          }}>
            {/* kanji medallion */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="kanji" style={{
                width: 48, height: 48, display: 'grid', placeItems: 'center',
                background: e.hl ? 'var(--accent)' : '#fff',
                color: e.hl ? '#fff' : 'var(--ink)',
                border: '1px solid ' + (e.hl ? 'var(--accent)' : 'var(--ink)'),
                fontSize: 22, fontWeight: 700,
              }}>{e.k}</div>
              {i < days.length - 1 && (
                <div style={{
                  flex: 1, width: 1, background: 'var(--line)',
                  marginTop: 4, minHeight: 18,
                }} />
              )}
            </div>
            <div style={{
              padding: 14,
              background: e.hl ? 'var(--accent-paper)' : '#fff',
              border: '1px solid ' + (e.hl ? 'var(--accent)' : 'var(--line)'),
            }}>
              <div className="mono" style={{
                fontSize: 10, color: e.hl ? 'var(--accent-deep)' : 'var(--ink-faint)',
                letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6,
                display: 'flex', justifyContent: 'space-between',
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
  const groups = [
    { title: '关于你', kanji: '人', count: 12, items: [
      { t: '习惯凌晨 1 点睡', d: 'day 3' },
      { t: '喝拿铁不加糖', d: 'day 5' },
      { t: '外婆做的桂花糕', d: 'day 22' },
      { t: '会因为下雨心情低落', d: 'day 14' },
    ]},
    { title: '你提过的人', kanji: '缘', count: 5, items: [
      { t: '老周（同事）', d: 'day 8' },
      { t: '阿酱（猫）', d: 'day 11' },
      { t: '妈妈', d: 'day 1' },
    ]},
    { title: '挂念的事', kanji: '念', count: 4, items: [
      { t: '周五的提案', d: '本周' },
      { t: '答应每天散步 20 分钟', d: '上周' },
    ]},
  ];
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeaderV2 title="记录" subtitle="RECORD · TA 替你记得的事" right="21 ITEMS" />
      <div style={{ maxWidth: 940, margin: '24px auto', padding: '0 56px 80px' }}>
        {/* search row */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 18,
          padding: '8px 12px', border: '1px solid var(--ink)', background: '#fff',
        }}>
          <IconSearch size={14} color="var(--ink-muted)" />
          <input placeholder="搜索：人、事、感受…" style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, color: 'var(--ink)',
          }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>21 ITEMS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {groups.map((g, i) => (
            <div key={i} style={{
              border: '1px solid var(--ink)', background: '#fff',
              animation: `fade-in .4s ${i * 0.06}s ease-out both`,
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--accent)',
                color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="kanji" style={{ fontSize: 16, fontWeight: 700 }}>{g.kanji}</span>
                  <span className="heitai" style={{ fontSize: 13, fontWeight: 700 }}>{g.title}</span>
                </div>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', opacity: 0.85 }}>{g.count}</span>
              </div>
              <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none' }}>
                {g.items.map((it, j) => (
                  <li key={j} style={{
                    padding: '10px 14px',
                    borderBottom: j === g.items.length - 1 ? 'none' : '1px dashed var(--line-soft)',
                    fontSize: 13, color: 'var(--ink)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ flex: 1 }}>{it.t}</span>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>{it.d}</span>
                  </li>
                ))}
              </ul>
              <button style={{
                width: '100%', padding: '8px 14px',
                background: 'transparent', border: 'none',
                borderTop: '1px solid var(--line)',
                color: 'var(--ink-muted)', fontSize: 11, cursor: 'pointer',
                letterSpacing: '0.1em', textAlign: 'center',
              }} className="mono">+ 添加</button>
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
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeaderV2 title="设置" subtitle="SETTINGS · 个性化" right="OC#0001" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 56px 80px' }}>
        <SettingsSection title="角色" kanji="人">
          <SettingsRow label="名字" hint="给 TA 一个名字">
            <input defaultValue="XZ" style={settingsInput} />
          </SettingsRow>
          <SettingsRow label="称呼你" hint="TA 怎么叫你">
            <input defaultValue="小伙伴" style={settingsInput} />
          </SettingsRow>
          <SettingsRow label="空闲腮红" hint="安静时露出一点害羞">
            <SettingsToggle value={tweaks.blushOnIdle} onChange={(v) => setTweak('blushOnIdle', v)} />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="界面" kanji="界">
          <SettingsRow label="主色调" hint="OZ 红 → 移动到喜欢的颜色">
            <input type="range" min="0" max="360" step="5" value={tweaks.accentHue}
              onChange={(e) => setTweak('accentHue', Number(e.target.value))}
              style={{ width: 160 }} />
          </SettingsRow>
          <SettingsRow label="深色模式" hint="（敬请期待）">
            <SettingsToggle value={false} disabled />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="演示" kanji="演">
          <SettingsRow label="重新播放欢迎画面" hint="再看一遍开场">
            <button onClick={onReplaySplash} className="mono" style={{
              padding: '6px 12px', border: '1px solid var(--ink)',
              background: 'transparent', color: 'var(--ink)', cursor: 'pointer',
              fontSize: 11, letterSpacing: '0.12em',
            }}>RE-PLAY</button>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}

const settingsInput = {
  padding: '6px 10px', border: '1px solid var(--ink)', background: '#fff',
  fontSize: 13, color: 'var(--ink)', outline: 'none', borderRadius: 0,
  fontFamily: 'inherit', minWidth: 160,
};

function SettingsSection({ title, kanji, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span className="kanji" style={{
          width: 22, height: 22, display: 'grid', placeItems: 'center',
          background: 'var(--accent)', color: '#fff',
          fontSize: 13, fontWeight: 700,
        }}>{kanji}</span>
        <span className="heitai" style={{ fontSize: 16, color: 'var(--ink)' }}>{title}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>
      <div style={{ border: '1px solid var(--ink)', background: '#fff' }}>
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, hint, children }) {
  return (
    <div style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16,
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{label}</div>
        {hint && <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.14em', marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function SettingsToggle({ value, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange && onChange(!value)}
      style={{
        width: 36, height: 20, padding: 2, borderRadius: 0,
        border: '1px solid var(--ink)',
        background: value ? 'var(--accent)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        position: 'relative', transition: 'background .15s',
      }}>
      <span style={{
        display: 'block', width: 14, height: 14,
        background: '#fff',
        border: '1px solid var(--ink)',
        transform: value ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform .15s',
      }} />
    </button>
  );
}

// ─────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────
function ViewHeaderV2({ title, subtitle, right }) {
  return (
    <div style={{
      height: 52, padding: '0 28px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--ink)',
      background: 'var(--bg-window)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span className="kanji" style={{ fontSize: 22, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>{title}</span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.2em' }}>{subtitle}</span>
      </div>
      {right && (
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>{right}</span>
      )}
    </div>
  );
}

function ComposerV2({ text, setText, onSubmit, placeholder, compact }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{
      width: '100%', background: '#fff',
      border: '1px solid ' + (focus ? 'var(--ink)' : 'var(--line)'),
      padding: '12px 14px 8px',
      transition: 'border-color .15s',
      outline: focus ? '1px solid var(--ink)' : 'none', outlineOffset: -1,
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
        <button style={iconBtnGhostV2} title="附件"><IconAttach size={14} color="var(--ink-muted)" /></button>
        <button style={iconBtnGhostV2} title="模板"><IconBars size={14} color="var(--ink-muted)" /></button>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.16em', marginLeft: 4 }}>
          ENTER 发送 · SHIFT+ENTER 换行
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onSubmit}
          disabled={!text.trim()}
          className="mono"
          style={{
            padding: '6px 14px',
            background: text.trim() ? 'var(--accent)' : '#f3ecdb',
            color: text.trim() ? '#fff' : 'var(--ink-faint)',
            border: '1px solid ' + (text.trim() ? 'var(--accent)' : 'var(--line)'),
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            borderRadius: 0,
          }}
        >
          发送
          <IconArrowUp size={11} color={text.trim() ? '#fff' : 'var(--ink-faint)'} />
        </button>
      </div>
    </div>
  );
}

const iconBtnGhostV2 = {
  width: 26, height: 26, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', borderRadius: 0, cursor: 'pointer',
};

Object.assign(window, {
  PlazaViewV2, ChatViewV2, RewindViewV2, RecordViewV2, SettingsViewV2,
  ViewHeaderV2, ComposerV2, BubbleV2, ThinkingBubble,
});
