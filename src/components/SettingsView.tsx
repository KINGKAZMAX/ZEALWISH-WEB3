import { useState } from "react";
import type { CharacterConfig, Relationship } from "../types";
import { OcAvatarLarge } from "./OcAvatar";
import { IconCheck, IconGift } from "./OcWorldIcons";
import { stageLabel } from "./shared";

export function SettingsView({
  character,
  relationship,
  onUserNameChange,
  onRecreateOC,
  onBack,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
  onUserNameChange: (name: string) => Promise<void>;
  onRecreateOC: () => void;
  onBack: () => void;
}) {
  const [userName, setUserName] = useState(relationship?.userName ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSaveName = async () => {
    if (!userName.trim()) return;

    setSaving(true);
    setSaveError("");

    try {
      await onUserNameChange(userName.trim());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="oc-page oc-settings-page">
      <section className="oc-settings-hero">
        <div>
          <p className="oc-kicker mono">SETTINGS</p>
          <h2 className="oc-page-title serif">基础档案</h2>
          <p className="oc-page-copy">聊天页不展示你的个人资料，这里单独收口昵称、偏好和当前角色摘要。</p>
        </div>
        <button type="button" className="oc-pill-button" onClick={onBack}>
          返回
        </button>
      </section>

      <section className="oc-grid-two">
        <article className="oc-surface-card">
          <p className="oc-kicker mono">PROFILE</p>
          <div className="oc-field-block">
            <label className="oc-field-label">你的名字</label>
            <p className="oc-field-hint">TA 会这样叫你。</p>
            <div className="oc-inline-form">
              <input
                type="text"
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                placeholder="输入你的名字"
                className="oc-input"
              />
              <button
                type="button"
                className="oc-pill-button is-primary"
                onClick={handleSaveName}
                disabled={saving || !userName.trim() || userName === relationship?.userName}
              >
                <IconCheck size={14} />
                {saving ? "保存中" : "保存"}
              </button>
            </div>
            {saveError && <div className="oc-inline-error">{saveError}</div>}
          </div>

          <div className="oc-field-block">
            <label className="oc-field-label">当前阶段</label>
            <p className="oc-field-hint">{stageLabel(relationship?.stage)} · 亲密度 {relationship?.intimacy ?? 0}</p>
          </div>

          <div className="oc-field-block">
            <label className="oc-field-label">沟通风格</label>
            <p className="oc-field-hint">{relationship?.preferences.communicationStyle?.trim() || "还没有写下明确偏好。"}</p>
          </div>

          <div className="oc-field-block">
            <label className="oc-field-label">感兴趣的话题</label>
            <div className="oc-topic-list">
              {(relationship?.preferences.topics.length ? relationship.preferences.topics : ["还没有记录"]).map((topic) => (
                <span key={topic} className="oc-topic-chip">{topic}</span>
              ))}
            </div>
          </div>
        </article>

        <article className="oc-surface-card">
          <p className="oc-kicker mono">CURRENT OC</p>
          <div className="oc-settings-oc">
            <OcAvatarLarge size={112} name={character?.name} avatarPath={character?.avatarPath} />
            <div className="oc-settings-oc__meta">
              <h3 className="serif oc-settings-oc__name">{character?.name?.trim() || "未命名 OC"}</h3>
              <p className="oc-page-copy">{character?.personality?.trim() || "先回创建页补完角色设定。"}</p>
              <div className="oc-preview-quote">「{character?.catchphrase?.trim() || "嗯，我在。"}」</div>
            </div>
          </div>
          <button type="button" className="oc-pill-button" onClick={onRecreateOC}>
            <IconGift size={14} />
            重新生成 OC
          </button>
        </article>
      </section>
    </div>
  );
}
