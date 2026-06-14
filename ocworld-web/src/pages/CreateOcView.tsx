import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useLang } from '@/hooks/useLang';
import { useIsMobile } from '@/hooks/useIsMobile';
import ViewHeader from '@/components/ViewHeader';
import OCMark from '@/components/OCMark';
import { api, type ImageGenResponse } from '@/lib/api';

const OC_STYLE_OPTIONS = [
  { id: 'pixel',   zh: '像素风',   en: 'Pixel Art' },
  { id: 'anime',   zh: '二次元',   en: 'Anime' },
  { id: 'cyber',   zh: '赛博机械', en: 'Cyber Mech' },
  { id: 'figure',  zh: '3D 手办',  en: '3D Figure' },
  { id: 'comic',   zh: '漫画线稿', en: 'Comic Ink' },
  { id: 'arcade',  zh: '复古街机', en: 'Arcade' },
];

const DEFAULT_DESCRIPTION_ZH = '一个带红帽子的冒险少年，酷酷表情，战术护目镜，扎小马尾子，背景白色，像素风格，红色风衣，背包，随身异世界宠物，根据我的形象不断生成不同风格和服装，但色系一致，不要马丁鞋，穿平底 Nike 板鞋，长筒宽松的裤子';
const DEFAULT_DESCRIPTION_EN = 'A red-capped adventure boy, cool expression, tactical goggles, ponytail, white background, pixel style, red coat, backpack, companion pet from another world, generate different styles and outfits based on my image but keep the color scheme consistent, no Martin boots, wear flat Nike sneakers, loose long pants';

const MAX_PHOTO_DIMENSION = 1600;

interface CreateOcViewProps {
  onCreated?: (dataUrl: string, description: string) => void;
}

