import { CheckSquare, Badge } from "../../components/ui/misc";
import { SelectableRow } from "../../components/ui/SelectableRow";

// Header row for a folded directory (R5.4): its checkbox stages/unstages the
// whole folder in one click; the files keep their own rows below it.
export function FolderRow({ dir, count, checked, title, onToggle }: { dir: string; count: number; checked: boolean; title: string; onToggle: () => void }) {
  return (
    <SelectableRow selected={false} onSelect={onToggle} title={title} aria-pressed={checked} style={{ gap: "var(--sp-3)", padding: "7px var(--sp-3)" }}>
      <CheckSquare on={checked} />
      <span aria-hidden style={{ width: 16, height: 16, borderRadius: "var(--r-xs)", background: "var(--l2bg)", color: "var(--l2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <svg width="72%" height="72%" viewBox="0 0 16 16">
          <path d="M2 5 a1.6 1.6 0 0 1 1.6-1.6 h3 l1.6 1.8 h4.8 A1.6 1.6 0 0 1 14.6 6.8 v4.6 a1.6 1.6 0 0 1-1.6 1.6 H3.6 A1.6 1.6 0 0 1 2 11.4 z" fill="currentColor" />
        </svg>
      </span>
      <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}>
        {dir}/
      </span>
      <Badge>{count}</Badge>
    </SelectableRow>
  );
}
