// Renders a unified patch with the design's diff colours: additions green,
// deletions red, hunk headers tinted, file/meta lines muted.

const mono = "'JetBrains Mono', monospace";

function classify(line: string): { bg: string; color: string } {
  if (line.startsWith("@@")) return { bg: "var(--dhB)", color: "var(--dhT)" };
  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff ") || line.startsWith("index ")) {
    return { bg: "transparent", color: "var(--dcT)" };
  }
  if (line.startsWith("+")) return { bg: "var(--daB)", color: "var(--daT)" };
  if (line.startsWith("-")) return { bg: "var(--ddB)", color: "var(--ddT)" };
  return { bg: "transparent", color: "var(--text2)" };
}

export function DiffLines({ patch, fontSize = 11.5 }: { patch: string; fontSize?: number }) {
  const lines = patch.replace(/\n$/, "").split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const { bg, color } = classify(line);
        return (
          <div
            key={i}
            style={{
              fontFamily: mono,
              fontSize,
              lineHeight: 1.75,
              padding: "0 14px",
              whiteSpace: "pre",
              background: bg,
              color,
            }}
          >
            {line || " "}
          </div>
        );
      })}
    </>
  );
}
