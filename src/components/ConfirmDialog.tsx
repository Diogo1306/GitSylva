import { Button } from "./ui/Button";

type Props = {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Small confirmation dialog for destructive actions (discard, etc.).
export function ConfirmDialog({ message, confirmLabel = "Descartar", onConfirm, onCancel }: Props) {
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", animation: "fadeIn 0.15s ease both" }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--win)", border: "1px solid var(--border)", boxShadow: "var(--shadow-2)", padding: "var(--sp-5)", borderRadius: "var(--radius)", maxWidth: 380, display: "flex", flexDirection: "column", gap: "var(--sp-4)", animation: "popIn 0.2s cubic-bezier(0.2,0.9,0.3,1) both" }}
      >
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text)" }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button variant="primary" style={{ background: "var(--ddT)", color: "#fff" }} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
