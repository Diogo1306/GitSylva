import type { CSSProperties, HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { activateOnKeyDown } from "./keys";

// Accessible replacement for `<div onClick>` rows: role="button" or role="option" (inside a listbox), Enter/Space activation, shared focus ring.

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
    if (!disabled) activateOnKeyDown(e);
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
        // No inline outline: the shared :focus-visible rule in tokens.css must
        // win, otherwise this widely-reused row has no keyboard focus ring.
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
        borderRadius: "var(--r-btn)",
        fontSize: "var(--fs-base)",
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
        gap: "var(--sp-2)",
        padding: "var(--sp-6)",
        border: `2px solid ${props.selected ? "var(--accent)" : "var(--btnB)"}`,
        borderRadius: "var(--r-win)",
        background: "var(--win)",
        ...props.style,
      }}
    />
  );
}
