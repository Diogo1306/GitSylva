import { useAppStore } from "../../state/appStore";

// Placeholder settings screen. The full settings (appearance wired to the theme
// store, plus the many stubbed sections) arrive in a later phase.
export function Settings() {
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, background: "var(--win)", animation: "fadeIn 0.25s ease both" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div
          onClick={() => setView(prevView)}
          className="gs-lift"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 11px",
            borderRadius: 8,
            background: "var(--btn)",
            border: "1px solid var(--btnB)",
            color: "var(--btnT)",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Voltar
        </div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Definições</div>
        <span className="gs-soon">Em construção</span>
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13.5, padding: 24, textAlign: "center" }}>
        <div style={{ maxWidth: 420, lineHeight: 1.6 }}>
          Aparência (temas, estilo de árvore, cores de branch, accent, animações), Contas, Git,
          Atalhos, SSH e restantes secções chegam numa próxima fase.
        </div>
      </div>
    </div>
  );
}
