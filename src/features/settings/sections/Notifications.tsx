import { SectionTitle, FieldLabel, Hint, ToggleRow } from "./_shared";
import { toast } from "../../../state/toastStore";
import { notify } from "../../../state/notificationStore";
import { useThemeStore } from "../../../state/themeStore";
import { Button } from "../../../components/ui/Button";
import { useT } from "../../../i18n";

// Which async git results raise a bottom-right notification. The toggles gate the
// emission in notificationStore; the preview fires the real systems.
export function Notifications() {
  const t = useT();
  const prefs = useThemeStore();

  return (
    <div id="set-notificacoes" style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.notifications.title")}</SectionTitle>
      <Hint>{t("settings.notifications.intro")}</Hint>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <ToggleRow label={t("settings.notifications.pushPull")} hint={t("settings.notifications.pushPullHint")} on={prefs.notifPush} onToggle={() => prefs.savePrefs({ notifPush: !prefs.notifPush })} />
        <ToggleRow label={t("settings.notifications.fetch")} hint={t("settings.notifications.fetchHint")} on={prefs.notifFetch} onToggle={() => prefs.savePrefs({ notifFetch: !prefs.notifFetch })} />
        <ToggleRow label={t("settings.notifications.conflicts")} hint={t("settings.notifications.conflictsHint")} on={prefs.notifConflicts} onToggle={() => prefs.savePrefs({ notifConflicts: !prefs.notifConflicts })} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.notifications.whereShow")}</FieldLabel>
        {/* Not a real Segmented: the 2nd slot is a disabled "coming soon" placeholder, not a selectable value. Same track chrome as Segmented for visual consistency. */}
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: "var(--r-lg)", background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
          <div style={{ padding: "6px 16px", borderRadius: "var(--r-md)", fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", background: "var(--win)", color: "var(--text)" }}>{t("settings.notifications.inApp")}</div>
          <div
            title={t("settings.notifications.systemUnavailable")}
            aria-disabled="true"
            style={{ padding: "6px 16px", borderRadius: "var(--r-md)", fontSize: "var(--fs-sm)", fontWeight: "var(--fw-semibold)", color: "var(--muted)", opacity: 0.55, cursor: "default" }}
          >
            {t("settings.notifications.systemSoon")}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={() => notify(t("settings.notifications.previewPushTitle"), t("settings.notifications.previewPushSub"), "success")}>{t("settings.notifications.preview")}</Button>
        <Button onClick={() => notify(t("settings.notifications.previewErrorTitle"), t("settings.notifications.previewErrorSub"), "error")}>{t("settings.notifications.errorButton")}</Button>
        <Button onClick={() => toast(t("settings.notifications.toastExample"))}>{t("settings.notifications.toastButton")}</Button>
        <Button onClick={() => toast(t("settings.notifications.toastErrorExample"), "error")}>{t("settings.notifications.toastErrorButton")}</Button>
      </div>
    </div>
  );
}
