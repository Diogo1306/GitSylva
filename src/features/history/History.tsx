import { useMemo, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useLog, useCommitDetail } from "../../state/queries";
import { graphRows } from "../../graph/layout";
import { CommitGraphSvg } from "../../components/CommitGraphSvg";
import { DiffLines } from "../../components/DiffLines";
import { statusStyle } from "../../lib/status";
import {
  relativeTime,
  fullDate,
  initials,
  avatarColor,
  parseRefs,
  chipStyle,
} from "../../lib/format";
import type { Commit } from "../../lib/types";

const ROW_H = 52;
const mono = "'JetBrains Mono', monospace";

function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  const { bg, color } = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontSize: size < 26 ? 9.5 : 12,
        fontWeight: 700,
        background: bg,
        color,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

function Chips({ refs }: { refs: string }) {
  const chips = parseRefs(refs);
  if (chips.length === 0) return null;
  return (
    <>
      {chips.map((ch, i) => {
        const st = chipStyle(ch.kind);
        return (
          <span
            key={i}
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              background: st.bg,
              color: st.color,
              border: `1px solid ${st.border}`,
            }}
          >
            {ch.label}
          </span>
        );
      })}
    </>
  );
}

function DetailPanel({ repoPath, commit }: { repoPath: string; commit: Commit }) {
  const { data, isLoading } = useCommitDetail(repoPath, commit.hash);

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
        <div style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--text)" }}>{commit.subject}</div>
        <div style={{ display: "flex", gap: 12, fontFamily: mono, fontSize: 12 }}>
          <span style={{ color: "var(--daT)" }}>+{data?.additions ?? 0}</span>
          <span style={{ color: "var(--ddT)" }}>−{data?.deletions ?? 0}</span>
          <span style={{ color: "var(--muted)" }}>{data?.files.length ?? 0} arquivos</span>
        </div>
      </div>

      <div style={{ padding: "12px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>
        ARQUIVOS ALTERADOS
      </div>
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 1, maxHeight: "28%", overflowY: "auto" }}>
        {(data?.files ?? []).map((f) => {
          const st = statusStyle(f.status);
          return (
            <div key={f.path} className="gs-row" style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 7 }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: mono,
                  fontSize: 10,
                  fontWeight: 700,
                  background: st.bg,
                  color: st.color,
                  flexShrink: 0,
                }}
              >
                {f.status}
              </span>
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
            </div>
          );
        })}
      </div>

      <div style={{ padding: "14px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>DIFF</div>
      <div style={{ flex: 1, overflow: "auto", margin: "0 12px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel2)", padding: "8px 0" }}>
        {isLoading ? (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>A carregar diff…</div>
        ) : data && data.diff.trim() ? (
          <DiffLines patch={data.diff} />
        ) : (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>Sem alterações textuais.</div>
        )}
      </div>
    </div>
  );
}

export function History() {
  const repo = useAppStore((s) => s.repo)!;
  const { data, isLoading, error } = useLog(repo.path);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const commits = data ?? [];
  const rows = useMemo(() => graphRows(commits), [commits]);

  const q = query.trim().toLowerCase();
  const filtering = q.length > 0;
  const filtered = filtering
    ? commits.filter((c) => (c.subject + " " + c.hash + " " + c.author).toLowerCase().includes(q))
    : commits;

  if (isLoading) return <div style={{ padding: 16, color: "var(--muted)" }}>A carregar histórico…</div>;
  if (error) return <div style={{ padding: 16, color: "var(--danger)" }}>{String(error)}</div>;
  if (commits.length === 0) return <div style={{ padding: 16, color: "var(--muted)" }}>Sem commits ainda.</div>;

  const selected = commits.find((c) => c.hash === selectedHash) ?? commits[0];

  const selectRow = (hash: string) => setSelectedHash(hash);

  return (
    <div style={{ flex: 1, display: "flex", minWidth: 0, animation: "fadeIn 0.25s ease both" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar histórico…"
            style={{
              flex: 1,
              background: "var(--input)",
              border: "1px solid var(--btnB)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--text)",
              outline: "none",
              fontFamily: "var(--font)",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: mono, whiteSpace: "nowrap" }}>
            {filtered.length} commits
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ position: "relative" }}>
            {!filtering && (
              <div style={{ position: "absolute", left: 14, top: 0, pointerEvents: "none" }}>
                <CommitGraphSvg rows={rows} rowH={ROW_H} />
              </div>
            )}
            {filtered.map((c) => {
              const isSel = selected.hash === c.hash;
              return (
                <div
                  key={c.hash}
                  onClick={() => selectRow(c.hash)}
                  className="gs-row"
                  style={{
                    height: ROW_H,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: filtering ? "0 16px" : "0 16px 0 96px",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    background: isSel ? "var(--sel)" : "transparent",
                    borderBottom: "1px solid var(--bsoft)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: "var(--text)",
                        fontWeight: isSel ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.subject}
                    </span>
                    <Chips refs={c.refs} />
                  </div>
                  <Avatar name={c.author} />
                  <div style={{ width: 66, fontFamily: mono, fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>
                    {c.hash.slice(0, 7)}
                  </div>
                  <div style={{ width: 96, fontSize: 12, color: "var(--muted)", textAlign: "right", flexShrink: 0 }}>
                    {relativeTime(c.date)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ width: 360, flexShrink: 0, background: "var(--panel)", minHeight: 0 }}>
        <DetailPanel repoPath={repo.path} commit={selected} />
      </div>
    </div>
  );
}
