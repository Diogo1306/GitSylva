import { SectionTitle, FieldLabel, Hint } from "./_shared";
import { toast } from "../../../state/toastStore";
import { notify } from "../../../state/notificationStore";
import { useThemeStore } from "../../../state/themeStore";
import { Toggle } from "../../../components/ui/misc";
import { Button } from "../../../components/ui/Button";
import { useT } from "../../../i18n";

// Which async git results raise a bottom-right notification. The toggles gate the
// emission in notificationStore; the preview fires the real systems.
export function Notifications() {
  const t = useT();
  const prefs = useThemeStore();
  const row = (label: string, hint: string, key: "notifPush" | "notifFetch" | "notifConflicts") => (
    <div
      onClick={() => prefs.savePrefs({ [key]: !prefs[key] })}
      className="gs-row"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 9, cursor: "pointer", border: "1px solid var(--border)", background: "var(--panel)" }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{hint}</div>
      </div>
      <Toggle on={prefs[key]} aria-label={label} />
    </div>
  );

  return (
    <div id="set-notificacoes" style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.notifications.title")}</SectionTitle>
      <Hint>{t("settings.notifications.intro")}</Hint>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {row(t("settings.notifications.pushPull"), t("settings.notifications.pushPullHint"), "notifPush")}
        {row(t("settings.notifications.fetch"), t("settings.notifications.fetchHint"), "notifFetch")}
        {row(t("settings.notifications.conflicts"), t("settings.notifications.conflictsHint"), "notifConflicts")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.notifications.whereShow")}</FieldLabel>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
          <div style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, background: "var(--win)", color: "var(--text)" }}>{t("settings.notifications.inApp")}</div>
          <div
            title={t("settings.notifications.systemUnavailable")}
            aria-disabled="true"
            style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, color: "var(--muted)", opacity: 0.55, cursor: "default" }}
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
