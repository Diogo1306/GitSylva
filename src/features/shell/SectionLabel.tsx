// Uppercase sidebar section header (V2 type scale). `action` renders a
// trailing control (e.g. the "+" new-branch button) on the same row.
export function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 var(--sp-4) var(--sp-2)" }}>
      <div style={{ fontSize: "var(--fs-label)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-label)", color: "var(--muted)", flex: 1 }}>
        {children}
      </div>
      {action}
    </div>
  );
}
