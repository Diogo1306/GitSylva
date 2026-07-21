const mono = "'JetBrains Mono', monospace";

// Header row for a folded directory (R5.4): its checkbox stages/unstages the
// whole folder in one click; the files keep their own rows below it.
export function FolderRow({ dir, count, checked, title, onToggle }: { dir: string; count: number; checked: boolean; title: string; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      title={title}
      className="gs-row"
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 8, cursor: "pointer" }}
    >
      <div
        style={
          checked
            ? { width: 17, height: 17, borderRadius: 5, background: "var(--accent)", flexShrink: 0, display: "grid", placeItems: "center", color: "var(--accentT)", fontSize: 11, fontWeight: 800 }
            : { width: 17, height: 17, borderRadius: 5, border: "1.5px solid var(--btnB)", boxSizing: "border-box", flexShrink: 0 }
        }
      >
        {checked ? "✓" : ""}
      </div>
      <span aria-hidden style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(201,168,58,0.16)", color: "#C9A83A", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <svg width="72%" height="72%" viewBox="0 0 16 16">
          <path d="M2 5 a1.6 1.6 0 0 1 1.6-1.6 h3 l1.6 1.8 h4.8 A1.6 1.6 0 0 1 14.6 6.8 v4.6 a1.6 1.6 0 0 1-1.6 1.6 H3.6 A1.6 1.6 0 0 1 2 11.4 z" fill="currentColor" />
        </svg>
      </span>
      <span style={{ flex: 1, fontFamily: mono, fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}>
        {dir}/
      </span>
      <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 10.5, fontWeight: 600, padding: "0 7px", flexShrink: 0 }}>
        {count}
      </span>
    </div>
  );
}
