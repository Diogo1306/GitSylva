import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: Variant;
  size?: Size;
  /** Dimmed but still clickable — a planned-but-not-final action. */
  soon?: boolean;
  /** Shows a spinning glyph in place of iconLeft. */
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** React 19 ref-as-prop (spread onto the native button). */
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
};

const pad: Record<Size, string> = { sm: "6px 11px", md: "7px 13px", lg: "10px 18px" };

// Filled variants (solid bg) brighten on hover via gs-lift-solid; outline
// variants (secondary/ghost) tint via gs-lift's --hover swap.
const skins: Record<Variant, { background: string; color: string; border: string; filled: boolean }> = {
  primary: { background: "var(--accent)", color: "var(--accentT)", border: "none", filled: true },
  secondary: { background: "var(--btn)", color: "var(--btnT)", border: "1px solid var(--btnB)", filled: false },
  ghost: { background: "transparent", color: "var(--btnT)", border: "none", filled: false },
  danger: { background: "var(--danger)", color: "var(--dangerT)", border: "none", filled: true },
};

// V2 form primitive. Hover lifts −1.5px (+ brighten on filled / --hover tint
// on outline), press scales to .97 — see shell.css .gs-lift-solid/.gs-press-97.
export function Button({ variant = "secondary", size = "md", soon, loading, iconLeft, iconRight, disabled, style, children, ...rest }: Props) {
  const skin = skins[variant];
  return (
    <button
      className={skin.filled ? "gs-lift-solid gs-press-97" : "gs-lift gs-press-97"}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--sp-2)",
        padding: pad[size],
        borderRadius: "var(--r-btn)",
        fontSize: size === "lg" ? "var(--fs-base)" : "var(--fs-btn)",
        fontWeight: "var(--fw-semibold)",
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        opacity: disabled ? 0.55 : soon ? 0.6 : 1,
        background: skin.background,
        color: skin.color,
        border: skin.border,
        ...style,
      }}
      {...rest}
    >
      {loading && <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>⟳</span>}
      {!loading && iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
