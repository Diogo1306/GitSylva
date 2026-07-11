import { SectionTitle, Hint } from "./_shared";

// Reference list of the shortcuts that are actually wired today. Rewritable
// bindings come later; for now this is a read-only cheat-sheet so people can
// discover what already works.
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? "⌘" : "Ctrl";

const GROUPS: { title: string; rows: [string[], string][] }[] = [
  {
    title: "Global",
    rows: [[[mod, "K"], "Abrir a paleta de comandos"]],
  },
  {
    title: "Paleta de comandos",
    rows: [
      [["↑", "↓"], "Navegar nos resultados"],
      [["↵"], "Abrir o item selecionado"],
      [["Esc"], "Fechar a paleta"],
    ],
  },
  {
    title: "Histórico",
    rows: [[["↑", "↓"], "Percorrer os commits"]],
  },
  {
    title: "Diálogos e menus",
    rows: [
      [["↵"], "Confirmar (branch, stash, tag…)"],
      [["Esc"], "Cancelar / fechar"],
    ],
  },
];

function Keys({ keys }: { keys: string[] }) {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {keys.map((k) => (
        <kbd
          key={k}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, minWidth: 20, textAlign: "center", padding: "2px 7px", borderRadius: 6, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--text)", boxShadow: "0 1px 0 var(--border)" }}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function Shortcuts() {
  return (
    <div id="set-atalhos" style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SectionTitle>ATALHOS DE TECLADO</SectionTitle>
        <span className="gs-soon">Regravar em breve</span>
      </div>
      <Hint>Estes atalhos já funcionam. Poder redefini-los chega numa próxima fase.</Hint>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 18, border: "1px solid var(--border)", borderRadius: 12, background: "var(--panel)" }}>
        {GROUPS.map((g) => (
          <div key={g.title} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: "var(--muted)", textTransform: "uppercase" }}>{g.title}</div>
            {g.rows.map(([keys, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 92, flexShrink: 0 }}><Keys keys={keys} /></div>
                <span style={{ fontSize: 13, color: "var(--text2)" }}>{label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
