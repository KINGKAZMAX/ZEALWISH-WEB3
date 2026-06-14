import { useNavigate } from "react-router-dom";
import { useState } from "react";

const defaultCharacter = {
  name: "小橘",
  personality: "傲娇、敏锐、会主动关心人",
  catchphrase: "哼，我只是顺手提醒你一下。",
  relationshipSetup: "陪你熬项目的 OC",
};

export function CreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultCharacter);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: 20,
        alignItems: "stretch",
      }}
    >
      <section
        style={{
          padding: 28,
          borderRadius: 24,
          background: "rgba(15, 23, 42, 0.72)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>创造你的 OC</div>
          <div style={{ marginTop: 8, color: "#94a3b8" }}>先保留最小表单，目标是把 demo 跑起来。</div>
        </div>

        {[
          ["名字", "name"],
          ["性格", "personality"],
          ["口癖", "catchphrase"],
          ["关系设定", "relationshipSetup"],
        ].map(([label, key]) => (
          <label key={key} style={{ display: "grid", gap: 8 }}>
            <span>{label}</span>
            <input
              value={form[key as keyof typeof form]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              style={{
                borderRadius: 14,
                border: "1px solid rgba(148, 163, 184, 0.24)",
                background: "rgba(15, 23, 42, 0.92)",
                color: "#f8fafc",
                padding: "14px 16px",
              }}
            />
          </label>
        ))}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate("/chat")}
            style={{
              border: 0,
              borderRadius: 14,
              padding: "14px 18px",
              background: "#f97316",
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            直接进入对话
          </button>
          <button
            type="button"
            onClick={() => setForm(defaultCharacter)}
            style={{
              borderRadius: 14,
              border: "1px solid rgba(148, 163, 184, 0.24)",
              padding: "14px 18px",
              background: "transparent",
              color: "#f8fafc",
            }}
          >
            重置默认角色
          </button>
        </div>
      </section>

      <section
        style={{
          borderRadius: 24,
          padding: 28,
          background: "rgba(15, 23, 42, 0.72)",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 14 }}>角色预览</div>
        <div style={{ marginTop: 12, fontSize: 36, fontWeight: 700 }}>{form.name}</div>
        <div style={{ marginTop: 12, color: "#cbd5e1", lineHeight: 1.7 }}>{form.personality}</div>
        <div style={{ marginTop: 18, color: "#f8fafc" }}>“{form.catchphrase}”</div>
        <div style={{ marginTop: 18, color: "#94a3b8" }}>{form.relationshipSetup}</div>
      </section>
    </div>
  );
}
