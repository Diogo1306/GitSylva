// Stashes screen. The list and actions need a backend (a later phase); for now
// it shows the design's empty state so the section is present and navigable.
export function Stashes() {
  return (
    <div
      style={{
        flex: 1,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflowY: "auto",
        animation: "fadeUp 0.3s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Stashes</div>
        <span className="gs-soon">Em breve</span>
      </div>
      <div
        style={{
          maxWidth: 620,
          border: "1px dashed var(--btnB)",
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 13.5,
        }}
      >
        Sem stashes. Guardar e aplicar stashes chega numa próxima fase, quando o backend suportar
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}> git stash</span>.
      </div>
    </div>
  );
}
