import { useEffect, useState } from "react";
import { toast } from "../../state/toastStore";
import { Tooltip } from "../../components/ui/Tooltip";
import { Badge } from "../../components/ui/misc";
import { activateOnKeyDown } from "../../components/ui/keys";
import { useT } from "../../i18n";

function Tool({
  onClick,
  title,
  children,
  bareLabel,
  input,
  ...rest
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
  bareLabel?: boolean;
  // Search uses the input background to read as a field, per the V2 titlebar.
  input?: boolean;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      title={bareLabel ? undefined : title}
      aria-label={title}
      className="gs-lift gs-press-97"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        padding: "var(--sp-2) 11px",
        borderRadius: "var(--r-btn)",
        background: input ? "var(--input)" : "var(--btn)",
        border: "1px solid var(--btnB)",
        fontSize: "var(--fs-btn)",
        color: input ? "var(--muted)" : "var(--btnT)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        fontFamily: "inherit",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

const iconBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: "var(--r-btn)",
  background: "var(--btn)",
  border: "1px solid var(--btnB)",
  color: "var(--btnT)",
  cursor: "pointer",
  padding: 0,
  fontFamily: "inherit",
};

const syncMenuItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-2)",
  height: 34,
  padding: "0 10px",
  borderRadius: "var(--r-sm)",
  fontSize: "var(--fs-btn)",
  fontWeight: "var(--fw-medium)",
  color: "var(--text)",
  cursor: "pointer",
  boxSizing: "border-box",
};

// < 1100px collapses Pull/Push/Fetch into this single ⇅ Sync button + menu
// (badges move onto the Pull/Push items). A real menu: role, Esc, click-outside.
function SyncMenu({
  fetchPending,
  onFetch,
  fetchHint,
  ahead,
  behind,
  onPull,
  onPush,
}: {
  fetchPending: boolean;
  onFetch: () => void;
  fetchHint: string;
  ahead: number;
  behind: number;
  onPull: () => void;
  onPush: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const syncCount = ahead + behind;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <Tooltip content={t("shell.sync.menu")} shortcut={fetchHint}>
        <Tool onClick={() => setOpen((v) => !v)} title={t("shell.sync.menu")} bareLabel aria-haspopup="menu" aria-expanded={open}>
          ⇅ Sync
          {syncCount > 0 && <Badge>{syncCount}</Badge>}
          <span style={{ color: "var(--muted)", fontSize: 8 }}>▾</span>
        </Tool>
      </Tooltip>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 59 }} />
          <div
            role="menu"
            aria-label={t("shell.sync.menu")}
            style={{
              position: "absolute",
              top: 40,
              right: 0,
              zIndex: 60,
              width: 170,
              background: "var(--win)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-card)",
              boxShadow: "var(--shadow-2)",
              padding: 5,
              display: "flex",
              flexDirection: "column",
              animation: "fadeUp 0.18s ease both",
            }}
          >
            <div role="menuitem" tabIndex={0} className="gs-row" onClick={() => { onFetch(); setOpen(false); }} onKeyDown={activateOnKeyDown} style={syncMenuItem}>
              <span style={{ fontSize: 14, lineHeight: 1, display: "inline-block", animation: fetchPending ? "spin 0.8s linear infinite" : "none" }}>⟳</span>
              {fetchPending ? t("shell.fetch.fetching") : "Fetch"}
            </div>
            <div role="menuitem" tabIndex={0} className="gs-row" onClick={() => { onPull(); setOpen(false); }} onKeyDown={activateOnKeyDown} style={syncMenuItem}>
              ↓ Pull {behind > 0 && <Badge>{behind}</Badge>}
            </div>
            <div role="menuitem" tabIndex={0} className="gs-row" onClick={() => { onPush(); setOpen(false); }} onKeyDown={activateOnKeyDown} style={syncMenuItem}>
              ↑ Push {ahead > 0 && <Badge accent>{ahead}</Badge>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// V2 titlebar tools: sync (pull/push/fetch), search, terminal (stub), settings.
// `compact` (< 1100px, computed by Titlebar) collapses Pull/Push/Fetch into the
// ⇅ Sync menu and turns Search into a bare magnifier icon.
export function TitlebarTools({
  fetchPending,
  onFetch,
  fetchHint,
  ahead,
  behind,
  onPull,
  onPush,
  paletteHint,
  onOpenPalette,
  onOpenSettings,
  compact = false,
}: {
  fetchPending: boolean;
  onFetch: () => void;
  fetchHint: string;
  ahead: number;
  behind: number;
  onPull: () => void;
  onPush: () => void;
  paletteHint: string;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  compact?: boolean;
}) {
  const t = useT();
  return (
    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexShrink: 0 }}>
      {compact ? (
        <SyncMenu fetchPending={fetchPending} onFetch={onFetch} fetchHint={fetchHint} ahead={ahead} behind={behind} onPull={onPull} onPush={onPush} />
      ) : (
        <>
          <Tooltip content={t("shell.pull.title")}>
            <Tool onClick={onPull} title={t("shell.pull.title")} bareLabel>
              ↓ Pull
              {behind > 0 && <Badge>{behind}</Badge>}
            </Tool>
          </Tooltip>
          <Tooltip content={t("shell.push.title")}>
            <Tool onClick={onPush} title={t("shell.push.title")} bareLabel>
              ↑ Push
              {ahead > 0 && <Badge accent>{ahead}</Badge>}
            </Tool>
          </Tooltip>
          <Tooltip content={t("shell.fetch.tooltip")} shortcut={fetchHint}>
            <Tool onClick={onFetch} title={t("shell.fetch.tooltip")} bareLabel>
              <span style={{ fontSize: 14, lineHeight: 1, display: "inline-block", animation: fetchPending ? "spin 0.8s linear infinite" : "none" }}>⟳</span>
              {fetchPending ? t("shell.fetch.fetching") : "Fetch"}
            </Tool>
          </Tooltip>
        </>
      )}
      <Tooltip content={t("shell.search.label")} shortcut={paletteHint}>
        {compact ? (
          <button type="button" onClick={onOpenPalette} onKeyDown={activateOnKeyDown} aria-label={t("shell.search.aria", { hint: paletteHint })} className="gs-lift gs-press-97" style={{ ...iconBtn, background: "var(--input)", color: "var(--muted)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="4.2" /><path d="M9.4 9.4 L12.6 12.6" /></svg>
          </button>
        ) : (
          <Tool onClick={onOpenPalette} title={t("shell.search.aria", { hint: paletteHint })} bareLabel input>
            {t("shell.search.label")}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, border: "1px solid var(--btnB)", borderRadius: "var(--r-xs)", padding: "1px 4px" }}>{paletteHint}</span>
          </Tool>
        )}
      </Tooltip>
      <button type="button" onClick={() => toast(t("shell.terminal.soon"))} onKeyDown={activateOnKeyDown} className="gs-lift gs-press-97" title={t("shell.terminal.open")} aria-label={t("shell.terminal.open")} style={{ ...iconBtn, fontFamily: "var(--font-mono)", fontSize: 11 }}>
        &gt;_
      </button>
      <Tooltip content={t("shell.nav.settings")}>
        <button type="button" onClick={onOpenSettings} onKeyDown={activateOnKeyDown} aria-label={t("shell.nav.settings")} className="gs-lift gs-press-97" style={iconBtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
      </Tooltip>
    </div>
  );
}
