import { Button } from "./Button";

export function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", gap: 16 }}>
      <div style={{ fontSize: 28, fontWeight: 600 }}>GitSylva</div>
      <div style={{ color: "var(--text-muted)" }}>Open a repository to start</div>
      <Button variant="primary" onClick={onOpen}>Open folder</Button>
    </div>
  );
}
