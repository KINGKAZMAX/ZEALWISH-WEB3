import type { CharacterConfig, Relationship } from "../types";
import { IconChat, IconGift, IconRewind, IconTasks, IconGlobe } from "./OcWorldIcons";
import { stageLabel } from "./shared";

export function MyOcView({
  character,
  relationship,
  greeting,
  onOpenChat,
  onOpenCreate,
  onOpenRewind,
  onOpenMemory,
  onOpenWorld,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
  greeting: string;
  onOpenChat: () => void;
  onOpenCreate: () => void;
  onOpenRewind: () => void;
  onOpenMemory: () => void;
  onOpenWorld?: () => void;
}) {
  return (
    <div className="oc-page oc-myoc-page">
      <section className="oc-hero-card">
        <div>
          <p className="oc-kicker mono">COMPANION PROFILE</p>
          <h2 className="oc-page-title serif">{character?.name?.trim() || "你的 OC 还没完成命名"}</h2>
          <p className="oc-page-copy">{character?.personality?.trim() || "先去生成页，把 TA 的性格和外观写出来。"}</p>
        </div>
        <div className="oc-hero-card__aside">
          <span className="oc-badge">{stageLabel(relationship?.stage)}</span>
          <span className="oc-badge">亲密度 {relationship?.intimacy ?? 0}</span>
        </div>
      </section>

      <section className="oc-grid-two">
        <article className="oc-surface-card">
          <p className="oc-kicker mono">TA 对你说</p>
          <div className="oc-quote-block serif">“{greeting.trim() || character?.catchphrase?.trim() || "嗯，我在。"}”</div>
          <p className="oc-page-copy">{character?.relationshipSetup?.trim() || "先完成角色生成，再让这段关系长出来。"}</p>
        </article>

        <article className="oc-surface-card">
          <p className="oc-kicker mono">QUICK ACTIONS</p>
          <div className="oc-action-grid">
            <ActionCard icon={<IconChat size={16} />} title="进入聊天" body="直接进入对话窗，继续和 TA 相处。" onClick={onOpenChat} />
            <ActionCard icon={<IconGift size={16} />} title="重新生成" body="回到创建流程，重做人设、外观和语气。" onClick={onOpenCreate} />
          <ActionCard icon={<IconRewind size={16} />} title="查看回溯" body="看关系是怎么一步步长出来的。" onClick={onOpenRewind} />
          <ActionCard icon={<IconGlobe size={16} />} title="进入世界" body="看看 OC 的像素办公室，TA 在这里生活。" onClick={onOpenWorld ?? (() => {})} />
          <ActionCard icon={<IconTasks size={16} />} title="查看记忆" body="翻 TA 记住的关于你的小事。" onClick={onOpenMemory} />
          </div>
        </article>
      </section>
    </div>
  );
}

function ActionCard({ icon, title, body, onClick }: { icon: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" className="oc-action-card" onClick={onClick}>
      <span className="oc-action-card__icon">{icon}</span>
      <span className="oc-action-card__title">{title}</span>
      <span className="oc-action-card__body">{body}</span>
    </button>
  );
}
