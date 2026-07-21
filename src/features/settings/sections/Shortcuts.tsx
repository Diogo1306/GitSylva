import { useEffect, useState } from "react";
import { SectionTitle, Hint } from "./_shared";
import { Button } from "../../../components/ui/Button";
import { toast } from "../../../state/toastStore";
import {
  useShortcutsStore,
  comboFromEvent,
  formatCombo,
  shortcutLabel,
  SHORTCUT_ACTIONS,
  type ShortcutAction,
} from "../../../state/shortcutsStore";
import { isMac } from "../../../lib/platform";
import { useT } from "../../../i18n";

// Rebindable shortcuts (handoff: click a row → record → key applies, Esc
// cancels; the kbd pulses while recording). Combos always require Ctrl/⌘ so
// plain typing can never fire a git action.

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
  const t = useT();
  const bindings = useShortcutsStore((s) => s.bindings);
  const setBinding = useShortcutsStore((s) => s.setBinding);
  const reset = useShortcutsStore((s) => s.reset);
  const [recording, setRecording] = useState<ShortcutAction | null>(null);

  const STATIC_GROUPS: { title: string; rows: [string[], string][] }[] = [
    {
      title: t("settings.shortcuts.groupPalette"),
      rows: [
        [["↑", "↓"], t("settings.shortcuts.navigateResults")],
        [["↵"], t("settings.shortcuts.openSelected")],
        [["Esc"], t("settings.shortcuts.closePalette")],
      ],
    },
    { title: t("settings.shortcuts.groupHistory"), rows: [[["↑", "↓"], t("settings.shortcuts.scrollCommits")]] },
    {
      title: t("settings.shortcuts.groupDialogs"),
      rows: [
        [["↵"], t("settings.shortcuts.confirmDialog")],
        [["Esc"], t("settings.shortcuts.cancelClose")],
      ],
    },
  ];

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
      toast(t("settings.shortcuts.rebound", { label: shortcutLabel(recording), combo: formatCombo(combo, isMac).join(isMac ? "" : "+") }));
      setRecording(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      root.removeAttribute("data-recording-shortcut");
      window.removeEventListener("keydown", onKey, true);
    };
  }, [recording, setBinding, t]);

  return (
    <div id="set-atalhos" style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SectionTitle>{t("settings.shortcuts.title")}</SectionTitle>
        <div style={{ flex: 1 }} />
        <Button size="sm" onClick={() => { reset(); toast(t("settings.shortcuts.resetDone")); }}>{t("settings.shortcuts.resetDefaults")}</Button>
      </div>
      <Hint>{t("settings.shortcuts.intro", { mod: isMac ? "⌘" : "Ctrl" })}</Hint>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 18, border: "1px solid var(--border)", borderRadius: 12, background: "var(--panel)" }}>
        {SHORTCUT_ACTIONS.map((a) => (
          <div
            key={a}
            onClick={() => setRecording(a)}
            className="gs-row"
            title={t("settings.shortcuts.clickToRebind")}
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
              {recording === a ? t("settings.shortcuts.pressNewCombo") : shortcutLabel(a)}
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
