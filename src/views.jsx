// Main views — soft, kawaii agent-app vibe.

// ─────────────────────────────────────────────
// HOME — plaza with the OC + composer + quick start gates
// ─────────────────────────────────────────────
function HomeView({ onSendTask, onPickQuickStart }) {
  const [text, setText] = React.useState('');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', position: 'relative' }}>
      <ViewHeader title="广场" subtitle="No.0001 · 今天 day 27"/>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '36px 56px 60px', maxWidth: 920, width: '100%', margin: '0 auto',
      }}>
        {/* Hero */}
        <div style={{
          position: 'relative', width: '100%',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
          height: 200, marginBottom: 18,
        }}>
          <div aria-hidden style={{
            position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)',
            width: 320, height: 56, borderRadius: '50%',
            background: 'radial-gradient(closest-side, var(--accent-soft) 0%, transparent 70%)',
          }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)',
              fontSize: 11, fontWeight: 600,
              color: 'var(--accent-deep)', letterSpacing: '0.12em',
              padding: '3px 10px', border: '1px solid var(--line)', background: '#fff', borderRadius: 99,
              whiteSpace: 'nowrap',
            }}>
              XZ · OC#0001
            </div>
            <OCMark scale={1.6} />
          </div>
        </div>

        {/* Greeting */}
        <div style={{
          width: '100%', maxWidth: 720,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 12,
          border: '1px solid var(--line)',
          background: '#fff', boxShadow: 'var(--shadow-card)',
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center',
            background: 'var(--mint)', color: 'var(--mint-ink)',
            fontSize: 13, fontWeight: 700,
          }}>言</span>
          <div className="serif" style={{ flex: 1, fontSize: 15, lineHeight: 1.5, color: 'var(--ink)' }}>
            "今天没什么大事，但我注意到你昨晚很晚才睡。"
          </div>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>
            14:32
          </span>
        </div>

        {/* Composer */}
        <div style={{ width: '100%', maxWidth: 720, marginTop: 14 }}>
          <Composer text={text} setText={setText} onSubmit={() => { onSendTask(text); setText(''); }}
            placeholder="说点什么，或交给 TA 一件小事…" />
        </div>

        {/* Quick gates */}
        <div style={{
          width: '100%', maxWidth: 720, marginTop: 36,
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.02em' }}>快速入口</span>
          <span style={{ fontSize: 10, color: 'var(--ink-faint)', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.14em' }}>
            06 ROOMS
          </span>
        </div>
        <div style={{
          width: '100%', maxWidth: 720,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10, marginTop: 12,
        }}>
          <Gate label="Read Me"      body="把最近的对话和兴趣，整理成 TA 眼中的你。" onClick={() => onPickQuickStart('Read Me')} />
          <Gate label="Insights"     body="看看这周的注意力都流向了哪里。" onClick={() => onPickQuickStart('Insights')} />
          <Gate label="Plan"         body="基于你当前的状态，决定先处理哪件事。" onClick={() => onPickQuickStart('Plan')} />
          <Gate label="Unblock"      body="找出最可能卡住你的那一步。" onClick={() => onPickQuickStart('Unblock Me')} />
          <Gate label="Daily Report" body="给今天写一段简短而真诚的总结。" onClick={() => onPickQuickStart('Daily Report')} />
          <Gate label="Snapshot"     body="此刻 TA 看见的你，是什么样子。" onClick={() => onPickQuickStart('Snapshot')} />
        </div>

        <div style={{
          marginTop: 22, width: '100%', maxWidth: 720,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 14px', borderRadius: 10,
          border: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink-muted)', letterSpacing: '0.12em',
        }}>
          <span>● TA 安静在桌面角落 · 不会打扰你</span>
          <span>AFFINITY 412 / 1000</span>
        </div>
      </div>
    </div>
  );
}

function Gate({ label, body, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        textAlign: 'left', padding: 14, borderRadius: 12,
        background: '#fff', border: '1px solid var(--line)',
        cursor: 'pointer', transition: 'all .15s',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'var(--ink-faint)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--line)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-deep)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--ink-muted)' }}>{body}</div>
    </button>
  );
}

