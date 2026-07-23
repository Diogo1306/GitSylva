import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { toast } from "../../../state/toastStore";
import { SectionTitle, Hint } from "./_shared";
import { useT } from "../../../i18n";

const PROVIDERS: [string, string][] = [
  ["GH", "GitHub"],
  ["GL", "GitLab"],
  ["BB", "Bitbucket"],
];

// Contas & Acesso (checklist §12): OAuth/token backend isn't implemented yet,
// so every row stays permanently "not connected" — Connect is a clear stub
// (soon-dimmed button + toast) rather than a fake login.
export function Accounts() {
  const t = useT();

  return (
    <div id="set-contas" style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.accounts.title")}</SectionTitle>
      <Hint>{t("settings.accounts.hint")}</Hint>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PROVIDERS.map(([initial, name]) => (
          <Card key={name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--badge)", color: "var(--badgeT)", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{initial}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-base)", fontWeight: "var(--fw-semibold)" }}>{name}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{t("settings.accounts.notConnected")}</div>
            </div>
            <Button soon onClick={() => toast(t("settings.accounts.connectSoon"))} aria-label={t("settings.accounts.connectAria", { provider: name })}>
              {t("settings.accounts.connect")}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
