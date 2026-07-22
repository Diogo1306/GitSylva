import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { activateOnKeyDown } from "./keys";

// Accessible tabs: tablist/tab/tabpanel, roving tabindex, arrows+Home/End move focus, Enter/Space commits (manual activation).

export type TabItem = { id: string; label: ReactNode; disabled?: boolean };

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
};

export function Tabs({ items, activeId, onChange, ariaLabel }: TabsProps) {
  const [focusedId, setFocusedId] = useState(activeId);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const enabledIds = items.filter((i) => !i.disabled).map((i) => i.id);

  const focusId = (id: string | undefined) => {
    if (id) refs.current[id]?.focus();
  };

  const move = (delta: number) => {
    if (enabledIds.length === 0) return;
    const from = enabledIds.indexOf(focusedId);
    const base = from === -1 ? 0 : from;
    focusId(enabledIds[(base + delta + enabledIds.length) % enabledIds.length]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        move(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        focusId(enabledIds[0]);
        break;
      case "End":
        e.preventDefault();
        focusId(enabledIds[enabledIds.length - 1]);
        break;
      case "Enter":
      case " ":
        // Commit the focused tab (manual activation).
        activateOnKeyDown(e);
        break;
    }
  };

  return (
    <div role="tablist" aria-label={ariaLabel} style={{ display: "flex", gap: "var(--sp-1)" }}>
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[item.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`tabpanel-${item.id}`}
            disabled={item.disabled}
            tabIndex={item.id === focusedId ? 0 : -1}
            onFocus={() => setFocusedId(item.id)}
            onClick={() => !item.disabled && onChange(item.id)}
            onKeyDown={onKeyDown}
            className="gs-lift"
            style={{
              padding: "var(--sp-3) var(--sp-6)",
              borderRadius: "var(--r-btn)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-semibold)",
              fontFamily: "inherit",
              cursor: item.disabled ? "default" : "pointer",
              border: "none",
              background: selected ? "var(--sel)" : "transparent",
              color: item.disabled ? "var(--muted)" : "var(--text)",
              opacity: item.disabled ? 0.5 : 1,
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, activeId, children }: { id: string; activeId: string; children: ReactNode }) {
  if (id !== activeId) return null;
  // No inline outline:none — the focusable panel keeps the shared
  // :focus-visible ring from tokens.css.
  return (
    <div role="tabpanel" id={`tabpanel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0}>
      {children}
    </div>
  );
}
