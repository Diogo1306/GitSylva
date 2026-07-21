import { activateOnKeyDown } from "../../components/ui/keys";
import type { TagInfo } from "../../lib/types";
import { useT } from "../../i18n";

const mono = "'JetBrains Mono', monospace";

export function TagsSection({
  tags,
  onCreateTag,
  onTagContextMenu,
}: {
  tags: TagInfo[];
  onCreateTag: () => void;
  onTagContextMenu: (x: number, y: number, name: string) => void;
}) {
  const t = useT();
  if (tags.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 10px 6px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>TAGS</div>
        <button
          type="button"
          onClick={onCreateTag}
          onKeyDown={activateOnKeyDown}
          title={t("shell.tag.title")}
          aria-label={t("shell.tag.title")}
          className="gs-row"
          style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
        >
          +
        </button>
      </div>
      {tags.map((tag) => (
        <div
          key={tag.name}
          title={t("shell.tag.rowTitle", { subject: tag.subject || tag.name })}
          onContextMenu={(e) => {
            e.preventDefault();
            onTagContextMenu(e.clientX, e.clientY, tag.name);
          }}
          className="gs-row"
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontFamily: mono, color: "var(--text2)" }}
        >
          <span style={{ width: 6, height: 6, background: "var(--muted)", transform: "rotate(45deg)", flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag.name}</span>
        </div>
      ))}
    </div>
  );
}
