import { useState } from "react";
import { IconArrowUp, IconCheck, IconRefresh, IconSparkle } from "./OcWorldIcons";
import { OcAvatarLarge } from "./OcAvatar";

const personalityTags = [
  { id: "傲娇", label: "傲娇" },
  { id: "温柔", label: "温柔" },
  { id: "毒舌", label: "毒舌" },
  { id: "元气", label: "元气" },
  { id: "慵懒", label: "慵懒" },
  { id: "知性", label: "知性" },
  { id: "腹黑", label: "腹黑" },
  { id: "天然呆", label: "天然呆" },
];

const appearanceTags = [
  { id: "水母", label: "水母" },
  { id: "猫系", label: "猫系" },
  { id: "犬系", label: "犬系" },
  { id: "精灵", label: "精灵" },
  { id: "幽灵", label: "幽灵" },
  { id: "机械", label: "机械" },
  { id: "植物", label: "植物" },
  { id: "龙族", label: "龙族" },
];

const toneTags = [
  { id: "日语二次元", label: "日语二次元" },
  { id: "东北话", label: "东北话" },
  { id: "文言文", label: "文言文" },
  { id: "英语", label: "英语" },
  { id: "程序员", label: "程序员" },
  { id: "诗人", label: "诗人" },
];

type Step = "name" | "customize" | "preview";

