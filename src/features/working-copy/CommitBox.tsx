import { useT } from "../../i18n";

const mono = "'JetBrains Mono', monospace";

export function CommitBox({
  msg,
  setMsg,
  commitErr,
  amend,
  onToggleAmend,
  amendPushed,
  commitReady,
  committing,
  onCommit,
  branch,
  stagedCount,
}: {
  msg: string;
  setMsg: (v: string) => void;
  commitErr: string | null;
  amend: boolean;
  onToggleAmend: () => void;
  amendPushed: boolean;
  commitReady: boolean;
  committing: boolean;
  onCommit: () => void;
  branch: string;
  stagedCount: number;
}) {
  const t = useT();
  return (
    <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, background: "var(--panel)", flexShrink: 0 }}>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder={t("workingCopy.commitPlaceholder")}
        style={{
          height: 64,
          resize: "none",
          background: "var(--input)",
          border: "1px solid var(--btnB)",
          borderRadius: 9,
          padding: "10px 12px",
          fontSize: 13,
          color: "var(--text)",
          outline: "none",
          fontFamily: "var(--font)",
          boxSizing: "border-box",
        }}
      />
      {commitErr && <div style={{ color: "var(--ddT)", fontSize: 12.5 }}>{commitErr}</div>}
      <div onClick={onToggleAmend} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "var(--text2)" }}>
        <span style={{ width: 15, height: 15, borderRadius: 4, border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: amend ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 10, fontWeight: 800 }}>
          {amend ? "✓" : ""}
        </span>
        <span>{t("workingCopy.amendLabel")}</span>
      </div>
      {amendPushed && (
        <div style={{ fontSize: 11.5, color: "var(--stMT)", lineHeight: 1.4 }}>
          {t("workingCopy.amendPushedWarning")}
        </div>
      )}
      <div
        onClick={() => commitReady && !committing && onCommit()}
        className="gs-press"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 10,
          borderRadius: 9,
          background: commitReady ? "var(--accent)" : "var(--btn)",
          color: commitReady ? "var(--accentT)" : "var(--muted)",
          border: commitReady ? "none" : "1px solid var(--btnB)",
          fontSize: 13.5,
          fontWeight: 700,
          cursor: commitReady ? "pointer" : "default",
          opacity: committing ? 0.7 : 1,
        }}
      >
        {committing ? t("workingCopy.committing") : amend ? t("workingCopy.amendCommit") : t("workingCopy.commitTo", { branch })}
        <span style={{ fontFamily: mono, fontWeight: 500, opacity: 0.75 }}>· {t("workingCopy.filesShort", { count: stagedCount })}</span>
      </div>
    </div>
  );
}
