// ZEALWISH v3 views — glass surfaces, simplified anchors, i18n.
// Removed: kanji medallions, "QUICK GATES · 06 ROOMS" mono header, heavy black borders.

// ─────────────────────────────────────────────
// PLAZA / HOME
// ─────────────────────────────────────────────
function runtimeLabels(info, lang) {
  const native = Boolean(info?.native);
  const hermesState = info?.hermes?.state || (native ? 'loading' : 'browser');
  const source = info?.airjelly?.source || 'mock';
  const tts = info?.tts;
  const ttsProvider = tts?.provider || (window.speechSynthesis ? 'browser' : 'off');
  const hermesMapZh = {
    healthy: 'Hermes 已连接',
    starting: 'Hermes 启动中',
    stopped: 'Hermes 已停止',
    disabled: 'Hermes 未启用',
    crashed: 'Hermes 已退出',
    unhealthy: 'Hermes 检查中',
    browser: '浏览器演示',
    loading: 'Hermes 连接中',
  };
  const hermesMapEn = {
    healthy: 'Hermes ready',
    starting: 'Hermes starting',
    stopped: 'Hermes stopped',
    disabled: 'Hermes off',
    crashed: 'Hermes crashed',
    unhealthy: 'Hermes checking',
    browser: 'Browser demo',
    loading: 'Hermes loading',
  };
  const hermesLabel = (lang === 'en' ? hermesMapEn : hermesMapZh)[hermesState] || `Hermes ${hermesState}`;
  const airjellyLabel = lang === 'en'
    ? `AirJelly ${source}`
    : `AirJelly ${source === 'airjelly' ? '实时' : 'Mock'}`;
  const ttsLabel = lang === 'en'
    ? `TTS ${tts?.configured === false ? 'not set' : ttsProvider}`
    : `TTS ${tts?.configured === false ? '未配置' : (ttsProvider === 'doubao' ? '豆包' : '浏览器')}`;
  return {
    hermes: hermesLabel,
    hermesShort: hermesState === 'healthy' ? 'Hermes OK' : hermesLabel,
    airjelly: airjellyLabel,
    tts: ttsLabel,
    error: info?.lastError,
  };
}

const OC_STYLE_OPTIONS = [
  { id: 'pixel',   en: 'Pixel Art',  glyph: 'PX' },
  { id: 'anime',   en: 'Anime',      glyph: 'AN' },
  { id: 'cyber',   en: 'Cyber Mech', glyph: 'CY' },
  { id: 'figure',  en: '3D Figure',  glyph: '3D' },
  { id: 'comic',   en: 'Comic Ink',  glyph: 'CM' },
  { id: 'arcade',  en: 'Arcade',     glyph: 'AR' },
];

function PlazaViewV2({ onSendTask, onPickQuickStart, onNav, runtimeInfo, avatarDataUrl }) {
  const { t, lang } = useT();
  const [text, setText] = React.useState('');
  const labels = runtimeLabels(runtimeInfo, lang);
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
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="OC portrait" style={{
                  width: 190, height: 108, objectFit: 'contain',
                  borderRadius: 18,
                  border: '1px solid var(--line)',
                  background: '#FFFFFF',
                  boxShadow: '0 18px 44px -18px rgba(0,0,0,.35)',
                }} />
              ) : (
                <OCMark scale={1.5} />
              )}
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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span className="mono" style={{ fontSize: 10, color: labels.error ? 'var(--accent)' : 'var(--ink-muted)', letterSpacing: '0.16em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: 'var(--accent)' }}>●</span>　{labels.error || labels.hermes}
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', fontWeight: 700, display: 'flex', gap: 10, whiteSpace: 'nowrap' }}>
            <span>{labels.airjelly}</span>
            <span>{labels.tts}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function OCGeneratorPanel({ description, setDescription, preview, onGenerate, isGenerating, error, compact = false }) {
  const { lang } = useT();
  const [focused, setFocused] = React.useState(false);
  const title = 'One-line character generator';
  const placeholder = 'Red-capped adventure boy, tactical goggles, ponytail, pixel style, red coat, backpack...';

  return (
    <div className="glass-soft" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 14,
      padding: 16,
      borderRadius: 16,
      margin: compact ? 0 : '0 0 22px',
      alignItems: 'stretch',
      border: '1px solid var(--accent)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset, 0 0 28px rgba(255,45,85,0.16)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 9.5, color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 8 }}>
          OC GENERATOR
        </div>
        <div className="grotesk" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
          {title}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: 122,
            resize: 'vertical',
            border: '1px solid ' + (focused ? 'var(--accent)' : 'var(--line)'),
            outline: 'none',
            borderRadius: 12,
            background: '#0A0A0A',
            color: 'var(--ink)',
            padding: '12px 13px',
            fontSize: 13,
            lineHeight: 1.65,
            boxShadow: focused ? '0 0 0 1px var(--accent), 0 0 24px rgba(255,45,85,.20)' : 'none',
            transition: 'border-color .16s, box-shadow .16s',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onGenerate(description)}
            disabled={isGenerating || !description?.trim()}
            style={{
              border: '1px solid var(--accent-deep)',
              borderRadius: 99,
              background: isGenerating ? '#0A0A0A' : 'var(--accent)',
              color: isGenerating ? 'var(--accent)' : '#FFFFFF',
              cursor: isGenerating ? 'wait' : 'pointer',
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0,
              minWidth: 112,
            }}
          >
            {isGenerating ? 'Generating' : 'Generate character'}
          </button>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>
            MARSWAVE · GPT-IMAGE-2 · 16:9 · 2K
          </span>
        </div>
        {error && (
          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: 'var(--accent-deep)' }}>
            {error}
          </div>
        )}
      </div>
      <div style={{
        position: 'relative',
        borderRadius: 14,
        border: '1px solid var(--line)',
        background: '#FFFFFF',
        aspectRatio: '16 / 9',
        alignSelf: 'center',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        minHeight: 140,
        boxShadow: '0 0 0 1px rgba(255,45,85,.28) inset',
      }}>
        {preview ? (
          <img src={preview} alt="Generated OC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ transform: 'scale(.9)' }}>
            <OCMark scale={1.35} />
          </div>
        )}
      </div>
    </div>
  );
}

