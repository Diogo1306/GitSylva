import { useMemo, useState } from "react";
import { useCommitDetail } from "../../state/queries";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { DiffView } from "../../components/DiffView";
import { statusStyle, statusTitle } from "../../lib/status";
import { FileIcon } from "../../components/FileIcon";
import { errMsg } from "../../lib/errors";
import { fullDate } from "../../lib/format";
import { patchForFile } from "../../lib/diffLine";
import { getDiffPref, setDiffPref } from "../../lib/diffPref";
import { activateOnKeyDown } from "../../components/ui/keys";
import type { Commit } from "../../lib/types";
import { useT } from "../../i18n";
import { Avatar } from "./Avatar";

const mono = "'JetBrains Mono', monospace";

// Below this window width the diff starts collapsed by default (interactions
// spec §History); a stored per-repo choice always wins over this fallback.
const DIFF_DEFAULT_MIN = 980;

const actionBtn: React.CSSProperties = {
  height: 36,
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  borderRadius: 8,
  background: "var(--btn)",
  border: "1px solid var(--btnB)",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--btnT)",
  cursor: "pointer",
  boxSizing: "border-box",
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

export function DetailPanel({
  repoPath,
  commit,
  onClose,
  onBranch,
  onTag,
  onRevert,
  onMore,
}: {
  repoPath: string;
  commit: Commit;
  /** The ✕ that closes the whole panel (distinct from "Ocultar diff"). */
  onClose: () => void;
  onBranch: (hash: string) => void;
  onTag: (hash: string) => void;
  onRevert: (hash: string) => void;
  /** Opens the advanced-actions menu anchored at (x, y). */
  onMore: (hash: string, x: number, y: number) => void;
}) {
  const t = useT();
  // "Carregar diff completo" opt-in, reset when another commit is selected.
  const [full, setFull] = useState(false);
  // Which changed file's diff is shown (null → fall back to the first file).
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  // Diff-code collapse: per-session, per-repo (survives commit switches).
  const [diffOpen, setDiffOpenState] = useState(() => getDiffPref(repoPath, window.innerWidth >= DIFF_DEFAULT_MIN));

  const [prevHash, setPrevHash] = useState(commit.hash);
  if (commit.hash !== prevHash) {
    setPrevHash(commit.hash);
    setFull(false);
    setSelectedFile(null);
  }
  const [prevRepo, setPrevRepo] = useState(repoPath);
  if (repoPath !== prevRepo) {
    setPrevRepo(repoPath);
    setSelectedFile(null);
    setDiffOpenState(getDiffPref(repoPath, window.innerWidth >= DIFF_DEFAULT_MIN));
  }

  const { data, isLoading, error: detailError } = useCommitDetail(repoPath, commit.hash, full);
  // %B = subject + blank line + body; everything after the first line is the body.
  const body = (data?.message ?? "").split("\n").slice(1).join("\n").trim();
  const files = data?.files ?? [];

  // Auto-focus the first file so the diff shows immediately; a click switches it.
  const activeFile = selectedFile && files.some((f) => f.path === selectedFile) ? selectedFile : files[0]?.path ?? null;
  const diff = data?.diff;
  const filePatch = useMemo(
    () => (diff && activeFile ? patchForFile(diff, activeFile) : ""),
    [diff, activeFile],
  );

  const toggleDiff = () => {
    const next = !diffOpen;
    setDiffOpenState(next);
    setDiffPref(repoPath, next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      {/* ── metadata + actions (never scrolls away) ─────────────────────────── */}
      <div style={{ flexShrink: 0, padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={commit.author} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{commit.author}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fullDate(commit.date)}</div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 12, color: "var(--l0)", background: "var(--l0bg)", border: "1px solid var(--l0bd)", padding: "3px 9px", borderRadius: 7 }}>
            {commit.hash.slice(0, 7)}
          </div>
          <button
            type="button"
            onClick={onClose}
            onKeyDown={activateOnKeyDown}
            title={t("history.detail.closeTitle")}
            aria-label={t("history.detail.closeTitle")}
            className="gs-lift"
            style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13, cursor: "pointer", flexShrink: 0, background: "transparent", border: "none", fontFamily: "inherit" }}
          >
            ✕
          </button>
        </div>

        {/* Not selectable (user request): copying the message goes through the
            commit's right-click menu / "…" instead. */}
        <div style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--text)" }}>{commit.subject}</div>
        {body && (
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text2)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 110, overflowY: "auto" }}>
            {body}
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" onClick={() => onBranch(commit.hash)} onKeyDown={activateOnKeyDown} className="gs-lift" style={actionBtn}>
            {t("history.detail.actionBranch")}
          </button>
          <button type="button" onClick={() => onTag(commit.hash)} onKeyDown={activateOnKeyDown} className="gs-lift" style={actionBtn}>
            {t("history.detail.actionTag")}
          </button>
          <button type="button" onClick={() => onRevert(commit.hash)} onKeyDown={activateOnKeyDown} className="gs-lift" style={actionBtn}>
            {t("history.detail.actionRevert")}
          </button>
          <button
            type="button"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onMore(commit.hash, r.left, r.bottom + 4);
            }}
            onKeyDown={activateOnKeyDown}
            title={t("history.detail.moreActions")}
            aria-label={t("history.detail.moreActions")}
            aria-haspopup="menu"
            className="gs-lift"
            style={{ ...actionBtn, width: 38, padding: 0, justifyContent: "center", fontSize: 15 }}
          >
            …
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, fontFamily: mono, fontSize: 12 }}>
          <span style={{ color: "var(--daT)" }}>+{data?.additions ?? 0}</span>
          <span style={{ color: "var(--ddT)" }}>−{data?.deletions ?? 0}</span>
          <span style={{ color: "var(--muted)" }}>{t("history.detail.filesCount", { count: files.length })}</span>
        </div>
      </div>

      {/* ── changed files ───────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: "12px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>
        {t("history.detail.changedFiles")}
      </div>
      <div
        style={{
          padding: "0 12px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflowY: "auto",
          // With the diff open the list is capped so the diff gets room; with it
          // collapsed the list takes the rest of the panel and scrolls itself.
          ...(diffOpen ? { flexShrink: 0, maxHeight: "34%" } : { flex: 1, minHeight: 0 }),
        }}
      >
        {files.map((f) => {
          const st = statusStyle(f.status);
          return (
            <SelectableRow
              key={f.path}
              selected={activeFile === f.path}
              onSelect={() => setSelectedFile(f.path)}
              title={t("history.detail.viewFileDiff")}
              style={{ gap: 9, padding: "6px 8px", borderRadius: 7 }}
            >
              <FileIcon path={f.path} />
              <span style={{ flex: 1, fontFamily: mono, fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}>
                {f.path}
              </span>
              <span title={statusTitle(f.status)} style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: st.color, width: 12, textAlign: "center", flexShrink: 0 }}>
                {f.status}
              </span>
            </SelectableRow>
          );
        })}
      </div>

      {/* ── diff header + collapse toggle ───────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: "10px 12px 8px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>{t("history.detail.diffSection")}</div>
        <button
          type="button"
          onClick={toggleDiff}
          onKeyDown={activateOnKeyDown}
          aria-expanded={diffOpen}
          title={diffOpen ? t("history.detail.hideDiff") : t("history.detail.showDiff")}
          className="gs-lift"
          style={actionBtn}
        >
          {diffOpen ? `${t("history.detail.hideDiff")} ▾` : `${t("history.detail.showDiff")} ▸`}
        </button>
      </div>

      {/* ── diff code (the only thing "Ocultar diff" hides) ─────────────────── */}
      {diffOpen && (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", margin: "0 12px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel2)", padding: "8px 0", animation: "fadeIn 0.18s ease both" }}>
          {isLoading ? (
            <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>{t("history.detail.loadingDiff")}</div>
          ) : detailError ? (
            <div style={{ padding: 12, color: "var(--ddT)", fontSize: 12 }}>{errMsg(detailError, t("history.detail.readCommitError"))}</div>
          ) : activeFile && filePatch.trim() ? (
            <DiffView patch={filePatch} clean onLoadFull={() => setFull(true)} />
          ) : files.length === 0 ? (
            <div style={{ padding: 18, textAlign: "center", color: "var(--muted)", fontSize: 12.5 }}>{t("history.detail.diffEmpty")}</div>
          ) : (
            <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>{t("history.detail.noTextChanges")}</div>
          )}
        </div>
      )}
    </div>
  );
}
