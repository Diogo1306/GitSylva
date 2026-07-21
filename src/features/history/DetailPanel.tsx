import { useRef, useState } from "react";
import { useCommitDetail } from "../../state/queries";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { DiffView } from "../../components/DiffView";
import { statusStyle, statusTitle } from "../../lib/status";
import { FileIcon } from "../../components/FileIcon";
import { errMsg } from "../../lib/errors";
import { fullDate } from "../../lib/format";
import type { Commit } from "../../lib/types";
import { useT } from "../../i18n";
import { Avatar } from "./Avatar";

const mono = "'JetBrains Mono', monospace";

export function DetailPanel({ repoPath, commit }: { repoPath: string; commit: Commit }) {
  const t = useT();
  // "Carregar diff completo" opt-in, reset when another commit is selected.
  const [full, setFull] = useState(false);
  const [prevHash, setPrevHash] = useState(commit.hash);
  if (commit.hash !== prevHash) {
    setPrevHash(commit.hash);
    setFull(false);
  }
  const { data, isLoading, error: detailError } = useCommitDetail(repoPath, commit.hash, full);
  // %B = subject + blank line + body; everything after the first line is the body.
  const body = (data?.message ?? "").split("\n").slice(1).join("\n").trim();
  const diffRef = useRef<HTMLDivElement>(null);

  // Clicking a changed file focuses its section of the diff (spec §History).
  // Rows are ~20.1px (11.5px × 1.75 line-height); +34px for the view toggle.
  function scrollToFile(path: string) {
    const el = diffRef.current;
    const patch = data?.diff;
    if (!el || !patch) return;
    const lines = patch.replace(/\n$/, "").split("\n");
    const idx = lines.findIndex((l) => l.startsWith("diff --git ") && l.includes(` b/${path}`));
    if (idx < 0) return;
    el.scrollTo({ top: Math.max(0, idx * 20.1 + 34 - 6), behavior: "smooth" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={commit.author} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{commit.author}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fullDate(commit.date)}</div>
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: "var(--l0)",
              background: "var(--l0bg)",
              border: "1px solid var(--l0bd)",
              padding: "3px 9px",
              borderRadius: 7,
            }}
          >
            {commit.hash.slice(0, 7)}
          </div>
        </div>
        {/* Not selectable (user request): copying the message goes through the
            commit's right-click menu instead. */}
        <div style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--text)" }}>{commit.subject}</div>
        {body && (
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text2)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 110, overflowY: "auto" }}>
            {body}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, fontFamily: mono, fontSize: 12 }}>
          <span style={{ color: "var(--daT)" }}>+{data?.additions ?? 0}</span>
          <span style={{ color: "var(--ddT)" }}>−{data?.deletions ?? 0}</span>
          <span style={{ color: "var(--muted)" }}>{t("history.detail.filesCount", { count: data?.files.length ?? 0 })}</span>
        </div>
      </div>

      <div style={{ padding: "12px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>
        {t("history.detail.changedFiles")}
      </div>
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 1, maxHeight: "28%", overflowY: "auto" }}>
        {(data?.files ?? []).map((f) => {
          const st = statusStyle(f.status);
          return (
            <SelectableRow
              key={f.path}
              onSelect={() => scrollToFile(f.path)}
              title={t("history.detail.viewFileDiff")}
              style={{ gap: 9, padding: "6px 8px", borderRadius: 7 }}
            >
              <FileIcon path={f.path} />
              <span
                style={{
                  flex: 1,
                  fontFamily: mono,
                  fontSize: 12,
                  color: "var(--text2)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  direction: "rtl",
                  textAlign: "left",
                }}
              >
                {f.path}
              </span>
              <span
                title={statusTitle(f.status)}
                style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: st.color, width: 12, textAlign: "center", flexShrink: 0 }}
              >
                {f.status}
              </span>
            </SelectableRow>
          );
        })}
      </div>

      <div style={{ padding: "14px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>DIFF</div>
      <div ref={diffRef} style={{ flex: 1, overflow: "auto", margin: "0 12px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel2)", padding: "8px 0" }}>
        {isLoading ? (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>{t("history.detail.loadingDiff")}</div>
        ) : detailError ? (
          <div style={{ padding: 12, color: "var(--ddT)", fontSize: 12 }}>{errMsg(detailError, t("history.detail.readCommitError"))}</div>
        ) : data && data.diff.trim() ? (
          <DiffView patch={data.diff} onLoadFull={() => setFull(true)} />
        ) : (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>{t("history.detail.noTextChanges")}</div>
        )}
      </div>
    </div>
  );
}
