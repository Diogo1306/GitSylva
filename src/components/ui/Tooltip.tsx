import { cloneElement, useId, useState, type FocusEvent, type MouseEvent, type ReactElement, type ReactNode } from "react";

// Custom tooltip: shows on hover AND keyboard focus (native `title` only fires on hover). Optional shortcut-hint slot.

type TriggerProps = {
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
  "aria-describedby"?: string;
};

type TooltipProps = {
  content: ReactNode;
  shortcut?: string;
  children: ReactElement<TriggerProps>;
};

export function Tooltip({ content, shortcut, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  const trigger = cloneElement(children, {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      children.props.onMouseEnter?.(e);
      setVisible(true);
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      children.props.onMouseLeave?.(e);
      setVisible(false);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      children.props.onFocus?.(e);
      setVisible(true);
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      children.props.onBlur?.(e);
      setVisible(false);
    },
    "aria-describedby": visible ? id : children.props["aria-describedby"],
  });

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      {trigger}
      {visible && (
        <span
          role="tooltip"
          id={id}
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-2)",
            background: "var(--win)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-btn)",
            padding: "5px 9px",
            fontSize: "var(--fs-2xs)",
            whiteSpace: "nowrap",
            boxShadow: "var(--shadow)",
            zIndex: 80,
            pointerEvents: "none",
          }}
        >
          {content}
          {shortcut && (
            <kbd
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                padding: "1px 5px",
                borderRadius: 4,
                background: "var(--btn)",
                border: "1px solid var(--btnB)",
                color: "var(--muted)",
              }}
            >
              {shortcut}
            </kbd>
          )}
        </span>
      )}
    </span>
  );
}
