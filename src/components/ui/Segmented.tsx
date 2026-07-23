import { useRef, type KeyboardEvent } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
}

type Props = {
  options: SegmentedOption[];
  value: string;
  onChange?: (value: string) => void;
  "aria-label"?: string;
};

const ITEM_ATTR = "data-segmented-item";

// Segmented single-choice control (density, language, notification location).
// WAI-ARIA radio pattern: role=radiogroup + role=radio per option, roving
// tabindex, arrow keys move focus AND select in one step (like native radios).
export function Segmented({ options, value, onChange, "aria-label": ariaLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(
    options.findIndex((o) => o.value === value),
    0,
  );

  const focusItem = (index: number) => {
    const nodes = containerRef.current?.querySelectorAll<HTMLButtonElement>(`[${ITEM_ATTR}]`);
    nodes?.[index]?.focus();
  };

  const move = (delta: number) => {
    const n = options.length;
    const next = (selectedIndex + delta + n) % n;
    onChange?.(options[next].value);
    focusItem(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        borderRadius: "var(--r-lg)",
        background: "var(--panel2)",
        border: "1px solid var(--border)",
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i === selectedIndex ? 0 : -1}
            {...{ [ITEM_ATTR]: "" }}
            onClick={() => onChange?.(o.value)}
            className="gs-press-97"
            style={{
              padding: "6px 14px",
              borderRadius: "var(--r-md)",
              fontSize: "var(--fs-sm)",
              fontWeight: "var(--fw-semibold)",
              fontFamily: "inherit",
              border: "none",
              cursor: "pointer",
              background: on ? "var(--win)" : "transparent",
              color: on ? "var(--text)" : "var(--muted)",
              transition: "background var(--dur-micro) var(--ease-std)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
