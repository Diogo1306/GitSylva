import { useEffect, useState } from "react";
import { SectionTitle, Hint } from "./_shared";
import { Button } from "../../../components/ui/Button";
import { toast } from "../../../state/toastStore";
import {
  useShortcutsStore,
  comboFromEvent,
  formatCombo,
  SHORTCUT_LABELS,
  type ShortcutAction,
} from "../../../state/shortcutsStore";

// Rebindable shortcuts (handoff: click a row → record → key applies, Esc
// cancels; the kbd pulses while recording). Combos always require Ctrl/⌘ so
// plain typing can never fire a git action.

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const ACTIONS: ShortcutAction[] = ["palette", "commit", "push", "pull", "fetch", "branch", "stash"];

const STATIC_GROUPS: { title: string; rows: [string[], string][] }[] = [
  {
    title: "Paleta de comandos",
    rows: [
      [["↑", "↓"], "Navegar nos resultados"],
      [["↵"], "Abrir o item selecionado"],
      [["Esc"], "Fechar a paleta"],
    ],
  },
  { title: "Histórico", rows: [[["↑", "↓"], "Percorrer os commits"]] },
  {
    title: "Diálogos e menus",
    rows: [
      [["↵"], "Confirmar (branch, stash, tag…)"],
      [["Esc"], "Cancelar / fechar"],
    ],
  },
];

function Keys({ keys, pulsing }: { keys: string[]; pulsing?: boolean }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, animation: pulsing ? "recPulse 1s ease-in-out infinite" : "none" }}>
      {keys.map((k, i) => (
        <kbd
          key={i}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, minWidth: 20, textAlign: "center", padding: "2px 7px", borderRadius: 6, background: "var(--btn)", border: `1px solid ${pulsing ? "var(--accent)" : "var(--btnB)"}`, color: "var(--text)", boxShadow: "0 1px 0 var(--border)" }}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

export function Shortcuts() {
  const bindings = useShortcutsStore((s) => s.bindings);
  const setBinding = useShortcutsStore((s) => s.setBinding);
  const reset = useShortcutsStore((s) => s.reset);
  const [recording, setRecording] = useState<ShortcutAction | null>(null);

  // While recording, capture the next combo; Esc cancels. The root attribute
  // tells the global handler to stand down.
  useEffect(() => {
    if (!recording) return;
    const root = document.documentElement;
    root.setAttribute("data-recording-shortcut", "true");
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(null);
        return;
      }
      const combo = comboFromEvent(e);
      if (!combo) return; // needs Ctrl/⌘ — keep waiting
      setBinding(recording, combo);
      toast(`${SHORTCUT_LABELS[recording]} → ${formatCombo(combo, isMac).join(isMac ? "" : "+")}`);
      setRecording(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      root.removeAttribute("data-recording-shortcut");
      window.removeEventListener("keydown", onKey, true);
    };
  }, [recording, setBinding]);

  return (
    <div id="set-atalhos" style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SectionTitle>ATALHOS DE TECLADO</SectionTitle>
        <div style={{ flex: 1 }} />
        <Button size="sm" onClick={() => { reset(); toast("Atalhos repostos"); }}>Repor predefinições</Button>
      </div>
      <Hint>Clica num atalho para o regravar (Esc cancela). Todos exigem {isMac ? "⌘" : "Ctrl"} para nunca dispararem enquanto escreves.</Hint>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 18, border: "1px solid var(--border)", borderRadius: 12, background: "var(--panel)" }}>
        {ACTIONS.map((a) => (
          <div
            key={a}
            onClick={() => setRecording(a)}
            className="gs-row"
            title="Clique para regravar"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 8px", borderRadius: 8, cursor: "pointer" }}
          >
            <div style={{ width: 132, flexShrink: 0 }}>
              {recording === a ? (
                <Keys keys={["…"]} pulsing />
              ) : (
                <Keys keys={formatCombo(bindings[a], isMac)} />
              )}
            </div>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>
              {recording === a ? "Prime a combinação nova… (Esc cancela)" : SHORTCUT_LABELS[a]}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 18, border: "1px solid var(--border)", borderRadius: 12, background: "var(--panel)" }}>
        {STATIC_GROUPS.map((g) => (
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