// ─────────────────────────────────────────────
// AGENT (chat) view
// ─────────────────────────────────────────────
function AgentView({ messages, onSend }) {
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ViewHeader title="对话" subtitle={`${messages.length} 条消息 · day 27`} />

      {messages.length === 0 ? (
        <EmptyAgent onSend={(t) => onSend(t)} />
      ) : (
        <>
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 56px 0', maxWidth: 880, width: '100%', margin: '0 auto' }}>
            {messages.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
          </div>
          <div style={{ padding: '14px 56px 24px', maxWidth: 880, width: '100%', margin: '0 auto' }}>
            <Composer text={text} setText={setText}
              onSubmit={() => { if (text.trim()) { onSend(text); setText(''); } }}
              placeholder="说点什么…"
              compact
            />
          </div>
        </>
      )}
    </div>
  );
}

function EmptyAgent({ onSend }) {
  const [text, setText] = React.useState('');
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '0 56px',
    }}>
      <OCMark scale={1.6} />
      <div className="serif" style={{ marginTop: 18, fontSize: 28, color: 'var(--ink)' }}>
        说点什么。
      </div>
      <div style={{ marginTop: 6, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.18em' }}>
        TA IS LISTENING · 慢慢来
      </div>
      <div style={{ marginTop: 26, width: '100%', maxWidth: 680 }}>
        <Composer text={text} setText={setText}
          onSubmit={() => { if (text.trim()) { onSend(text); setText(''); } }}
          placeholder="今天怎么样…"
        />
      </div>
    </div>
  );
}

function Bubble({ role, text }) {
  const isOC = role === 'oc';
  return (
    <div style={{
      display: 'flex', gap: 12, marginBottom: 16,
      flexDirection: isOC ? 'row' : 'row-reverse',
    }}>
      {isOC ? (
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <OCMark scale={0.7} animated={false} />
        </div>
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'var(--bg-soft)', border: '1px solid var(--line)',
          color: 'var(--ink)', fontSize: 13, fontWeight: 700,
          display: 'grid', placeItems: 'center',
        }}>君</div>
      )}
      <div style={{
        maxWidth: '70%',
        padding: '10px 14px', borderRadius: isOC ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
        background: isOC ? '#fff' : 'var(--accent-soft)',
        border: '1px solid var(--line)',
        color: 'var(--ink)',
        fontSize: 13.5, lineHeight: 1.55,
      }}>
        {text}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REWIND — relationship timeline
