import type { CharacterConfig, GrowthInsight, GrowthProfile, Relationship, RevealCandidate } from "../types";
import { OcAvatarLarge } from "./OcAvatar";
import { IconSave } from "./OcWorldIcons";

type RevealHint = (RevealCandidate & { text?: string; title?: string }) | null;

function countActiveSignals(insights: GrowthInsight[]) {
  return insights.filter((item) => item.status !== "archived" && item.status !== "rejected").length;
}

function companionTitle(revealHint: RevealHint) {
  return revealHint ? "Luma 发现了一点东西" : "Luma 正在学会你";
}

function companionText(revealHint: RevealHint, profile: GrowthProfile, relationship: Relationship | null) {
  if (revealHint?.text) {
    return revealHint.text;
  }

  if (profile.goals[0]?.text) {
    return profile.goals[0].text;
  }

  return relationship?.moodBaseline ?? "第一版不让你管理系统。你只需要说话，OC 会在背后慢慢整理目标、优势、证据和下一步。";
}

export function OcProfileCard({
  character,
  relationship,
  greeting,
  ttsEnabled,
  growthInsights,
  growthProfile,
  revealHint,
  onTtsToggle,
  onOpenChat,
  onOpenMemory,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
  greeting: string;
  ttsEnabled: boolean;
  growthInsights: GrowthInsight[];
  growthProfile: GrowthProfile;
  revealHint: RevealHint;
  onTtsToggle: () => void;
  onOpenChat: () => void;
  onOpenMemory: () => void;
}) {
  const title = character?.name?.trim() || "Luma";
  const summary = greeting.trim() || character?.catchphrase?.trim() || "你只需要开口，剩下的让我慢慢理解。";
  const signalCount = countActiveSignals(growthInsights);

  return (
    <div className="oc-profile-card oc-invisible-companion">
      <div className="oc-invisible-companion__titlebar">
        <span className="oc-kicker mono">quiet growth</span>
        <span className="oc-badge">{relationship ? "在听" : "初始化中"}</span>
      </div>

      <div className="oc-invisible-companion__main">
        <div className="oc-invisible-companion__brand-row">
          <div className="oc-invisible-companion__brand">
            <span className="oc-invisible-companion__mark">⌘</span>
            <span>OC World</span>
          </div>
          <span className="oc-badge">{signalCount ? `${signalCount} 个线索` : "正在听"}</span>
        </div>

        <div className="oc-invisible-companion__avatar-wrap">
          <OcAvatarLarge
            size={168}
            name={title}
            avatarPath={character?.avatarPath || "oc-data/avatars/OC-XZ-transparent.png"}
          />
          <button
            type="button"
            className="oc-avatar-save-btn"
            title="保存形象"
            onClick={() => {
              /* save character image */
            }}
          >
            <IconSave size={12} />
          </button>
        </div>

        <section className="oc-invisible-companion__quiet-panel">
          <div className="oc-invisible-companion__quiet-head">
            <h2 className="serif">{companionTitle(revealHint)}</h2>
            <span>{signalCount ? `${signalCount} 个线索` : "正在听"}</span>
          </div>
          <p>{companionText(revealHint, growthProfile, relationship)}</p>
        </section>

        <div className="oc-invisible-companion__quote">“{summary}”</div>
      </div>

      <div className="oc-invisible-companion__actions">
        <button type="button" className="oc-pill-button is-primary" onClick={onOpenChat}>
          和 Luma 说话
        </button>
        <button type="button" className="oc-pill-button" onClick={onOpenMemory}>
          看看它发现了什么
        </button>
        <button type="button" className={ttsEnabled ? "oc-pill-button is-soft-active" : "oc-pill-button"} onClick={onTtsToggle}>
          {ttsEnabled ? "语音已开" : "开启语音"}
        </button>
      </div>
    </div>
  );
}
