import type { GraphRow } from "../graph/layout";

const ROW_HEIGHT = 30;
const LANE_WIDTH = 16;
const LANE_OFFSET = 10;

function laneX(lane: number) {
  return lane * LANE_WIDTH + LANE_OFFSET;
}

type Props = {
  rows: GraphRow[];
  selected: string | null;
  onSelect: (hash: string) => void;
};

export function CommitGraph({ rows, selected, onSelect }: Props) {
  const maxLane = rows.reduce((m, r) => {
    const edgeMax = r.edges.reduce((e, edge) => Math.max(e, edge.toLane), r.lane);
    return Math.max(m, edgeMax);
  }, 0);
  const gutter = (maxLane + 1) * LANE_WIDTH + LANE_OFFSET;

  return (
    <div>
      {rows.map((row) => {
        const nodeX = laneX(row.lane);
        const isSel = selected === row.commit.hash;
        return (
          <div
            key={row.commit.hash}
            onClick={() => onSelect(row.commit.hash)}
            style={{
              display: "flex",
              alignItems: "center",
              height: ROW_HEIGHT,
              cursor: "pointer",
              background: isSel ? "var(--bg-elevated)" : "transparent",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <svg width={gutter} height={ROW_HEIGHT} style={{ flexShrink: 0 }}>
              {/* Stub from the top of the row down to the node keeps lanes continuous. */}
              <line
                x1={nodeX}
                y1={0}
                x2={nodeX}
                y2={ROW_HEIGHT / 2}
                stroke="var(--border)"
                strokeWidth={2}
              />
              {row.edges.map((edge, i) => (
                <line
                  key={i}
                  x1={laneX(edge.fromLane)}
                  y1={ROW_HEIGHT / 2}
                  x2={laneX(edge.toLane)}
                  y2={ROW_HEIGHT}
                  stroke="var(--border)"
                  strokeWidth={2}
                />
              ))}
              <circle cx={nodeX} cy={ROW_HEIGHT / 2} r={4} fill="var(--accent)" />
            </svg>
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 13,
              }}
            >
              {row.commit.subject}
            </span>
            <span
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                marginLeft: 8,
              }}
            >
              {row.commit.hash.slice(0, 7)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