// ─────────────────────────────────────────────
function RewindView() {
  const days = [
    { t: '今天 · 14:32', body: 'TA 给你画了一张小卡片：一杯还冒着热气的咖啡。', hl: true },
    { t: '今天 · 09:10', body: '"昨晚你1点才睡哦。" — 没有催促，只是记得。' },
    { t: '两天前 · 20:14', body: '从「熟人」走到了「朋友」。亲密度 +3。' },
    { t: '5天前 · 22:01',  body: '你提过一次外婆做的桂花糕。TA 把它记下了。' },
    { t: '10天前',         body: '第一次叫你「小伙伴」，而不是「你」。' },
    { t: '一个月前',       body: 'TA 出现的第一天。陌生 · 0。' },
  ];
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeader title="回溯" subtitle="27 天的相处" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 56px 80px' }}>
        <div style={{
          padding: '14px 16px', borderRadius: 12, marginBottom: 22,
          border: '1px solid var(--line)', background: 'var(--bg-soft)',
          fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.55,
        }}>
          这里不是日记，也不是档案。是 TA 在和你相处的过程里，悄悄留下来的一些小事。
        </div>

        <div style={{ position: 'relative', paddingLeft: 30 }}>
          <div style={{ position: 'absolute', left: 8, top: 6, bottom: 6, width: 2, background: 'var(--line)' }} />
          {days.map((e, i) => (
            <div key={i} style={{ position: 'relative', paddingBottom: 22 }}>
              <div style={{
                position: 'absolute', left: -30, top: 6,
                width: 16, height: 16, borderRadius: '50%',
                background: e.hl ? 'var(--accent-deep)' : '#fff',
                border: '2px solid ' + (e.hl ? 'var(--accent-deep)' : 'var(--ink-faint)'),
              }} />
              <div style={{
                fontSize: 11, fontFamily: 'ui-monospace, monospace',
                color: 'var(--ink-faint)', letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}>
                {e.t}
              </div>
              <div style={{
                marginTop: 6, padding: 14, borderRadius: 12,
                background: e.hl ? 'var(--accent-soft)' : '#fff',
                border: '1px solid var(--line)',
                fontSize: 14, lineHeight: 1.55, color: 'var(--ink)',
                boxShadow: 'var(--shadow-card)',
              }}>
                {e.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MEMORY — record cards
// ─────────────────────────────────────────────
function MemoryView() {
  const groups = [
    { title: '关于你', items: ['习惯凌晨 1 点睡', '喝拿铁不加糖', '外婆做的桂花糕', '会因为下雨心情低落'] },
    { title: '你提过的人', items: ['老周（同事）', '阿酱（猫）', '妈妈'] },
    { title: '正在挂念的事', items: ['周五的提案', '答应过自己每天散步 20 分钟'] },
  ];
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeader title="记录" subtitle="TA 替你记得的事" />
      <div style={{ maxWidth: 920, margin: '24px auto', padding: '0 56px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {groups.map((g, i) => (
            <div key={i} style={{
              borderRadius: 14, border: '1px solid var(--line)',
              background: '#fff', boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--line)',
                fontSize: 13, fontWeight: 700, color: 'var(--ink)',
              }}>
                {g.title}
              </div>
              <ul style={{ margin: 0, padding: '6px 14px 12px', listStyle: 'none' }}>
                {g.items.map((t, j) => (
                  <li key={j} style={{
                    padding: '8px 0',
                    borderBottom: j === g.items.length - 1 ? 'none' : '1px dashed var(--line-soft)',
                    fontSize: 13, color: 'var(--ink)',
                    display: 'flex', gap: 8,
                  }}>
                    <span style={{ color: 'var(--accent-deep)', fontWeight: 700 }}>·</span>
                    <span style={{ flex: 1 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────
function ViewHeader({ title, subtitle }) {
  return (
    <div style={{
      height: 48, padding: '0 28px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--line)',
      background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '0.02em' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.14em' }}>{subtitle}</span>
      </div>
    </div>
  );
}

const iconBtnGhost = {
  width: 26, height: 26, display: 'grid', placeItems: 'center',
  background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer',
};

function Composer({ text, setText, onSubmit, placeholder, compact }) {
  return (
    <div style={{
      width: '100%', background: '#fff',
      border: '1px solid var(--line)', borderRadius: 14,
      padding: '12px 14px 8px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
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
          fontSize: 14, lineHeight: 1.55,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <button style={iconBtnGhost} title="附件"><IconAttach size={14} color="var(--ink-muted)" /></button>
        <button style={iconBtnGhost} title="云"><IconCloud size={14} color="var(--ink-muted)" /></button>
        <button style={iconBtnGhost} title="模板"><IconBars size={14} color="var(--ink-muted)" /></button>
        <div style={{ flex: 1 }} />
        <button
          onClick={onSubmit}
          disabled={!text.trim()}
          style={{
            padding: '6px 12px',
            background: text.trim() ? 'var(--ink)' : 'var(--bg-soft)',
            color: text.trim() ? '#fff' : 'var(--ink-faint)',
            border: 'none', borderRadius: 8,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
          }}
        >
          发送
          <IconArrowUp size={11} color={text.trim() ? '#fff' : 'var(--ink-faint)'} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { HomeView, AgentView, RewindView, MemoryView });
