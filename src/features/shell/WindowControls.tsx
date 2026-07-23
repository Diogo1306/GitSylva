import { useEffect, useState } from "react";
import { winMinimize, winToggleMaximize, winClose, winIsMaximized } from "../../lib/window";
import { activateOnKeyDown } from "../../components/ui/keys";
import { useT } from "../../i18n";

// macOS: traffic lights on the left. Minimize is the plain native one — the
// handoff's mac-style shrink animation was cut on user request (R5.2).
export function TrafficLights() {
  const t = useT();
  const light = (bg: string, glyph: string, onClick: () => void, title: string) => (
    <button
      type="button"
      className="gs-light"
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      title={title}
      aria-label={title}
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: bg,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        border: "none",
        padding: 0,
        fontFamily: "inherit",
      }}
    >
      <span>{glyph}</span>
    </button>
  );
  return (
    <div className="gs-lights" style={{ display: "flex", gap: "var(--sp-3)", flexShrink: 0 }}>
      {light("#FF5F57", "✕", () => void winClose(), t("common.close"))}
      {light("#FEBC2E", "–", () => void winMinimize(), t("shell.win.minimize"))}
      {light("#28C840", "+", () => void winToggleMaximize(), t("shell.win.maximize"))}
    </div>
  );
}

// Windows: min / max-restore / close on the RIGHT; close hover turns red
// (#E81123) per the interaction spec. Exported: the no-repo picker shell and
// other bare screens need the same controls.
export function WinControls() {
  const t = useT();
  const [maxed, setMaxed] = useState(false);
  useEffect(() => {
    void winIsMaximized().then(setMaxed);
  }, []);
  // Full-height 46px cells with clean SVG glyphs (currentColor adapts per theme),
  // matching the V2 titlebar; close hover goes red via .gs-winclose.
  const btn = (glyph: React.ReactNode, onClick: () => void, title: string, close = false) => (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      title={title}
      aria-label={title}
      className={close ? "gs-winclose" : "gs-winbtn"}
      style={{ width: 46, alignSelf: "stretch", display: "grid", placeItems: "center", cursor: "pointer", color: "var(--text2)", border: "none", background: "transparent", padding: 0, fontFamily: "inherit" }}
    >
      {glyph}
    </button>
  );
  return (
    <div style={{ display: "flex", alignSelf: "stretch", flexShrink: 0 }}>
      {btn(<svg width={11} height={11} viewBox="0 0 11 11" aria-hidden><path d="M1 5.5 H10" stroke="currentColor" strokeWidth={1} /></svg>, () => void winMinimize(), t("shell.win.minimize"))}
      {btn(
        maxed ? (
          <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden><rect x={2.5} y={0.5} width={8.5} height={8.5} rx={0.7} fill="none" stroke="currentColor" strokeWidth={1} /><rect x={0.5} y={2.5} width={8.5} height={8.5} rx={0.7} fill="var(--panel)" stroke="currentColor" strokeWidth={1} /></svg>
        ) : (
          <svg width={11} height={11} viewBox="0 0 11 11" aria-hidden><rect x={1} y={1} width={9} height={9} rx={0.7} fill="none" stroke="currentColor" strokeWidth={1} /></svg>
        ),
        () => {
          void winToggleMaximize().then(() => winIsMaximized().then(setMaxed));
        },
        maxed ? t("shell.win.restore") : t("shell.win.maximize"),
      )}
      {btn(<svg width={11} height={11} viewBox="0 0 11 11" aria-hidden><path d="M1 1 L10 10 M10 1 L1 10" stroke="currentColor" strokeWidth={1.1} /></svg>, () => void winClose(), t("common.close"), true)}
    </div>
  );
}
