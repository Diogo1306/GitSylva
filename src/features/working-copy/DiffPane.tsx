import type { useBlame, useDiff } from "../../state/queries";
import { DiffView } from "../../components/DiffView";
import { BlameView } from "../../components/BlameView";
import { Button } from "../../components/ui/Button";
import { FileIcon } from "../../components/FileIcon";
import { useT } from "../../i18n";
import { activateOnKeyDown } from "../../components/ui/keys";
import { FileStatusMark } from "./FileRow";
import type { Sel } from "./WorkingCopy";

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
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", order }}>
      <div style={{ padding: "var(--sp-5) var(--sp-8)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
        {effSel ? (
          <>
            <FileIcon path={effSel.path} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-sm)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{effSel.path}</span>
            <FileStatusMark letter={selStatus} />
          </>
        ) : (
          <span style={{ fontSize: "var(--fs-sm)", color: "var(--muted)" }}>{t("workingCopy.selectFilePrompt")}</span>
        )}
        <div style={{ flex: 1 }} />
        {effSel && selStatus !== "?" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleBlame}
            onKeyDown={activateOnKeyDown}
            aria-pressed={blameOn}
            // An explicit `background: undefined` would still win the spread
            // inside Button and blank out its default fill, so the key is
            // only present at all when the pressed state needs it.
            style={blameOn ? { minHeight: 32, background: "var(--sel)" } : { minHeight: 32 }}
          >
            {t("workingCopy.blame")}
          </Button>
        )}
        {/* Task 6 progressive disclosure: this label is redundant with the
            file path + status badge already shown — hide it before the
            Blame/split toggles would ever need to clip or wrap. */}
        {!blameOn && !hideSecondaryLabel && (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{effSel?.staged ? t("workingCopy.stagedDiff") : t("workingCopy.worktreeDiff")}</span>
        )}
        {!blameOn && (
          <Button variant="secondary" size="sm" onClick={onToggleStacked} onKeyDown={activateOnKeyDown} style={{ minHeight: 32 }}>
            {isStacked ? t("workingCopy.sideBySide") : t("workingCopy.stacked")}
          </Button>
        )}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "var(--sp-3) 0", background: "var(--panel2)" }}>
        {!effSel ? null : blameOn ? (
          blameQ.isLoading ? (
            <div style={{ padding: "var(--sp-8)", color: "var(--muted)" }}>{t("workingCopy.loadingBlame")}</div>
          ) : blameQ.data && blameQ.data.length ? (
            <BlameView lines={blameQ.data} />
          ) : (
            <div style={{ padding: "var(--sp-8)", color: "var(--muted)" }}>{t("workingCopy.noBlame")}</div>
          )
        ) : diff.isLoading ? (
          <div style={{ padding: "var(--sp-8)", color: "var(--muted)" }}>{t("workingCopy.loadingDiff")}</div>
        ) : diff.data && diff.data.trim() ? (
          <DiffView
            patch={diff.data}
            fontSize={12.5}
            stageLabel={effSel.staged ? t("workingCopy.unstage") : t("workingCopy.stage")}
            onStageHunk={selStatus === "?" ? undefined : onStageHunk}
            onLoadFull={onLoadFull}
            clean
          />
        ) : (
          <div style={{ padding: "var(--sp-8)", color: "var(--muted)" }}>{t("workingCopy.noTextChanges")}</div>
        )}
      </div>
    </div>
  );
}
