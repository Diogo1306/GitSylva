import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { activateOnKeyDown } from "./keys";

// Accessible toolbar: role="toolbar" with real <button> children and roving
// tabindex arrow navigation (WAI-ARIA toolbar pattern). Only ToolbarButton
// children take part in roving; any other child (dividers, spacers) renders
// untouched.

const TOOLBAR_ITEM = "data-toolbar-item";

type ToolbarProps = {
  children: ReactNode;
  ariaLabel?: string;
  orientation?: "horizontal" | "vertical";
  style?: CSSProperties;
};

const isToolbarButton = (c: ReactNode): c is ReactElement<ButtonHTMLAttributes<HTMLButtonElement>> =>
  isValidElement(c) && c.type === ToolbarButton;

export function Toolbar({ children, ariaLabel, orientation = "horizontal", style }: ToolbarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Roving tabindex tracks only the real ToolbarButtons; any other child
  // (dividers, spacers) renders untouched.
  const childArray = Children.toArray(children);
  const buttons = childArray.filter(isToolbarButton);
  const firstEnabled = buttons.findIndex((c) => !c.props.disabled);
  const [activeIndex, setActiveIndex] = useState(Math.max(firstEnabled, 0));

  const nextKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
  const prevKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";

  const focusItem = (index: number) => {
    const nodes = containerRef.current?.querySelectorAll<HTMLButtonElement>(`[${TOOLBAR_ITEM}]`);
    nodes?.[index]?.focus();
  };

  // A disabled button can never hold focus, so roving tabindex — both the
  // initial stop above and arrow-key movement here — always lands on an
  // enabled one.
  const step = (from: number, delta: number) => {
    const n = buttons.length;
    for (let i = 0; i < n; i++) {
      const candidate = (from + delta * (i + 1) + n * n) % n;
      if (!buttons[candidate].props.disabled) return candidate;
    }
    return from;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = buttons.length;
    if (n === 0) return;
    let next: number | null = null;
    if (e.key === nextKey) next = step(activeIndex, 1);
    else if (e.key === prevKey) next = step(activeIndex, -1);
    else if (e.key === "Home") next = buttons.findIndex((c) => !c.props.disabled);
    else if (e.key === "End") next = buttons.map((c) => !c.props.disabled).lastIndexOf(true);
    if (next === null || next < 0) return;
    e.preventDefault();
    setActiveIndex(next);
    focusItem(next);
  };

  const rendered = childArray.map((child, i) => {
    if (!isToolbarButton(child)) return child;
    // Same element references as childArray, so indexOf gives its button slot.
    const idx = buttons.indexOf(child);
    return cloneElement(child, {
      key: child.key ?? i,
      tabIndex: idx === activeIndex ? 0 : -1,
      [TOOLBAR_ITEM]: "",
      onFocus: (e: FocusEvent<HTMLButtonElement>) => {
        if (!child.props.disabled) setActiveIndex(idx);
        child.props.onFocus?.(e);
      },
    } as Partial<ButtonHTMLAttributes<HTMLButtonElement>>);
  });

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-label={ariaLabel}
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      onKeyDown={onKeyDown}
      style={{ display: "flex", flexDirection: orientation === "vertical" ? "column" : "row", gap: "var(--sp-1)", ...style }}
    >
      {rendered}
    </div>
  );
}

export function ToolbarButton({ onClick, disabled, children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="gs-lift gs-press"
      onClick={onClick}
      onKeyDown={(e) => !disabled && activateOnKeyDown(e)}
      disabled={disabled}
      style={{
        display: "grid",
        placeItems: "center",
        width: 30,
        height: 30,
        borderRadius: "var(--radius-sm)",
        background: "transparent",
        border: "none",
        color: "var(--btnT)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
