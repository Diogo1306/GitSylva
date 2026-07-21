import { SelectableRow } from "../../components/ui/SelectableRow";
import { useT } from "../../i18n";
import type { View } from "../../state/appStore";
import { SectionLabel } from "./SectionLabel";

export function NavSection({
  view,
  setView,
  wcCount,
  stashCount,
}: {
  view: View;
  setView: (v: View) => void;
  wcCount: number;
  stashCount: number;
}) {
  const t = useT();

  const navRow = (key: View, label: string, dot: React.ReactNode, badge?: number | null) => (
    <SelectableRow
      key={key}
      onSelect={() => setView(key)}
      style={{
        gap: 9,
        padding: "7px 10px",
        fontSize: 13.5,
        color: "var(--text)",
        // undefined (not "transparent") so .gs-row:hover still paints.
        background: view === key ? "var(--sel)" : undefined,
      }}
    >
      {dot}
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "1px 7px" }}>
          {badge}
        </span>
      )}
    </SelectableRow>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SectionLabel>{t("shell.sidebar.workspace")}</SectionLabel>
      {navRow(
        "working",
        t("shell.nav.workingCopy"),
        <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--l2)", flexShrink: 0 }} />,
        wcCount,
      )}
      {navRow(
        "history",
        t("shell.nav.history"),
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--l0)", flexShrink: 0 }} />,
      )}
      {navRow(
        "stashes",
        t("shell.nav.stashes"),
        <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--l1)", transform: "rotate(45deg)", flexShrink: 0 }} />,
        stashCount,
      )}
    </div>
  );
}
