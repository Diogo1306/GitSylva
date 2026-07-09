type Props = {
  path: string;
  status: string;
  selected: boolean;
  onSelect: () => void;
  action?: React.ReactNode;
};

export function FileRow({ path, status, selected, onSelect, action }: Props) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: "var(--radius-sm)",
        background: selected ? "var(--bg-elevated)" : "transparent",
        cursor: "pointer",
      }}
    >
      <span style={{ width: 16, color: "var(--text-muted)" }}>{status}</span>
      <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13 }}>{path}</span>
      {action}
    </div>
  );
}
