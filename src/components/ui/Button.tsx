import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: Variant;
  size?: Size;
  /** Dimmed but still clickable — a planned-but-not-final action. */
  soon?: boolean;
  /** React 19 ref-as-prop (spread onto the native button). */
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

const pad: Record<Size, string> = { sm: "6px 11px", md: "9px 16px" };
const font: Record<Size, number> = { sm: 12.5, md: 13 };

// Tokenized button used across the app. Interaction (hover/press) comes from the
// shared shell.css classes so it stays consistent with the rest of the chrome.
export function Button({ variant = "ghost", size = "md", soon, style, children, ...rest }: Props) {
  const skin =
    variant === "primary"
      ? { background: "var(--accent)", color: "var(--accentT)", border: "none" }
      : variant === "danger"
        ? { background: "var(--btn)", color: "var(--ddT)", border: "1px solid var(--btnB)" }
        : { background: "var(--btn)", color: "var(--btnT)", border: "1px solid var(--btnB)" };
  return (
    <button
      className="gs-lift gs-press"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        padding: pad[size],
        borderRadius: "var(--radius-sm)",
        fontSize: font[size],
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
        whiteSpace: "nowrap",
        opacity: soon ? 0.6 : 1,
        ...skin,
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
