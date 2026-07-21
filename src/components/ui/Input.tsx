import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const base = {
  background: "var(--input)",
  border: "1px solid var(--btnB)",
  borderRadius: "var(--radius-sm)",
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--text)",
  // No inline outline: the shared :focus-visible ring in tokens.css must
  // win, otherwise every consumer of Input/Textarea loses keyboard focus
  // visibility.
  fontFamily: "var(--font)",
  boxSizing: "border-box" as const,
};

type InputProps = InputHTMLAttributes<HTMLInputElement> & { mono?: boolean };

export function Input({ mono, style, ...rest }: InputProps) {
  return <input style={{ ...base, ...(mono ? { fontFamily: "var(--font-mono)" } : {}), ...style }} {...rest} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ style, ...rest }: TextareaProps) {
  return <textarea style={{ ...base, resize: "none", ...style }} {...rest} />;
}
