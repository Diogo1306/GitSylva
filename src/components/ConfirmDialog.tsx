import { Button } from "./Button";

type Props = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center" }}>
      <div style={{ background: "var(--bg-panel)", padding: 20, borderRadius: "var(--radius)", maxWidth: 360 }}>
        <p>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" style={{ background: "var(--danger)", color: "#fff" }} onClick={onConfirm}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
