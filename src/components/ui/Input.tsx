import type { FocusEvent, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const base = {
  background: "var(--input)",
  border: "1px solid var(--btnB)",
  borderRadius: "var(--r-lg)",
  padding: "9px 12px",
  fontSize: "var(--fs-sm)",
  color: "var(--text)",
  // No inline outline: the shared :focus-visible ring in tokens.css must
  // win, otherwise every consumer of Input/Textarea loses keyboard focus
  // visibility. Focus is still signalled visually via the border below.
  fontFamily: "var(--font)",
  boxSizing: "border-box" as const,
  width: "100%",
  transition: "border-color var(--dur-micro) var(--ease-std)",
};

// V2 focus affordance: border turns accent-colored, layered on top of (not
// instead of) the shared :focus-visible ring.
function onFocus(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "var(--accent)";
}
function onBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = "var(--btnB)";
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { mono?: boolean };

export function Input({ mono, style, onFocus: onFocusProp, onBlur: onBlurProp, ...rest }: InputProps) {
  return (
    <input
      style={{ ...base, ...(mono ? { fontFamily: "var(--font-mono)" } : {}), ...style }}
      onFocus={(e) => {
        onFocus(e);
        onFocusProp?.(e);
      }}
      onBlur={(e) => {
        onBlur(e);
        onBlurProp?.(e);
      }}
      {...rest}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ style, onFocus: onFocusProp, onBlur: onBlurProp, ...rest }: TextareaProps) {
  return (
    <textarea
      style={{ ...base, resize: "none", ...style }}
      onFocus={(e) => {
        onFocus(e);
        onFocusProp?.(e);
      }}
      onBlur={(e) => {
        onBlur(e);
        onBlurProp?.(e);
      }}
      {...rest}
    />
  );
}
