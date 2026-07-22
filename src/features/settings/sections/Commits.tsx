import { useThemeStore } from "../../../state/themeStore";
import { SectionTitle, ToggleRow } from "./_shared";
import { useT } from "../../../i18n";

export function Commits() {
  const t = useT();
  const confirmDiscard = useThemeStore((s) => s.confirmDiscard);
  const save = useThemeStore((s) => s.savePrefs);

  return (
    <div id="set-commits" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.commits.title")}</SectionTitle>
      <ToggleRow
        label={t("settings.commits.confirmDiscard")}
        hint={t("settings.commits.confirmDiscardHint")}
        on={confirmDiscard}
        onToggle={() => save({ confirmDiscard: !confirmDiscard })}
      />
    </div>
  );
}
