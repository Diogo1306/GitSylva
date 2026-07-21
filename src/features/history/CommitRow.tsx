import { memo } from "react";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { relativeTime, parseRefs, chipStyle } from "../../lib/format";
import type { Commit } from "../../lib/types";
import { useT } from "../../i18n";
import { Avatar } from "./Avatar";

const mono = "'JetBrains Mono', monospace";

function Chips({ refs }: { refs: string }) {
  const chips = parseRefs(refs);
  if (chips.length === 0) return null;
  return (
    // The wrapper may shrink and clip: long ref names (origin/fix/…) used to
    // paint straight over the avatar and hash columns.
    <span style={{ display: "flex", gap: 6, minWidth: 0, overflow: "hidden", flexShrink: 1 }}>
      {chips.map((ch, i) => {
        const st = chipStyle(ch.kind);
        return (
          <span
            key={i}
            title={ch.label}
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              // Per-chip cap so one long ref name can't starve the others —
              // but the HEAD chip (where you ARE) never gives up its space.
              maxWidth: 150,
              flexShrink: ch.kind === "head" ? 0 : 1,
              boxSizing: "border-box",
              background: st.bg,
              color: st.color,
              border: `1px solid ${st.border}`,
            }}
          >
            {ch.label}
          </span>
        );
      })}
    </span>
  );
}

// Memoized so selecting a commit only re-renders the two affected rows, not the
// whole (potentially hundreds long) list.
export const CommitRow = memo(function CommitRow({
  commit,
  selected,
  filtering,
  rowH,
  gutter,
  hideSecondary,
  onSelect,
  onGoto,
  onContext,
}: {
  commit: Commit;
  selected: boolean;
  filtering: boolean;
  rowH: number;
  /** Left space for the graph — grows with the number of parallel lanes. */
  gutter: number;
  /** Task 6 progressive disclosure: hide the decorative avatar before the
   *  subject would ever need to truncate further to make room for it. */
  hideSecondary: boolean;
  onSelect: (hash: string) => void;
  /** Double click: confirm-and-checkout this commit (branch-row pattern). */
  onGoto: (hash: string) => void;
  onContext: (hash: string, x: number, y: number) => void;
}) {
  const t = useT();
  // Where HEAD is (the commit you're standing on) gets a left accent bar so
  // it's findable at a glance even with the chips scrolled out of view.
  const isHead = commit.refs.includes("HEAD");
  return (
    <SelectableRow
      role="option"
      selected={selected}
      onSelect={() => onSelect(commit.hash)}
      onDoubleClick={() => onGoto(commit.hash)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext(commit.hash, e.clientX, e.clientY);
      }}
      title={t("history.row.title")}
      style={{
        height: rowH,
        gap: 12,
        padding: filtering ? "0 16px" : `0 16px 0 ${gutter}px`,
        borderRadius: 0,
        boxSizing: "border-box",
        boxShadow: isHead ? "inset 3px 0 0 var(--l0)" : undefined,
        borderBottom: "1px solid var(--bsoft)",
        // Skip painting rows scrolled out of view; the box keeps its height so
        // the graph overlay stays aligned.
        contentVisibility: "auto",
        containIntrinsicSize: `${rowH}px`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13.5, color: "var(--text)", fontWeight: selected ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {commit.subject}
        </span>
        <Chips refs={commit.refs} />
      </div>
      {!hideSecondary && <Avatar name={commit.author} />}
      <div style={{ width: 66, fontFamily: mono, fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>{commit.hash.slice(0, 7)}</div>
      <div className="gs-resp-time" style={{ width: 96, fontSize: 12, color: "var(--muted)", textAlign: "right", flexShrink: 0 }}>{relativeTime(commit.date)}</div>
    </SelectableRow>
  );
});
