import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "ghost", style, ...rest }: Props) {
  const base = {
    padding: "8px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    font: "inherit",
    cursor: "pointer",
  } as const;
  const skin =
    variant === "primary"
      ? { background: "var(--accent)", color: "#0b1f14", border: "none" }
      : { background: "var(--bg-elevated)", color: "var(--text)" };
  return <button style={{ ...base, ...skin, ...style }} {...rest} />;
}