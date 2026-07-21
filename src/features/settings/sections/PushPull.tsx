import { useThemeStore } from "../../../state/themeStore";
import { PULL_MODES as MODES } from "../../../lib/pullModes";
import { SectionTitle, FieldLabel, Hint } from "./_shared";

export function PushPull() {
  const pullMode = useThemeStore((s) => s.pullMode);
  const save = useThemeStore((s) => s.savePrefs);
  const active = MODES.find((m) => m.key === pullMode) ?? MODES[0];

  return (
    <div id="set-pushpull" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <SectionTitle>PUSH &amp; PULL</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Comportamento do pull</FieldLabel>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
          {MODES.map((m) => (
            <div
              key={m.key}
              onClick={() => save({ pullMode: m.key })}
              style={{ padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: pullMode === m.key ? "var(--win)" : "transparent", color: pullMode === m.key ? "var(--text)" : "var(--muted)" }}
            >
              {m.name}
            </div>
          ))}
        </div>
        <Hint>{active.hint}</Hint>
      </div>
    </div>
  );
}
