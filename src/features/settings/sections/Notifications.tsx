import { SectionTitle, FieldLabel, Hint } from "./_shared";
import { toast } from "../../../state/toastStore";
import { notify } from "../../../state/notificationStore";
import { useThemeStore } from "../../../state/themeStore";
import { Toggle } from "../../../components/ui/misc";
import { Button } from "../../../components/ui/Button";

// Which async git results raise a top-right notification. The toggles gate the
// emission in notificationStore; the preview fires the real systems.
export function Notifications() {
  const t = useThemeStore();
  const row = (label: string, hint: string, key: "notifPush" | "notifFetch" | "notifConflicts") => (
    <div
      onClick={() => t.savePrefs({ [key]: !t[key] })}
      className="gs-row"
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 9, cursor: "pointer", border: "1px solid var(--border)", background: "var(--panel)" }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{hint}</div>
      </div>
      <Toggle on={t[key]} />
    </div>
  );

  return (
    <div id="set-notificacoes" style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 20 }}>
      <SectionTitle>NOTIFICAÇÕES</SectionTitle>
      <Hint>
        Notificações aparecem no canto superior direito (~4s; parar o rato pausa o tempo).
        Confirmações rápidas aparecem como toasts na base.
      </Hint>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {row("Push & Pull concluídos", "Resultado de enviar/integrar commits com origin", "notifPush")}
        {row("Fetch", "Quando o fetch de origin termina (ou falha)", "notifFetch")}
        {row("Conflitos", "Merge/pull que fica em conflito por resolver", "notifConflicts")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Onde mostrar</FieldLabel>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
          <div style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, background: "var(--win)", color: "var(--text)" }}>Na app</div>
          <div title="Notificações do sistema chegam numa próxima fase" style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, color: "var(--muted)", opacity: 0.55, cursor: "default" }}>
            Sistema · em breve
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={() => notify("Push concluído", "origin · 2 commit(s) · exemplo", "success")}>Pré-visualizar notificação</Button>
        <Button onClick={() => notify("Fetch falhou", "exemplo de erro — fecha no ✕ ou espera", "error")}>Erro</Button>
        <Button onClick={() => toast("Exemplo de toast")}>Toast</Button>
        <Button onClick={() => toast("Exemplo de erro em toast", "error")}>Toast de erro</Button>
      </div>
    </div>
  );
}
