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
  const btn = (glyph: React.ReactNode, onClick: () => void, title: string, close = false) => (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      title={title}
      aria-label={title}
      className={close ? "gs-winclose" : "gs-winbtn"}
      style={{ width: 40, height: 30, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 11, color: "var(--text2)", borderRadius: "var(--r-sm)", border: "none", background: "transparent", padding: 0, fontFamily: "inherit" }}
    >
      {glyph}
    </button>
  );
  return (
    <div style={{ display: "flex", flexShrink: 0, marginLeft: 2 }}>
      {btn("—", () => void winMinimize(), t("shell.win.minimize"))}
      {btn(
        maxed ? "❐" : "▢",
        () => {
          void winToggleMaximize().then(() => winIsMaximized().then(setMaxed));
        },
        maxed ? t("shell.win.restore") : t("shell.win.maximize"),
      )}
      {btn("✕", () => void winClose(), t("common.close"), true)}
    </div>
  );
}
