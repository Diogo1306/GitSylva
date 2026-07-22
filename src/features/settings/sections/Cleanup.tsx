import { useState } from "react";
import { useThemeStore } from "../../../state/themeStore";
import { useRecentsStore } from "../../../state/recentsStore";
import { toast } from "../../../state/toastStore";
import { notify } from "../../../state/notificationStore";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { Hint } from "./_shared";
import { useT } from "../../../i18n";

export function Cleanup() {
  const t = useT();
  const resetPrefs = useThemeStore((s) => s.resetPrefs);
  const recents = useRecentsStore((s) => s.recents);
  const clearRecents = useRecentsStore((s) => s.clear);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div id="set-limpeza" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: "var(--fw-bold)", letterSpacing: "1.4px", color: "var(--ddT)" }}>{t("settings.cleanup.title")}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Button onClick={() => { clearRecents(); toast(t("settings.cleanup.recentsCleared")); }}>{t("settings.cleanup.clearRecents")}</Button>
        <Hint>{t("settings.cleanup.recentsCount", { count: recents.length })}</Hint>
      </div>
      <div>
        <Button variant="danger" onClick={() => setConfirmReset(true)}>{t("settings.cleanup.resetAll")}</Button>
      </div>
      {confirmReset && (
        <ConfirmDialog
          message={t("settings.cleanup.resetConfirm")}
          confirmLabel={t("settings.cleanup.resetConfirmLabel")}
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetPrefs();
            setConfirmReset(false);
            notify(t("settings.cleanup.resetDoneTitle"), t("settings.cleanup.resetDoneBody"));
          }}
        />
      )}
    </div>
  );
}
