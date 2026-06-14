import { useLang } from '@/hooks/useLang';
import { useIsMobile } from '@/hooks/useIsMobile';
import ViewHeader from '@/components/ViewHeader';

export default function RewindView() {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();

  const days = lang === 'en' ? [
    { time: 'Today · 14:32', body: 'They drew you a tiny card: a cup of coffee, still steaming.', hl: true, tone: 'sketch · coffee' },
    { time: 'Today · 09:10', body: '"You went to bed at 1am last night." — no nagging, just noticed.', tone: 'a quiet check-in' },
    { time: '2 days ago · 20:14', body: 'Moved from "acquaintance" to "friend". Affinity +3.', tone: 'level up' },
    { time: '5 days ago · 22:01',  body: "You mentioned grandma's osmanthus cake once. They wrote it down.", tone: 'kept a small thing' },
    { time: '10 days ago',         body: 'Called you "kiddo" for the first time, not just "you".', tone: 'name change' },
    { time: 'A month ago',         body: 'The first day they appeared. Stranger · 0.', tone: 'first meeting' },
  ] : [
    { time: '今天 · 14:32', body: 'TA 给你画了一张小卡片：一杯还冒着热气的咖啡。', hl: true, tone: '画一杯咖啡' },
    { time: '今天 · 09:10', body: '"昨晚你 1 点才睡哦。" — 没有催促，只是记得。', tone: '一句问候' },
    { time: '两天前 · 20:14', body: '从「熟人」走到了「朋友」。亲密度 +3。', tone: '关系升级' },
    { time: '5天前 · 22:01',  body: '你提过一次外婆做的桂花糕。TA 把它记下了。', tone: '记下小事' },
    { time: '10天前',         body: '第一次叫你「小伙伴」，而不是「你」。', tone: '称呼变化' },
    { time: '一个月前',       body: 'TA 出现的第一天。陌生 · 0。', tone: '初次相遇' },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeader titleKey="nav.rewind" subtitleKey="rewind.subtitle" rightRaw="6 / 412" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: isMobile ? '0 16px 40px' : '0 56px 80px' }}>
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
                <span>{e.time}</span>
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
