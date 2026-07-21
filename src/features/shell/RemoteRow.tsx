import { SelectableRow } from "../../components/ui/SelectableRow";
import { useT } from "../../i18n";

const mono = "'JetBrains Mono', monospace";

// One remote-branch row (single click shows the tip, double click checks out
// a local tracking branch); shared by flat entries and folder members, which
// indent deeper and drop the prefix.
export function RemoteRow({
  remote,
  shortName,
  display,
  padLeft,
  selected,
  checkoutPending,
  onSelect,
  onRequestSwitch,
  onContextMenuOpen,
}: {
  remote: string;
  shortName: string;
  display: string;
  padLeft: number;
  selected: boolean;
  checkoutPending: boolean;
  onSelect: () => void;
  onRequestSwitch: () => void;
  onContextMenuOpen: (x: number, y: number) => void;
}) {
  const t = useT();
  return (
    <SelectableRow
      selected={selected}
      // Task 8: aria-pressed (valid on role="button") conveys a toggled
      // selection WITHOUT the "current location" meaning aria-current
      // carries — in a git client "current branch" specifically means the
      // checked-out one (is_current), so a screen reader must not announce
      // a merely single-clicked remote row as "current".
      aria-pressed={selected}
      onSelect={onSelect}
      onDoubleClick={() => !checkoutPending && onRequestSwitch()}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenuOpen(e.clientX, e.clientY);
      }}
      title={t("shell.branch.remoteRowTitle", { ref: `${remote}/${shortName}` })}
      style={{
        gap: 9,
        padding: `5px 10px 5px ${padLeft}px`,
        fontSize: 12.5,
        fontFamily: mono,
        color: "var(--muted)",
        boxShadow: selected ? "inset 3px 0 0 var(--accent)" : undefined,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted)", flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</span>
    </SelectableRow>
  );
}
