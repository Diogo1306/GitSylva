import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from "react";

// Accessible replacement for `<div onClick>` rows: a real focusable element
// with role="button" (a plain action row) or role="option" (inside a
// role="listbox" container), Enter/Space activation and a visible focus ring
// via the shared :focus-visible rule in tokens.css.

type Role = "button" | "option";

type SelectableRowProps = {
  /** True when this row is the current selection (history row, active branch, chosen card…). */
  selected?: boolean;
  onSelect: () => void;
  disabled?: boolean;
  /** "option" only makes sense inside a role="listbox" ancestor. */
  role?: Role;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "role" | "onSelect" | "className" | "style" | "children" | "onClick" | "onKeyDown" | "tabIndex">;

function Base({ selected, onSelect, disabled, role = "button", children, style, className, ...rest }: SelectableRowProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      // preventDefault cancels the browser's own Enter/Space activation so the
      // manual click() below is the only one that ever fires.
      e.preventDefault();
      e.currentTarget.click();
    }
  };
  return (
    <div
      role={role}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-selected={role === "option" ? !!selected : undefined}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={onKeyDown}
      className={["gs-row", className].filter(Boolean).join(" ")}
      style={{
        cursor: disabled ? "default" : "pointer",
        outline: "none",
        opacity: disabled ? 0.5 : 1,
        background: selected ? "var(--sel)" : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SelectableRow(props: SelectableRowProps) {
  return (
    <Base
      {...props}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        padding: "7px 10px",
        borderRadius: "var(--radius-sm)",
        fontSize: 13.5,
        ...props.style,
      }}
    />
  );
}

/** Card variant for grid-of-choices UI (onboarding theme/layout pickers, etc). */
export function SelectableCard(props: SelectableRowProps) {
  return (
    <Base
      {...props}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 14,
        border: `2px solid ${props.selected ? "var(--accent)" : "var(--btnB)"}`,
        borderRadius: "var(--radius)",
        background: "var(--win)",
        ...props.style,
      }}
    />
  );
}
