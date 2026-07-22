import { useThemeStore } from "../../../state/themeStore";
import { PULL_MODES as MODES, pullModeHint } from "../../../lib/pullModes";
import { Segmented } from "../../../components/ui/Segmented";
import { SectionTitle, FieldLabel, Hint } from "./_shared";
import { useT } from "../../../i18n";

export function PushPull() {
  const t = useT();
  const pullMode = useThemeStore((s) => s.pullMode);
  const save = useThemeStore((s) => s.savePrefs);
  const active = MODES.find((m) => m.key === pullMode) ?? MODES[0];

  return (
    <div id="set-pushpull" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.pushPull.title")}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.pushPull.pullBehavior")}</FieldLabel>
        <div style={{ alignSelf: "flex-start" }}>
          <Segmented
            aria-label={t("settings.pushPull.pullBehavior")}
            value={pullMode}
            onChange={(v) => save({ pullMode: v as typeof pullMode })}
            options={MODES.map((m) => ({ value: m.key, label: m.name }))}
          />
        </div>
        <Hint>{pullModeHint(active.key)}</Hint>
      </div>
    </div>
  );
}
