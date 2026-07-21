import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

// Accessible tabs: role="tablist"/"tab"/"tabpanel", roving tabindex, Left/Right
// + Home/End move focus between tabs, Enter/Space commits the selection
// (manual activation — arrow keys alone never change what's shown).

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
        // preventDefault cancels the button's own native Enter/Space click so
        // the manual click() below is the only one that ever fires.
        e.preventDefault();
        e.currentTarget.click();
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
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 600,
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
  return (
    <div role="tabpanel" id={`tabpanel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} style={{ outline: "none" }}>
      {children}
    </div>
  );
}
