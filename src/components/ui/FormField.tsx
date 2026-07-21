import { cloneElement, useId, type ReactElement, type ReactNode } from "react";

// Wraps a labelled control: a real <label htmlFor> bound to the control's id
// (generated with useId when the caller doesn't pass one), plus an optional
// hint or error wired onto the control via aria-describedby. An error also
// sets aria-invalid and is announced via role="alert".

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

type FormFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  children: ReactElement<ControlProps>;
};

export function FormField({ label, hint, error, id, children }: FormFieldProps) {
  const autoId = useId();
  const controlId = id ?? children.props.id ?? autoId;
  // Only one of hint/error ever renders (error wins), so aria-describedby
  // must never point at an id that isn't actually in the DOM.
  const hintId = hint && !error ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const control = cloneElement(children, {
    id: controlId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={controlId} style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
        {label}
      </label>
      {control}
      {error ? (
        <span id={errorId} role="alert" style={{ fontSize: 12, color: "var(--ddT)" }}>
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} style={{ fontSize: 12, color: "var(--muted)" }}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}
