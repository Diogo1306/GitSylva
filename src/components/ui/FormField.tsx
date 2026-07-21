import { cloneElement, useId, type CSSProperties, type ReactElement, type ReactNode } from "react";

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
  /**
   * Keep the label in the accessibility tree (still bound via htmlFor/id, still
   * announced by screen readers) but remove it from the visual layout — for
   * designs that convey the field by placeholder/context alone. The wrapper's
   * gap is dropped too so the hidden label leaves zero vertical footprint.
   */
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

const visibleLabel: CSSProperties = { fontSize: 13.5, fontWeight: 600, color: "var(--text)" };

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
