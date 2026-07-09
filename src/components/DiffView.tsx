function lineColor(line: string): string {
  if (line.startsWith("@@")) return "var(--text-muted)";
  if (line.startsWith("+") && !line.startsWith("+++")) return "var(--accent)";
  if (line.startsWith("-") && !line.startsWith("---")) return "var(--danger)";
  return "var(--text)";
}

export function DiffView({ patch }: { patch: string }) {
  const lines = patch.replace(/\n$/, "").split("\n");
  return (
    <pre
      style={{
        margin: 0,
        height: "100%",
        overflow: "auto",
        padding: 12,
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        lineHeight: 1.5,
        background: "var(--bg)",
      }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ color: lineColor(line), whiteSpace: "pre" }}>
          {line || " "}
        </div>
      ))}
    </pre>
  );
}
