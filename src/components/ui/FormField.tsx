import { cloneElement, useId, type CSSProperties, type ReactElement, type ReactNode } from "react";

// Wraps a labelled control: <label htmlFor> bound to the control's id, optional hint/error via aria-describedby (error sets aria-invalid + role="alert").

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
  /** Keeps the label bound + screen-reader-visible but removes its layout footprint (placeholder/context conveys the field instead). */
  hideLabel?: boolean;
  children: ReactElement<ControlProps>;
};

// True visually-hidden: zero layout footprint, still read by assistive tech.
const srOnlyLabel: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const visibleLabel: CSSProperties = { fontSize: "var(--fs-base)", fontWeight: "var(--fw-semibold)", color: "var(--text)" };

export function FormField({ label, hint, error, id, hideLabel, children }: FormFieldProps) {
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
    // With a hidden label the label is out of flow, so the column gap would
    // otherwise insert 6px above the control for a zero-height item — drop it.
    <div style={{ display: "flex", flexDirection: "column", gap: hideLabel ? 0 : 6 }}>
      <label htmlFor={controlId} style={hideLabel ? srOnlyLabel : visibleLabel}>
        {label}
      </label>
      {control}
      {error ? (
        <span id={errorId} role="alert" style={{ fontSize: "var(--fs-xs)", color: "var(--ddT)" }}>
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}