export default function CreateOcView({ onCreated }: CreateOcViewProps) {
  const { t, lang } = useLang();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState(() => {
    return localStorage.getItem('ocworld.createOc.desc') || (lang === 'en' ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION_ZH);
  });
  const [selectedStyle, setSelectedStyle] = useState(() => {
    return localStorage.getItem('ocworld.createOc.style') || 'pixel';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [previews, setPreviews] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ocworld.createOc.previews');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedIdx, setSelectedIdx] = useState(() => {
    return Number(localStorage.getItem('ocworld.createOc.selectedIdx')) || 0;
  });
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(() => {
    return localStorage.getItem('ocworld.createOc.confirmed') === '1';
  });

  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [analyzeError, setAnalyzeError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const analyzePromiseRef = useRef<Promise<string[]> | null>(null);

  const selectedPreview = previews[selectedIdx] || null;

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await readAndResize(file, MAX_PHOTO_DIMENSION);
    setUploadedPhoto(dataUrl);
    setAnalyzeError('');
    setKeywords([]);
    setIsAnalyzing(true);
    const promise = api.analyzePhoto({ imageDataUrl: dataUrl }).then(res => {
      setKeywords(res.keywords);
      if (res.description) setDescription(res.description);
      return res.keywords;
    }).catch((err: any) => {
      setAnalyzeError(err.message || t('createOc.analyzeError'));
      return [] as string[];
    }).finally(() => {
      setIsAnalyzing(false);
      analyzePromiseRef.current = null;
    });
    analyzePromiseRef.current = promise;
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const clearPhoto = () => {
    setUploadedPhoto(null);
    setKeywords([]);
    setAnalyzeError('');
    setIsAnalyzing(false);
  };

  const handleGenerate = async () => {
    if (!description.trim() || isGenerating) return;
    setIsGenerating(true);
    setError('');
    setConfirmed(false);
    setPreviews([]);
    localStorage.removeItem('ocworld.createOc.previews');
    localStorage.removeItem('ocworld.createOc.confirmed');
    localStorage.setItem('ocworld.createOc.desc', description);
    localStorage.setItem('ocworld.createOc.style', selectedStyle);
    try {
      let finalKeywords = keywords;
      if (analyzePromiseRef.current) {
        finalKeywords = await analyzePromiseRef.current;
      }
      const prompt = buildPrompt(description, selectedStyle, finalKeywords);
      const payload = { prompt, aspectRatio: '9:16' };
      const results = await Promise.allSettled([
        api.generateImage(payload),
        api.generateImage(payload),
      ]);
      const urls = results
        .filter((r): r is PromiseFulfilledResult<ImageGenResponse> => r.status === 'fulfilled')
        .map(r => r.value.dataUrl);
      if (urls.length === 0) throw new Error(t('createOc.error'));
      setPreviews(urls);
      setSelectedIdx(0);
      localStorage.setItem('ocworld.createOc.previews', JSON.stringify(urls));
      localStorage.setItem('ocworld.createOc.selectedIdx', '0');
    } catch (err: any) {
      setError(err.message || t('createOc.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPreview) return;
    setConfirmed(true);
    localStorage.setItem('ocworld.avatar', selectedPreview);
    localStorage.setItem('ocworld.avatarDesc', description);
    localStorage.setItem('ocworld.createOc.confirmed', '1');
    onCreated?.(selectedPreview, description);
    try {
      const gender = await api.detectGender(description);
      localStorage.setItem('ocworld.ocGender', gender);
    } catch {}
  };

  const handleSave = () => {
    if (!selectedPreview) return;
    const link = document.createElement('a');
    link.href = selectedPreview;
    link.download = `oc-${selectedStyle}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseDefault = () => {
    setDescription(lang === 'en' ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION_ZH);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <ViewHeader titleKey="createOc.title" subtitleKey="createOc.subtitle" />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: isMobile ? '20px 16px 32px' : '32px 56px 60px',
        maxWidth: 960, width: '100%', margin: '0 auto',
      }}>
        {/* Style selector */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel text={t('createOc.style')} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OC_STYLE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedStyle(s.id); setConfirmed(false); }}
                className={selectedStyle === s.id ? 'glass-strong' : 'glass-soft'}
                style={{
                  padding: '8px 16px', borderRadius: 99, fontSize: 13,
                  color: selectedStyle === s.id ? 'var(--accent)' : 'var(--ink-muted)',
                  border: `1px solid ${selectedStyle === s.id ? 'var(--accent)' : 'var(--line)'}`,
                  cursor: 'pointer', transition: 'all .15s',
                  fontWeight: selectedStyle === s.id ? 600 : 400,
                }}
              >
                {s[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 24, marginBottom: 24 }}>
          {/* Left column */}
          <div>
            {/* Photo upload */}
            <SectionLabel text={t('createOc.photoRef')} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {uploadedPhoto ? (
              <div style={{
                display: 'flex', gap: 12, padding: 12,
                border: '1px solid var(--line)', borderRadius: 14,
                background: '#0A0A0A', marginBottom: 16,
              }}>
                <img
                  src={uploadedPhoto}
                  alt="Reference"
                  style={{
                    width: 80, height: 80, objectFit: 'cover',
                    borderRadius: 10, flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isAnalyzing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LoadingDots />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                        {t('createOc.analyzing')}
                      </span>
                    </div>
                  )}
                  {analyzeError && (
                    <div style={{ fontSize: 12, color: 'var(--accent-deep)' }}>{analyzeError}</div>
                  )}
                  {keywords.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {keywords.map((kw, i) => (
                        <span key={i} style={{
                          padding: '3px 10px', borderRadius: 99, fontSize: 11,
                          background: 'rgba(255,77,109,0.1)', color: 'var(--accent)',
                          border: '1px solid rgba(255,77,109,0.2)',
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={clearPhoto}
                  style={{
                    alignSelf: 'flex-start', background: 'none', border: 'none',
                    color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 11,
                    padding: '2px 6px', flexShrink: 0,
                  }}
                >
                  {t('createOc.clearPhoto')}
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `1.5px dashed ${isDragOver ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 14, background: isDragOver ? 'rgba(255,77,109,0.04)' : '#0A0A0A',
                  padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                  transition: 'all .15s', marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>+</div>
                <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 4 }}>
                  {t('createOc.uploadHint')}
                </div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.12em' }}>
                  {t('createOc.uploadSub')}
                </div>
              </div>
            )}

            {/* Description */}
            <SectionLabel text={t('createOc.prompt')} />
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setConfirmed(false); }}
              placeholder={t('createOc.placeholder')}
              style={{
                width: '100%', minHeight: 140, resize: 'vertical',
                border: '1px solid var(--line)', outline: 'none', borderRadius: 14,
                background: '#0A0A0A', color: 'var(--ink)',
                padding: '14px 16px', fontSize: 13, lineHeight: 1.65,
                transition: 'border-color .16s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                style={{
                  border: '1px solid var(--accent-deep)', borderRadius: 99,
                  background: isGenerating ? '#0A0A0A' : 'var(--accent)',
                  color: isGenerating ? 'var(--accent)' : '#FFFFFF',
                  cursor: isGenerating ? 'wait' : 'pointer',
                  padding: '10px 22px', fontSize: 13, fontWeight: 700,
                  opacity: !description.trim() ? 0.5 : 1,
                }}
              >
                {isGenerating ? t('createOc.generating') : t('createOc.generate')}
              </button>
              <button
                onClick={handleUseDefault}
                style={{
                  border: '1px solid var(--line)', borderRadius: 99,
                  background: 'transparent', color: 'var(--ink-muted)',
                  cursor: 'pointer', padding: '10px 18px', fontSize: 12,
                }}
              >
                {t('createOc.useDefault')}
              </button>
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.14em' }}>
                AI IMAGE · 9:16 · x2
              </span>
            </div>
            {error && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--accent-deep)' }}>{error}</div>
            )}
          </div>

          {/* Right column: Dual preview */}
          <div>
            <SectionLabel text={t('createOc.preview')} />

            {previews.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      onClick={() => { setSelectedIdx(i); setConfirmed(false); localStorage.setItem('ocworld.createOc.selectedIdx', String(i)); localStorage.removeItem('ocworld.createOc.confirmed'); }}
                      style={{
                        position: 'relative', borderRadius: 14, overflow: 'hidden',
                        border: `2px solid ${selectedIdx === i ? 'var(--accent)' : 'var(--line)'}`,
                        background: '#0A0A0A', aspectRatio: '3 / 4',
                        cursor: 'pointer', transition: 'border-color .15s',
                        boxShadow: selectedIdx === i ? '0 0 12px rgba(255,45,85,.2)' : 'none',
                      }}
                    >
                      <img
                        src={src}
                        alt={`OC ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                      {selectedIdx === i && (
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--accent)', color: '#FFF',
                          display: 'grid', placeItems: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}>
                          ✓
                        </div>
                      )}
                      {selectedIdx === i && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSave(); }}
                          title={t('createOc.save')}
                          style={{
                            position: 'absolute', bottom: 8, right: 8,
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.7)', border: '1px solid var(--line)',
                            color: 'var(--ink-muted)', cursor: 'pointer',
                            display: 'grid', placeItems: 'center', fontSize: 14,
                            transition: 'all .15s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
                        >
                          ↓
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!confirmed ? (
                  <button
                    onClick={handleConfirm}
                    style={{
                      width: '100%', marginTop: 12,
                      border: '1px solid var(--accent)', borderRadius: 99,
                      background: 'var(--accent)', color: '#FFFFFF',
                      cursor: 'pointer', padding: '10px 22px', fontSize: 13, fontWeight: 700,
                    }}
                  >
                    {t('createOc.confirm')}
                  </button>
                ) : (
                  <div style={{
                    marginTop: 12, padding: '10px 16px', borderRadius: 99,
                    border: '1px solid var(--accent)',
                    background: 'rgba(255,77,109,0.08)',
                    color: 'var(--accent)', fontSize: 13, fontWeight: 600, textAlign: 'center',
                  }}>
                    {t('createOc.confirmed')}
                  </div>
                )}
              </>
            ) : (
              <div style={{
                position: 'relative', borderRadius: 16, border: '1px solid var(--line)',
                background: '#0A0A0A', minHeight: 200, maxHeight: 320,
                display: 'grid', placeItems: 'center', overflow: 'hidden',
                boxShadow: '0 0 0 1px rgba(255,45,85,.15) inset',
              }}>
                {isGenerating ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '90%', height: '80%' }}>
                    {[0, 1].map(i => (
                      <div key={i} style={{
                        borderRadius: 12, border: '1px solid var(--line)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'grid', placeItems: 'center',
                      }}>
                        <LoadingDots />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <OCMark scale={1.2} />
                    <div className="mono" style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}>
                      {t('createOc.previewEmpty')}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="glass-soft" style={{ padding: '14px 18px', borderRadius: 14 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.18em', marginBottom: 8, textTransform: 'uppercase' }}>
            {t('createOc.tips')}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--ink-muted)' }}>
            {t('createOc.tipsBody')}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="mono" style={{
      fontSize: 10, color: 'var(--ink-subtle)', letterSpacing: '0.22em',
      marginBottom: 12, textTransform: 'uppercase',
    }}>
      {text}
    </div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
          animation: `typing 1.2s ${i * 0.15}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function readAndResize(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const { width, height } = img;
        if (width <= maxDim && height <= maxDim) {
          resolve(reader.result as string);
          return;
        }
        const ratio = Math.min(maxDim / width, maxDim / height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const STYLE_ANCHORS: Record<string, string> = {
  pixel: '像素风格渲染：32-bit 游戏美术，有限调色板（不超过 48 色），可见像素网格，干净色块分区，平面阴影无渐变，轮廓线清晰锐利，复古游戏角色选人画面的质感。',
  anime: '日系赛璐璐动画风格：干净精准的描线，明亮饱和的色彩，柔和的光影过渡与高光反射，头发有层次分明的色块阴影，眼睛精致有神，轻小说封面插画品质。',
  cyber: '赛博朋克机械风格：深色基调配霓虹色点缀（青蓝/品红/琥珀），金属质感与磨损纹理，机械零件与发光线路细节，硬光源投射锐利阴影，科幻概念设计图品质。',
  figure: '3D 手办渲染风格：PBR 材质质感，柔和影棚布光（三点光源），微缩模型摄影感，皮肤有轻微次表面散射，衣物褶皱有体积感，微距镜头浅景深效果。',
  comic: '美式漫画线稿风格：高对比度墨线，粗细变化的轮廓线，交叉排线阴影（cross-hatching），局部色彩点缀，漫画封面构图的张力与动感，印刷纸质纹理。',
  arcade: '复古街机风格：粗壮像素比例，明亮饱和的高对比色彩，简洁图形化造型，最少的阴影层次，80 年代日式街机游戏角色选择界面的视觉风格。',
};

function buildPrompt(description: string, styleId: string, keywords: string[]): string {
  const keywordLine = keywords.length > 0
    ? `\n外貌关键特征：${keywords.join('、')}`
    : '';
  const styleAnchor = STYLE_ANCHORS[styleId] || '';
  return `纯白背景，竖屏 2:3 全身立绘，正面或四分之三侧面站姿，脚部完整可见。

角色：${description}${keywordLine}

视觉风格：${styleAnchor}

构图与约束：
- 单一角色居中，留出头顶和脚底空间
- 服装纹理、配饰细节、发丝层次清晰可辨
- 角色表情自然生动，眼神有神采
- 不含文字、水印、签名、UI 元素
- 原创角色设计，不参考任何版权形象`;
}
