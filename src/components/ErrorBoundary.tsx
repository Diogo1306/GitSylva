import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportRenderError } from "../lib/telemetry";

type Props = {
  children: ReactNode;
  /** Optional escape hatch (e.g. "go back to History") shown as a 3rd button. */
  homeLabel?: string;
  onHome?: () => void;
};
type State = { error: Error | null };

// Safety net: a render error shows a recoverable fallback instead of
// white-screening. Mounted at the top level AND around each screen, so a
// crashing screen leaves the titlebar/sidebar/navigation alive.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The crash always leaves a trail (console + Rust log file).
    reportRenderError(error, info.componentStack ?? "");
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ height: "100%", flex: 1, display: "grid", placeItems: "center", background: "var(--win, #141618)", color: "var(--text, #EAECEE)" }}>
          <div style={{ maxWidth: 440, display: "flex", flexDirection: "column", gap: 12, textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Algo correu mal</div>
            <div style={{ fontSize: 13, color: "var(--text2, #A5ACB2)", lineHeight: 1.5 }}>
              Ocorreu um erro inesperado ao desenhar este ecrã. Os teus repositórios não foram afetados.
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "var(--muted, #61686E)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 120, overflowY: "auto", textAlign: "left", background: "var(--panel2, #0C0E10)", border: "1px solid var(--border, #272B2E)", borderRadius: 10, padding: 12 }}>
              {this.state.error.message}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => this.setState({ error: null })}
                style={{ padding: "8px 16px", borderRadius: 9, background: "var(--accent, #EAECEE)", color: "var(--accentT, #111315)", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Tentar novamente
              </button>
              {this.props.onHome && (
                <button
                  onClick={() => {
                    this.props.onHome?.();
                    this.setState({ error: null });
                  }}
                  style={{ padding: "8px 16px", borderRadius: 9, background: "var(--btn, #1B1E21)", color: "var(--btnT, #C8CDD2)", border: "1px solid var(--btnB, #2D3134)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {this.props.homeLabel ?? "Voltar ao início"}
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                style={{ padding: "8px 16px", borderRadius: 9, background: "var(--btn, #1B1E21)", color: "var(--btnT, #C8CDD2)", border: "1px solid var(--btnB, #2D3134)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Recarregar aplicação
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
