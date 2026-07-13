import { SectionTitle, Hint } from "./_shared";
import { toast } from "../../../state/toastStore";
import { Button } from "../../../components/ui/Button";

// In-app notifications are real (the toast system); OS-level notifications are
// a future phase and said so honestly.
export function Notifications() {
  return (
    <div id="set-notificacoes" style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
      <SectionTitle>NOTIFICAÇÕES</SectionTitle>
      <Hint>
        As notificações aparecem na base da janela. Clica numa para a fechar; as de erro
        ficam mais tempo no ecrã para dar tempo de as ler.
      </Hint>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button onClick={() => toast("Exemplo de notificação")}>Pré-visualizar</Button>
        <Button onClick={() => toast("Exemplo de sucesso", "success")}>Sucesso</Button>
        <Button onClick={() => toast("Exemplo de erro — fica 8s e fecha ao clicar", "error")}>Erro</Button>
      </div>
      <Hint>Notificações do sistema operativo chegam numa próxima fase.</Hint>
    </div>
  );
}
