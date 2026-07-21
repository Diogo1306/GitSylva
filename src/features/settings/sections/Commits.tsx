import { useThemeStore } from "../../../state/themeStore";
import { Toggle } from "../../../components/ui/misc";
import { SectionTitle, Hint } from "./_shared";

export function Commits() {
  const confirmDiscard = useThemeStore((s) => s.confirmDiscard);
  const save = useThemeStore((s) => s.savePrefs);

  return (
    <div id="set-commits" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <SectionTitle>COMMITS</SectionTitle>
      <div onClick={() => save({ confirmDiscard: !confirmDiscard })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", cursor: "pointer", borderBottom: "1px solid var(--bsoft)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>Confirmar antes de descartar</div>
          <Hint>Pede confirmação ao descartar alterações não preparadas.</Hint>
        </div>
        <Toggle on={confirmDiscard} aria-label="Confirmar antes de descartar" />
      </div>
    </div>
  );
}
