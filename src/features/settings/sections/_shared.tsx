import type { ReactNode } from "react";
import { useT } from "../../../i18n";
import { Card } from "../../../components/ui/Card";
import { Toggle } from "../../../components/ui/misc";

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: "var(--fw-bold)", letterSpacing: "1.4px", color: "var(--muted)" }}>{children}</div>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: "var(--fs-base)", fontWeight: "var(--fw-semibold)" }}>{children}</div>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{children}</div>;
}

export function StubSection({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  const t = useT();
  return (
    <div id={id} style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SectionTitle>{title}</SectionTitle>
        <span className="gs-soon">{t("common.soon")}</span>
      </div>
      <Card pad={16} style={{ border: "1px dashed var(--btnB)", color: "var(--muted)", fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>{children}</Card>
    </div>
  );
}

// Row shared by every on/off preference in Settings (anims, confirm-discard,
// notification gates): label + optional hint, real Toggle button on the right.
export function ToggleRow({ label, hint, on, onToggle }: { label: string; hint?: ReactNode; on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)", padding: "11px 4px", cursor: "pointer", borderBottom: "1px solid var(--bsoft)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--fs-base)", fontWeight: "var(--fw-medium)" }}>{label}</div>
        {hint && <Hint>{hint}</Hint>}
      </div>
      <Toggle on={on} aria-label={label} />
    </div>
  );
}
