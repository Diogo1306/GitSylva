import { Textarea } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { CheckSquare } from "../../components/ui/misc";
import { activateOnKeyDown } from "../../components/ui/keys";
import { useT } from "../../i18n";

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
    <div style={{ padding: "var(--sp-6)", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "var(--sp-4)", background: "var(--panel)", flexShrink: 0 }}>
      <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("workingCopy.commitPlaceholder")} style={{ height: 64 }} />
      {commitErr && <div style={{ color: "var(--ddT)", fontSize: "var(--fs-btn)" }}>{commitErr}</div>}
      <div
        role="checkbox"
        aria-checked={amend}
        tabIndex={0}
        onClick={onToggleAmend}
        onKeyDown={activateOnKeyDown}
        className="gs-row"
        style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", cursor: "pointer", fontSize: "var(--fs-btn)", color: "var(--text2)", padding: "var(--sp-1) var(--sp-2)", borderRadius: "var(--r-sm)" }}
      >
        <CheckSquare on={amend} />
        <span>{t("workingCopy.amendLabel")}</span>
      </div>
      {amendPushed && (
        <div style={{ fontSize: "var(--fs-2xs)", color: "var(--stMT)", lineHeight: "var(--lh-body)" }}>
          {t("workingCopy.amendPushedWarning")}
        </div>
      )}
      <Button
        variant={commitReady ? "primary" : "secondary"}
        disabled={!commitReady || committing}
        loading={committing}
        onClick={onCommit}
        style={{ width: "100%", padding: "var(--sp-4)", fontSize: "var(--fs-base)" }}
      >
        {committing ? t("workingCopy.committing") : amend ? t("workingCopy.amendCommit") : t("workingCopy.commitTo", { branch })}
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: "var(--fw-medium)", opacity: 0.75 }}>· {t("workingCopy.filesShort", { count: stagedCount })}</span>
      </Button>
    </div>
  );
}