export function CreateView({
  onSave,
  onCancel,
  canCancel = true,
}: {
  onSave: (data: { name: string; personality: string; catchphrase: string; relationshipSetup: string; avatarPath?: string }) => void | Promise<void>;
  onCancel: () => void;
  canCancel?: boolean;
}) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState<Set<string>>(new Set());
  const [selectedAppearance, setSelectedAppearance] = useState<Set<string>>(new Set());
  const [selectedTone, setSelectedTone] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>("");
  const [savedAvatarPath, setSavedAvatarPath] = useState<string>("");

  const toggleTag = (set: Set<string>, tag: string) => {
    const next = new Set(set);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    return next;
  };

  const generatePersonality = (): string => {
    const parts: string[] = [];
    if (selectedPersonality.size > 0) parts.push([...selectedPersonality].join("、"));
    if (selectedTone) parts.push(`说话风格像${selectedTone}`);
    if (prompt.trim()) parts.push(prompt.trim());
    return parts.join("，") || "友善、安静、偶尔关心人";
  };

  const generateCatchphrase = (): string => {
    if (selectedTone === "日语二次元") return "哼，才不是因为在意你呢。";
    if (selectedTone === "东北话") return "哎呀妈呀，你可别整那出了。";
    if (selectedTone === "文言文") return "且听我一言。";
    if (selectedTone === "程序员") return "这个需求我评估一下。";
    if (selectedTone === "诗人") return "风带来你的消息。";
    return "嗯，我在。";
  };

  const buildImagePrompt = (): string => {
    const parts: string[] = [`A cute anime-style avatar portrait of an original character named "${name}"`];
    if (selectedAppearance.size > 0) parts.push(`race/appearance: ${[...selectedAppearance].join(", ")}`);
    if (selectedPersonality.size > 0) parts.push(`personality: ${[...selectedPersonality].join(", ")}`);
    if (selectedTone) parts.push(`vibe: ${selectedTone}`);
    if (prompt.trim()) parts.push(prompt.trim());
    parts.push("simple clean background, bust-up portrait, soft colors, high quality");
    return parts.join(". ");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError("");
    try {
      if (!window.ocWorld) {
        throw new Error("IPC not available");
      }
      const result = await window.ocWorld.imageGen.generate({ prompt: buildImagePrompt() });
      setAvatarDataUrl(`data:${result.mimeType};base64,${result.imageBase64}`);
      if (result.savedPath) {
        setSavedAvatarPath(result.savedPath);
      }
      setStep("preview");
    } catch (error) {
      setGenError(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      await onSave({
        name,
        personality: generatePersonality(),
        catchphrase: generateCatchphrase(),
        relationshipSetup: `${name} 是你在 OCWORLD 的 OC 伙伴`,
        avatarPath: savedAvatarPath || undefined,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="oc-page oc-create-page">
      <section className="oc-create-stage">
        <div className="oc-create-stage__left">
          <p className="oc-kicker mono">CHARACTER FORGE</p>
          <h2 className="oc-page-title serif">生成我的OC</h2>
          <p className="oc-page-copy">先给 TA 一个名字，再把性格、外观和语气一点点写出来。聊天里陪你的，就是这个角色。</p>
          <StepRail step={step} />
          <div className="oc-create-stage__aside-card">
            <span className="oc-kicker mono">CURRENT PREVIEW</span>
            <OcAvatarLarge size={132} name={name || "OC"} src={avatarDataUrl || undefined} avatarPath={savedAvatarPath || undefined} />
            <div className="oc-create-stage__aside-meta">
              <strong className="serif">{name || "未命名"}</strong>
              <span>{generatePersonality()}</span>
            </div>
          </div>
        </div>

        <div className="oc-create-stage__main">
          {step === "name" && (
            <CreateCard
              title="先给 TA 起名"
              body="这个名字会贯穿后面的聊天、回溯和记忆。"
              footer={
                <div className="oc-create-actions">
                  {canCancel && (
                    <button type="button" className="oc-pill-button" onClick={onCancel}>
                      稍后再说
                    </button>
                  )}
                  <button type="button" className="oc-pill-button is-primary" disabled={!name.trim()} onClick={() => setStep("customize")}>
                    下一步
                    <IconArrowUp size={14} />
                  </button>
                </div>
              }
            >
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="比如：Mori / 阿澄 / 小满"
                autoFocus
                className="oc-input oc-input-xl"
              />
            </CreateCard>
          )}

          {step === "customize" && (
            <CreateCard
              title={`塑造 ${name || "TA"}`}
              body="选标签只是起点，真正决定角色感的是你补进去的细节。"
              footer={
                <div className="oc-create-actions">
                  <button type="button" className="oc-pill-button" onClick={() => setStep("name")}>
                    返回上一步
                  </button>
                  <button type="button" className="oc-pill-button is-primary" onClick={handleGenerate} disabled={isGenerating || !name.trim()}>
                    {isGenerating ? <IconRefresh size={14} style={{ animation: "spin 1s linear infinite" }} /> : <IconSparkle size={14} />}
                    {isGenerating ? "正在生成形象" : "生成形象"}
                  </button>
                </div>
              }
            >
              <TagSection
                title="性格特质"
                subtitle="选 1 到 3 个，先把性格主轴压出来。"
                tags={personalityTags}
                selected={selectedPersonality}
                onToggle={(tag) => setSelectedPersonality((prev) => toggleTag(prev, tag))}
                max={3}
              />

              <TagSection
                title="种族 / 外观"
                subtitle="TA 看上去是什么感觉。"
                tags={appearanceTags}
                selected={selectedAppearance}
                onToggle={(tag) => setSelectedAppearance((prev) => toggleTag(prev, tag))}
                max={2}
              />

              <TagSection
                title="说话风格"
                subtitle="决定聊天时最直接的角色感。"
                tags={toneTags}
                selected={selectedTone ? new Set([selectedTone]) : new Set()}
                onToggle={(tag) => setSelectedTone((prev) => (prev === tag ? "" : tag))}
                max={1}
              />

              <div className="oc-field-block">
                <label className="oc-field-label">补充描述</label>
                <p className="oc-field-hint">一句话写出你真正想要的陪伴感。</p>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={`比如：${name || "TA"} 会在我熬夜时提醒我睡觉，也会在我低落的时候嘴硬地陪我。`}
                  rows={5}
                  className="oc-textarea"
                />
              </div>

              {genError && <div className="oc-inline-error">{genError}</div>}
            </CreateCard>
          )}

          {step === "preview" && (
            <CreateCard
              title="确认你的 OC"
              body="这就是后面会和你互动的角色。可以继续调整，也可以直接定下来。"
              footer={
                <div className="oc-create-actions">
                  <button type="button" className="oc-pill-button" onClick={() => setStep("customize")}>
                    重新调整
                  </button>
                  <button type="button" className="oc-pill-button is-primary" onClick={handleSave} disabled={isSaving}>
                    <IconCheck size={14} />
                    {isSaving ? "保存中" : "就是 TA 了"}
                  </button>
                </div>
              }
            >
              <div className="oc-preview-stack">
                {avatarDataUrl ? (
                  <div className="oc-preview-image-frame">
                    <img src={avatarDataUrl} alt={name} className="oc-preview-image" />
                  </div>
                ) : (
                  <OcAvatarLarge size={180} name={name} avatarPath={savedAvatarPath || undefined} />
                )}
                <div className="oc-preview-copy">
                  <div className="oc-preview-name serif">{name}</div>
                  <div className="oc-preview-personality">{generatePersonality()}</div>
                  <div className="oc-preview-quote">「{generateCatchphrase()}」</div>
                </div>
              </div>
              {saveError && <div className="oc-inline-error">{saveError}</div>}
            </CreateCard>
          )}
        </div>
      </section>
    </div>
  );
}

function CreateCard({ title, body, children, footer }: { title: string; body: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <article className="oc-create-card">
      <header className="oc-create-card__header">
        <h3 className="serif oc-create-card__title">{title}</h3>
        <p className="oc-create-card__body">{body}</p>
      </header>
      <div className="oc-create-card__content">{children}</div>
      <footer className="oc-create-card__footer">{footer}</footer>
    </article>
  );
}

function StepRail({ step }: { step: Step }) {
  const items: Array<{ key: Step; label: string }> = [
    { key: "name", label: "命名" },
    { key: "customize", label: "设定" },
    { key: "preview", label: "确认" },
  ];

  return (
    <div className="oc-step-rail">
      {items.map((item, index) => {
        const active = item.key === step;
        const done = items.findIndex((entry) => entry.key === step) > index;
        return (
          <div key={item.key} className={active ? "oc-step-item is-active" : done ? "oc-step-item is-done" : "oc-step-item"}>
            <span className="oc-step-item__index mono">0{index + 1}</span>
            <span className="oc-step-item__label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TagSection({
  title,
  subtitle,
  tags,
  selected,
  onToggle,
  max,
}: {
  title: string;
  subtitle: string;
  tags: Array<{ id: string; label: string }>;
  selected: Set<string>;
  onToggle: (tag: string) => void;
  max: number;
}) {
  return (
    <div className="oc-field-block">
      <label className="oc-field-label">{title}</label>
      <p className="oc-field-hint">{subtitle}</p>
      <div className="oc-tag-grid">
        {tags.map((tag) => {
          const active = selected.has(tag.id);
          const disabled = !active && selected.size >= max;
          return (
            <button
              key={tag.id}
              type="button"
              className={active ? "oc-tag-button is-active" : "oc-tag-button"}
              onClick={() => !disabled && onToggle(tag.id)}
              disabled={disabled}
            >
              {active ? "✓ " : ""}
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
