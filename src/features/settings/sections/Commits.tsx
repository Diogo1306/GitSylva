import { useThemeStore } from "../../../state/themeStore";
import { Toggle } from "../../../components/ui/misc";
import { SectionTitle, Hint } from "./_shared";
import { useT } from "../../../i18n";

export function Commits() {
  const t = useT();
  const confirmDiscard = useThemeStore((s) => s.confirmDiscard);
  const save = useThemeStore((s) => s.savePrefs);

  return (
    <div id="set-commits" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.commits.title")}</SectionTitle>
      <div onClick={() => save({ confirmDiscard: !confirmDiscard })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", cursor: "pointer", borderBottom: "1px solid var(--bsoft)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t("settings.commits.confirmDiscard")}</div>
          <Hint>{t("settings.commits.confirmDiscardHint")}</Hint>
        </div>
        <Toggle on={confirmDiscard} aria-label={t("settings.commits.confirmDiscard")} />
      </div>
    </div>
  );
}
