import type { ReactNode } from "react";
import { activateOnKeyDown } from "./keys";

// Small shared primitives: pill Chip, count Badge, IconButton, Toggle, labels.

export function Chip({ children, bg = "var(--badge)", color = "var(--badgeT)", border = "transparent", mono = true }: { children: ReactNode; bg?: string; color?: string; border?: string; mono?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: mono ? "var(--font-mono)" : "var(--font)",
        fontSize: 10.5,
        padding: "2px 8px",
        borderRadius: "var(--r-pill)",
        whiteSpace: "nowrap",
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {children}
    </span>
  );
}

export function Badge({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: accent ? "var(--accent)" : "var(--badge)",
        color: accent ? "var(--accentT)" : "var(--badgeT)",
        borderRadius: "var(--r-pill)",
        fontSize: "var(--fs-2xs)",
        fontWeight: "var(--fw-bold)",
        padding: "1px 7px",
      }}
    >
      {children}
    </span>
  );
}

export function IconButton({ onClick, title, size = 30, active, children, disabled }: { onClick?: () => void; title?: string; size?: number; active?: boolean; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      title={title}
      aria-label={title}
      disabled={disabled}
      className="gs-lift gs-press-97"
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        boxSizing: "border-box",
        borderRadius: "var(--r-btn)",
        background: active ? "var(--sel)" : "var(--btn)",
        border: "1px solid var(--btnB)",
        color: "var(--btnT)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        fontFamily: "inherit",
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onClick, disabled, "aria-label": ariaLabel }: { on: boolean; onClick?: () => void; disabled?: boolean; "aria-label"?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      disabled={disabled}
      style={{
        width: "var(--w-toggle)",
        height: "var(--h-toggle)",
        borderRadius: "var(--r-pill)",
        background: on ? "var(--accent)" : "var(--btnB)",
        position: "relative",
        flexShrink: 0,
        transition: "background var(--dur-ui) var(--ease-std)",
        border: "none",
        padding: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {/* Themed knob with a hairline border so it stays visible on light tracks. */}
      <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "var(--win)", border: "1px solid var(--border)", boxSizing: "border-box", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left var(--dur-ui) var(--ease-std)" }} />
    </button>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-label)", color: "var(--muted)", padding: "0 var(--sp-4) var(--sp-2)" }}>
      {children}
    </div>
  );
}

export function CheckSquare({ on }: { on: boolean }) {
  return (
    <span style={{ width: 17, height: 17, borderRadius: "var(--r-xs)", border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: on ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 11, fontWeight: "var(--fw-bold)" }}>
      {on ? "✓" : ""}
    </span>
  );
}
