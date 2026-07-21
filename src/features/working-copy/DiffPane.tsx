import type { useBlame, useDiff } from "../../state/queries";
import { DiffView } from "../../components/DiffView";
import { BlameView } from "../../components/BlameView";
import { statusStyle, statusTitle } from "../../lib/status";
import { FileIcon } from "../../components/FileIcon";
import { useT } from "../../i18n";
import { activateOnKeyDown } from "../../components/ui/keys";
import type { Sel } from "./WorkingCopy";

const mono = "'JetBrains Mono', monospace";

export function DiffPane({
  effSel,
  selStatus,
  isStacked,
  order,
  hideSecondaryLabel,
  blameOn,
  onToggleBlame,
  onToggleStacked,
  blameQ,
  diff,
  onStageHunk,
  onLoadFull,
}: {
  effSel: Sel;
  selStatus: string;
  isStacked: boolean;
  order: number;
  hideSecondaryLabel: boolean;
  blameOn: boolean;
  onToggleBlame: () => void;
  onToggleStacked: () => void;
  blameQ: ReturnType<typeof useBlame>;
  diff: ReturnType<typeof useDiff>;
  onStageHunk: ((p: string) => void) | undefined;
  onLoadFull: () => void;
}) {
  const t = useT();
  const selSt = statusStyle(selStatus);
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", order }}>
      <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        {effSel ? (
          <>
            <FileIcon path={effSel.path} />
            <span style={{ fontFamily: mono, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{effSel.path}</span>
            <span title={statusTitle(selStatus)} style={{ width: 16, height: 16, borderRadius: 4, display: "grid", placeItems: "center", fontFamily: mono, fontSize: 10, fontWeight: 700, background: selSt.bg, color: selSt.color, flexShrink: 0 }}>
              {selStatus}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{t("workingCopy.selectFilePrompt")}</span>
        )}
        <div style={{ flex: 1 }} />
        {effSel && selStatus !== "?" && (
          <button
            type="button"
            onClick={onToggleBlame}
            onKeyDown={activateOnKeyDown}
            aria-pressed={blameOn}
            className="gs-lift"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 32, padding: "5px 11px", margin: 0, borderRadius: 7, background: blameOn ? "var(--sel)" : "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, fontFamily: "inherit", color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap", boxSizing: "border-box" }}
          >
            {t("workingCopy.blame")}
          </button>
        )}
        {/* Task 6 progressive disclosure: this label is redundant with the
            file path + status badge already shown — hide it before the
            Blame/split toggles would ever need to clip or wrap. */}
        {!blameOn && !hideSecondaryLabel && (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{effSel?.staged ? t("workingCopy.stagedDiff") : t("workingCopy.worktreeDiff")}</span>
        )}
        {!blameOn && (
          <button
            type="button"
            onClick={onToggleStacked}
            onKeyDown={activateOnKeyDown}
            className="gs-lift"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 32, padding: "5px 11px", margin: 0, borderRadius: 7, background: "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, fontFamily: "inherit", color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap", boxSizing: "border-box" }}
          >
            {isStacked ? t("workingCopy.sideBySide") : t("workingCopy.stacked")}
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "10px 0", background: "var(--panel2)" }}>
        {!effSel ? null : blameOn ? (
          blameQ.isLoading ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.loadingBlame")}</div>
          ) : blameQ.data && blameQ.data.length ? (
            <BlameView lines={blameQ.data} />
          ) : (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.noBlame")}</div>
          )
        ) : diff.isLoading ? (
          <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.loadingDiff")}</div>
        ) : diff.data && diff.data.trim() ? (
          <DiffView
            patch={diff.data}
            fontSize={12.5}
            stageLabel={effSel.staged ? t("workingCopy.unstage") : t("workingCopy.stage")}
            onStageHunk={selStatus === "?" ? undefined : onStageHunk}
            onLoadFull={onLoadFull}
          />
        ) : (
          <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.noTextChanges")}</div>
        )}
      </div>
    </div>
  );
}