function OCOptionsPanel({
  oc,
  setOCProfile,
  description,
  setDescription,
  preview,
  onGenerate,
  isGenerating,
  error,
  onReplayOnboarding,
}) {
  const { lang } = useT();
  const [focused, setFocused] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const name = oc?.name || 'AYA';
  const selectedStyle = oc?.visualStyle || (OC_STYLE_OPTIONS.some(s => s.id === oc?.archetype) ? oc.archetype : 'pixel');
  const styleName = OC_STYLE_OPTIONS.find(s => s.id === selectedStyle);
  const title = lang === 'en' ? 'OC Options' : 'OC 选项';
  const subtitle = lang === 'en' ? 'Style tags · prompt · image generation · final OC' : '风格标签 · 提示词 · 生图 · 当前 OC';
  const placeholder = 'Red-capped adventure boy, tactical goggles, ponytail, pixel style, red coat, backpack, companion pet...';

  // 抠图并替换原图为透明 PNG
  const [previewUrl, setPreviewUrl] = React.useState(preview);
  
  // 同步外部 preview 变化
  React.useEffect(() => {
    if (preview !== previewUrl) {
      setPreviewUrl(preview);
    }
  }, [preview]);

  const makeTransparentAndReplace = React.useCallback(async () => {
    if (!previewUrl || saving) return;
    setSaving(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const threshold = 240;
      const tolerance = 30;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > threshold && g > threshold && b > threshold && Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance && Math.abs(r - b) < tolerance) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // 转换为 dataURL 替换原图
      const transparentUrl = canvas.toDataURL('image/png');
      setPreviewUrl(transparentUrl);
      localStorage.setItem('ocworld.generatedAvatar', transparentUrl);
      
      // 同时下载保存
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OC-${name}-transparent.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSaving(false);
      }, 'image/png');
    } catch (err) {
      console.error('[OCOptions] makeTransparent failed:', err);
      setSaving(false);
    }
  }, [previewUrl, saving, name]);

  const patchOC = (patch) => {
    setConfirmed(false);
    setOCProfile?.(patch);
  };
  const pickAnother = () => {
    const pool = ['XZ', 'KURO', 'AYA', 'LIN', 'NOA', 'SOL', 'MIRA', 'IO'];
    const next = pool.find(n => n !== name) || 'AYA';
    patchOC({ name: next });
  };

  return (
    <div className="glass-soft" style={{
      position: 'relative',
      overflow: 'hidden',
      padding: 20,
      borderRadius: 2,
      border: '1px solid var(--accent)',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset, 0 0 28px rgba(255,45,85,0.16)',
    }}>
      <div aria-hidden style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(var(--ink-faint) 1px, transparent 1px), linear-gradient(90deg, var(--ink-faint) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        opacity: 0.05,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
          {[0,1,2,3].map(i => (
            <React.Fragment key={i}>
              <div className="mono" style={{
                fontSize: 10,
                color: 'var(--accent)',
                letterSpacing: '0.22em',
                fontWeight: 700,
                transition: 'color .3s',
              }}>NT 0{i+1}</div>
              {i < 3 && <div style={{ width: 22, height: 1, background: 'var(--accent)' }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.32em', fontWeight: 600 }}>
            {subtitle}
          </div>
          <h2 className="heitai" style={{ margin: '8px 0 0', fontSize: 28, color: 'var(--ink)', lineHeight: 1.15 }}>
            {title}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.08fr)', gap: 18, alignItems: 'center' }}>
          <div style={{
            minHeight: 260,
            display: 'grid',
            placeItems: 'center',
            position: 'relative',
            border: '1px solid var(--line)',
            background: 'rgba(10,10,10,0.72)',
            overflow: 'hidden',
          }}>
            {previewUrl ? (
              <img src={previewUrl} alt="Generated OC" style={{
                width: '100%',
                height: '100%',
                minHeight: 260,
                objectFit: 'contain',
                background: previewUrl === preview ? '#FFFFFF' : 'transparent',
              }} />
            ) : (
              <ResidentOC size={150} blush={true} mood="shy" name={name} />
            )}
            {/* 小保存图标 */}
            {previewUrl && (
              <button
                onClick={makeTransparentAndReplace}
                disabled={saving}
                title='Save transparent PNG'
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  border: 'none',
                  borderRadius: 4,
                  background: saving ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.45)',
                  color: '#fff',
                  cursor: saving ? 'wait' : 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  opacity: saving ? 0.6 : 1,
                  transition: 'all .15s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-muted)', letterSpacing: '0.2em', marginBottom: 8 }}>
              CURRENT CHARACTER
            </div>
            <h3 className="heitai" style={{ margin: 0, fontSize: 25, color: 'var(--ink)', lineHeight: 1.2 }}>
              {`Hi, I'm ${name}.`}
            </h3>
            <p className="serif" style={{
              fontSize: 14,
              color: 'var(--ink-muted)',
              lineHeight: 1.7,
              fontStyle: 'italic',
              margin: '10px 0 16px',
            }}>
              Starting today, I live in the corner of your desktop. I won't get in your way, but I'll be here.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {OC_STYLE_OPTIONS.map(style => {
                const on = selectedStyle === style.id;
                return (
                  <button key={style.id} onClick={() => patchOC({ visualStyle: style.id })}
                    className={on ? 'glass-strong' : 'glass'}
                    style={{
                      padding: '10px 10px',
                      borderRadius: 2,
                      border: on ? '1px solid var(--accent)' : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      color: on ? 'var(--accent)' : 'var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                    }}>
                    <span className="heitai" style={{
                      width: 26,
                      height: 26,
                      display: 'grid',
                      placeItems: 'center',
                      background: on ? 'var(--accent)' : 'var(--accent-soft)',
                      color: on ? '#FFFFFF' : 'var(--accent)',
                      fontSize: style.id === 'figure' ? 12 : 15,
                    }}>{style.glyph}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{style.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--accent)', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 8 }}>
            IMAGE GEN · ONE-LINE PROMPT
          </div>
          <textarea
            value={description}
            onChange={(e) => { setConfirmed(false); setDescription(e.target.value); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight: 124,
              resize: 'vertical',
              boxSizing: 'border-box',
              border: '1px solid ' + (focused ? 'var(--accent)' : 'var(--line)'),
              outline: 'none',
              borderRadius: 2,
              background: '#0A0A0A',
              color: 'var(--ink)',
              padding: '12px 13px',
              fontSize: 13,
              lineHeight: 1.65,
              boxShadow: focused ? '0 0 0 1px var(--accent), 0 0 24px rgba(255,45,85,.20)' : 'none',
              transition: 'border-color .16s, box-shadow .16s',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => onGenerate(description)}
              disabled={isGenerating || !description?.trim()}
              style={{
                border: '1px solid var(--accent-deep)',
                borderRadius: 2,
                background: isGenerating ? '#0A0A0A' : 'var(--accent)',
                color: isGenerating ? 'var(--accent)' : '#FFFFFF',
                cursor: isGenerating ? 'wait' : 'pointer',
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 0,
                minWidth: 92,
              }}
            >
              {isGenerating ? 'Generating' : 'Generate'}
            </button>
            <button onClick={pickAnother} style={{ ...ocOptionSecondaryButton }}>
              Try another name
            </button>
            <button onClick={() => { setConfirmed(true); setOCProfile?.({ name, visualStyle: selectedStyle }); }} style={{ ...ocOptionPrimaryButton }}>
              It's you
            </button>
            <button onClick={onReplayOnboarding} style={{ ...ocOptionSecondaryButton, marginLeft: 'auto' }}>
              Full reset
            </button>
          </div>
          <div className="mono" style={{ marginTop: 10, minHeight: 16, fontSize: 10, color: error ? 'var(--accent)' : 'var(--ink-faint)', letterSpacing: '0.12em' }}>
            {error || (confirmed ? 'CHARACTER #0001 CONFIRMED' : 'MARSWAVE · GPT-IMAGE-2 · 16:9 · 2K')}
          </div>
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
          <path d="M2 6 L6 2 M6 2 L3 2 M6 2 L6 5" stroke={hov ? '#FFFFFF' : 'var(--ink-faint)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// CHAT — real Claude conversation
// ─────────────────────────────────────────────
function ChatViewV2({ messages, onSend, isThinking, sessionTitle, runtimeInfo, ttsEnabled }) {
  const { t, lang } = useT();
  const labels = runtimeLabels(runtimeInfo, lang);
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, isThinking]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ViewHeaderV2 titleKey="nav.chat" subtitleRaw={`${t('chat.subtitle')} · ${sessionTitle || t('chat.new')}`} rightRaw={`${messages.length} ${t('chat.count')} · ${labels.hermesShort} · ${ttsEnabled ? labels.tts : 'TTS off'}`} />

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
function SettingsViewV2({
  tweaks,
  setTweak,
  onReplaySplash,
  onReplayOnboarding,
  oc,
  setOCProfile,
  runtimeInfo,
  avatarDataUrl,
  onGenerateAvatar,
  isGeneratingAvatar,
  ocDescription,
  setOCDescription,
}) {
  const { t, lang } = useT();
  const labels = runtimeLabels(runtimeInfo, lang);
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <ViewHeaderV2 titleKey="nav.settings" subtitleKey="settings.subtitle" rightRaw="OC#0001" />
      <div style={{ maxWidth: 720, margin: '24px auto', padding: '0 56px 80px' }}>
        <SettingsSection title={t('settings.section.character')}>
          <SettingsRow label={t('settings.name')} hint={t('settings.name.hint')}>
            <input defaultValue="XZ" style={settingsInput} />
          </SettingsRow>
          <SettingsRow label={t('settings.callme')} hint={t('settings.callme.hint')}>
            <input defaultValue="kiddo" style={settingsInput} />
          </SettingsRow>
          <SettingsRow label="Idle blush" hint="a touch of shy when quiet">
            <SettingsToggle value={tweaks.blushOnIdle} onChange={(v) => setTweak('blushOnIdle', v)} />
          </SettingsRow>
        </SettingsSection>

        <SettingsStandaloneSection title="Character Options">
          <OCOptionsPanel
            oc={oc}
            setOCProfile={setOCProfile}
            description={ocDescription}
            setDescription={setOCDescription}
            preview={avatarDataUrl}
            onGenerate={onGenerateAvatar}
            isGenerating={isGeneratingAvatar}
            error={labels.error}
            onReplayOnboarding={onReplayOnboarding}
          />
        </SettingsStandaloneSection>

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

function SettingsStandaloneSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '0 4px' }}>
        <span className="grotesk" style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
      </div>
      {children}
    </div>
  );
}

const settingsInput = {
  padding: '7px 12px', border: '1px solid var(--line)', background: 'var(--glass-bg-strong)',
  fontSize: 13, color: 'var(--ink)', outline: 'none', borderRadius: 8,
  fontFamily: 'inherit', minWidth: 160,
  backdropFilter: 'blur(10px)',
};

const ocOptionPrimaryButton = {
  padding: '9px 16px',
  background: 'var(--accent)',
  color: '#FFFFFF',
  border: '1px solid var(--accent)',
  borderRadius: 2,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0,
  fontFamily: 'Space Grotesk, Inter, sans-serif',
};

const ocOptionSecondaryButton = {
  padding: '9px 14px',
  background: 'transparent',
  color: 'var(--ink-muted)',
  border: '1px solid var(--line)',
  borderRadius: 2,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0,
  fontFamily: 'Space Grotesk, Inter, sans-serif',
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
        background: '#FFFFFF',
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
            color: text.trim() ? '#FFFFFF' : 'var(--ink-faint)',
            border: '1px solid ' + (text.trim() ? 'var(--accent)' : 'var(--line)'),
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
            borderRadius: 8,
            transition: 'all .15s',
            boxShadow: text.trim() ? '0 4px 10px -2px rgba(255,45,85,0.4)' : 'none',
          }}
        >
          {t('chat.send')}
          <IconArrowUp size={11} color={text.trim() ? '#FFFFFF' : 'var(--ink-faint)'} />
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
