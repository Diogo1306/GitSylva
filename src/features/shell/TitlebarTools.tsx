import { toast } from "../../state/toastStore";
import { Tooltip } from "../../components/ui/Tooltip";
import { activateOnKeyDown } from "../../components/ui/keys";
import { useT } from "../../i18n";

function Tool({
  onClick,
  title,
  stub,
  children,
  bareLabel,
  ...rest
}: {
  onClick?: () => void;
  title: string;
  stub?: boolean;
  children: React.ReactNode;
  // Task 14: when wrapped in the custom Tooltip primitive (which already
  // surfaces the label on hover/focus), skip the native title attribute so
  // mouse users don't get two overlapping tooltips.
  bareLabel?: boolean;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={stub ? undefined : onClick}
      onKeyDown={(e) => !stub && activateOnKeyDown(e)}
      disabled={stub}
      title={stub ? t("shell.soonTooltip", { label: title }) : bareLabel ? undefined : title}
      aria-label={title}
      className={stub ? "gs-stub" : "gs-lift gs-press-97"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        padding: "var(--sp-2) 11px",
        borderRadius: "var(--r-btn)",
        background: "var(--btn)",
        border: "1px solid var(--btnB)",
        fontSize: "var(--fs-btn)",
        color: "var(--btnT)",
        cursor: stub ? "default" : "pointer",
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

export function TitlebarTools({
  fetchPending,
  onFetch,
  fetchHint,
  unstaged,
  onDiscardClick,
  paletteHint,
  onOpenPalette,
  onOpenSettings,
}: {
  fetchPending: boolean;
  onFetch: () => void;
  fetchHint: string;
  unstaged: number;
  onDiscardClick: () => void;
  paletteHint: string;
  onOpenPalette: () => void;
  onOpenSettings: () => void;
}) {
  const t = useT();
  return (
    <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexShrink: 0 }}>
      <Tooltip content={t("shell.fetch.tooltip")} shortcut={fetchHint}>
        <Tool onClick={onFetch} title={t("shell.fetch.tooltip")} bareLabel>
          <span style={{ fontSize: 14, lineHeight: 1, display: "inline-block", animation: fetchPending ? "spin 0.8s linear infinite" : "none" }}>⟳</span>
          {fetchPending ? t("shell.fetch.fetching") : "Fetch"}
        </Tool>
      </Tooltip>
      <Tool onClick={onDiscardClick} title={t("shell.discard.tooltip")}>
        {t("shell.discard.button")}
        {unstaged > 0 && (
          <span
            style={{
              background: "var(--stMB)",
              color: "var(--stMT)",
              borderRadius: "var(--r-pill)",
              fontSize: "var(--fs-label)",
              fontWeight: "var(--fw-bold)",
              padding: "1px 6px",
            }}
          >
            {unstaged}
          </span>
        )}
      </Tool>
      <button
        type="button"
        onClick={() => toast(t("shell.terminal.soon"))}
        onKeyDown={activateOnKeyDown}
        className="gs-lift gs-press-97"
        title={t("shell.terminal.open")}
        aria-label={t("shell.terminal.open")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: "var(--r-btn)",
          background: "var(--btn)",
          border: "1px solid var(--btnB)",
          color: "var(--btnT)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          cursor: "pointer",
          padding: 0,
        }}
      >
        &gt;_
      </button>
      <Tooltip content={t("shell.search.label")} shortcut={paletteHint}>
        <button
          type="button"
          onClick={onOpenPalette}
          onKeyDown={activateOnKeyDown}
          className="gs-lift gs-press-97"
          aria-label={t("shell.search.aria", { hint: paletteHint })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-2)",
            padding: "var(--sp-2) 11px",
            borderRadius: "var(--r-btn)",
            background: "var(--input)",
            border: "1px solid var(--btnB)",
            fontSize: "var(--fs-btn)",
            color: "var(--muted)",
            whiteSpace: "nowrap",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {t("shell.search.label")}
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, border: "1px solid var(--btnB)", borderRadius: "var(--r-xs)", padding: "1px 4px" }}>
            {paletteHint}
          </span>
        </button>
      </Tooltip>
      {/* Only Definições entry point left after the Sidebar dedup; 32px hit area. */}
      <Tooltip content={t("shell.nav.settings")}>
        <button
          type="button"
          onClick={onOpenSettings}
          onKeyDown={activateOnKeyDown}
          aria-label={t("shell.nav.settings")}
          className="gs-lift gs-press-97"
          style={{
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
          }}
        >
          <span style={{ width: 11, height: 11, borderRadius: "50%", border: "2.5px dotted currentColor", boxSizing: "border-box" }} />
        </button>
      </Tooltip>
    </div>
  );
}
