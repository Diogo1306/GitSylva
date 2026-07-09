import { createElement as h, type ReactElement } from "react";
import { useThemeStore } from "../state/themeStore";
import type { GraphCommit } from "../graph/layout";

// The living history graph, ported from the design's buildGraph. Lanes are
// drawn as gently waving "vines"; branches and merges curl in with cubic
// beziers; commit nodes are buttons on the vine; and leaves (or blossoms, or
// palm fronds, or bare nodes) sprout at branch tips according to the tree style.

const LANE_W = 18;
const laneX = (l: number) => 10 + l * LANE_W;

export function CommitGraphSvg({ rows, rowH }: { rows: GraphCommit[]; rowH: number }) {
  const styleKey = useThemeStore((s) => s.treeStyle);
  const els: ReactElement[] = [];

  const vine = (x: number, y1: number, y2: number, seed: number) => {
    let d = `M${x},${y1}`;
    const n = Math.max(1, Math.round((y2 - y1) / rowH));
    const step = (y2 - y1) / n;
    for (let k = 0; k < n; k++) {
      const ya = y1 + step * k;
      const amp = ((k + seed) % 2 === 0 ? 1 : -1) * 2.6;
      d += ` C${x + amp},${ya + step * 0.33} ${x - amp},${ya + step * 0.66} ${x},${ya + step}`;
    }
    return d;
  };

  const pathEl = (key: string, d: string, lane: number, delay: number, w?: number) =>
    h("path", {
      key,
      d,
      fill: "none",
      pathLength: 1,
      style: {
        stroke:
          (styleKey === "tropical" || styleKey === "sakura") && lane === 0
            ? "var(--trunk)"
            : `var(--l${lane})`,
        strokeWidth:
          w ||
          (lane === 0
            ? styleKey === "tropical"
              ? 4.2
              : styleKey === "sakura"
                ? 3.8
                : 3.4
            : styleKey === "tropical"
              ? 2.8
              : styleKey === "sakura"
                ? 2.4
                : 2.2),
        strokeLinecap: "round" as const,
        opacity: 0.9,
        strokeDasharray: 1,
        animation: `vineDraw 0.8s ease-out ${delay}s both`,
      },
    });

  // Edges.
  rows.forEach((c, i) => {
    const x1 = laneX(c.lane);
    const y1 = i * rowH + rowH / 2;
    const delay = Math.min(i * 0.045, 0.6);
    c.parentRows.forEach((p) => {
      const pc = rows[p];
      if (!pc) return;
      const x2 = laneX(pc.lane);
      const y2 = p * rowH + rowH / 2;
      const lane = x1 === x2 ? c.lane : Math.max(c.lane, pc.lane);
      if (x1 === x2) {
        els.push(pathEl(`e${i}-${p}`, vine(x1, y1, y2, i), lane, delay));
      } else if (c.merge) {
        els.push(
          pathEl(
            `e${i}-${p}a`,
            `M${x1},${y1} C${x1 + 4},${y1 + rowH * 0.8} ${x2 - 5},${y1 + rowH * 0.15} ${x2},${y1 + rowH * 0.55} S${x2 - 1.5},${y1 + rowH * 0.9} ${x2},${y1 + rowH}`,
            lane,
            delay,
          ),
        );
        if (y2 > y1 + rowH) els.push(pathEl(`e${i}-${p}b`, vine(x2, y1 + rowH, y2, i + 1), lane, delay + 0.1));
      } else {
        if (y2 - rowH > y1) els.push(pathEl(`e${i}-${p}a`, vine(x1, y1, y2 - rowH, i), lane, delay));
        els.push(
          pathEl(
            `e${i}-${p}b`,
            `M${x1},${y2 - rowH} C${x1 - 4},${y2 - rowH * 0.2} ${x2 + 5},${y2 - rowH * 0.85} ${x2},${y2 - rowH * 0.45} S${x2 + 1.5},${y2 - rowH * 0.1} ${x2},${y2}`,
            lane,
            delay + 0.1,
          ),
        );
      }
    });
  });

  // Nodes.
  rows.forEach((c, i) => {
    const x = laneX(c.lane);
    const y = i * rowH + rowH / 2;
    const delay = Math.min(i * 0.045, 0.6) + 0.25;
    els.push(
      h("circle", {
        key: `n${i}`,
        cx: x,
        cy: y,
        r: c.merge ? 3.3 : 4.5,
        style: {
          fill: c.merge ? `var(--l${c.lane})` : "var(--win)",
          stroke: `var(--l${c.lane})`,
          strokeWidth: 2,
          transformBox: "fill-box" as const,
          transformOrigin: "center",
          animation: `nodePop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both`,
        },
      }),
    );
  });

  // Leaves at branch tips, by tree style.
  const seen = new Set<number>();
  rows.forEach((c, i) => {
    if (styleKey === "grafo") return;
    const isTip = (c.lane > 0 && !seen.has(c.lane)) || i === 0;
    seen.add(c.lane);
    if (c.merge && !isTip) return;
    const x = laneX(c.lane);
    const y = i * rowH + rowH / 2;
    const side = c.lane > 0 ? 1 : i % 2 === 0 ? 1 : -1;
    const s = isTip ? 1 : 0.62;
    const delay = Math.min(i * 0.045, 0.6) + 0.4;

    if (styleKey !== "tropical") {
      els.push(
        h("path", {
          key: `stem${i}`,
          d: `M${x + side * 3.5},${y - 1} Q${x + side * 6},${y - 4} ${x + side * 8.5},${y - 5.5}`,
          style: {
            stroke: styleKey === "sakura" ? "var(--trunk)" : `var(--l${c.lane})`,
            strokeWidth: 1.1,
            fill: "none",
            opacity: 0.65,
            animation: `fadeIn 0.4s ease ${delay}s both`,
          },
        }),
      );
    }

    if (styleKey === "sakura") {
      const petals: ReactElement[] = [];
      for (let a = 0; a < 5; a++) {
        const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
        petals.push(
          h("circle", {
            key: `p${a}`,
            cx: Math.cos(ang) * 3.1,
            cy: Math.sin(ang) * 3.1,
            r: 2.1,
            style: { fill: "var(--leaf)", opacity: 0.95 },
          }),
        );
      }
      petals.push(h("circle", { key: "c", r: 1.4, style: { fill: "var(--win)", opacity: 0.95 } }));
      els.push(
        h(
          "g",
          { key: `leaf${i}`, transform: `translate(${x + side * 9}, ${y - 6.5}) scale(${isTip ? 1.15 : 0.78})` },
          h(
            "g",
            {
              style: {
                animation: `nodePop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both`,
                transformBox: "fill-box" as const,
                transformOrigin: "center",
              },
            },
            petals,
          ),
        ),
      );
    } else if (styleKey === "tropical") {
      const frond = (key: string, rot: number, len: number, d2: number) =>
        h(
          "g",
          { key, transform: `rotate(${rot})` },
          h("path", {
            d: `M0,0 Q${len * 0.45},${-len * 0.32} ${len},${-len * 0.1} Q${len * 0.5},${len * 0.08} 0,0 Z`,
            style: {
              fill: "var(--leaf)",
              opacity: 0.92,
              transformBox: "fill-box" as const,
              transformOrigin: "left center",
              animation: `leafPop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) ${d2}s both`,
            },
          }),
          h("path", {
            d: `M1,0 Q${len * 0.5},${-len * 0.16} ${len - 2},${-len * 0.1}`,
            style: {
              stroke: "var(--win)",
              strokeWidth: 0.7,
              fill: "none",
              opacity: 0.45,
              animation: `fadeIn 0.4s ease ${d2 + 0.15}s both`,
            },
          }),
        );
      if (isTip) {
        els.push(
          h(
            "g",
            { key: `leaf${i}`, transform: `translate(${x}, ${y - 3})` },
            [-165, -128, -90, -52, -15].map((rot, k) => frond(`f${k}`, rot, 17 + (k % 2) * 4, delay + k * 0.05)),
          ),
        );
        els.push(
          h("circle", {
            key: `coco${i}a`,
            cx: x - 3.2,
            cy: y + 1.5,
            r: 2.2,
            style: {
              fill: "var(--trunk)",
              stroke: "var(--win)",
              strokeWidth: 0.7,
              animation: `nodePop 0.4s ease ${delay + 0.3}s both`,
              transformBox: "fill-box" as const,
              transformOrigin: "center",
            },
          }),
        );
        els.push(
          h("circle", {
            key: `coco${i}b`,
            cx: x + 3.4,
            cy: y + 2,
            r: 2.2,
            style: {
              fill: "var(--trunk)",
              stroke: "var(--win)",
              strokeWidth: 0.7,
              animation: `nodePop 0.4s ease ${delay + 0.38}s both`,
              transformBox: "fill-box" as const,
              transformOrigin: "center",
            },
          }),
        );
      } else {
        els.push(
          h(
            "g",
            { key: `leaf${i}`, transform: `translate(${x + side * 4}, ${y - 3})${side > 0 ? "" : " scale(-1,1)"}` },
            [frond("f0", -60, 14, delay), frond("f1", -18, 12, delay + 0.08)],
          ),
        );
      }
    } else {
      els.push(
        h(
          "g",
          {
            key: `leaf${i}`,
            transform:
              side > 0
                ? `translate(${x + 8}, ${y - 6}) scale(${s}) rotate(-38)`
                : `translate(${x - 8}, ${y - 6}) scale(${-s}, ${s}) rotate(-38)`,
          },
          h("path", {
            d: "M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z",
            style: {
              fill: "var(--leaf)",
              opacity: 0.92,
              transformBox: "fill-box" as const,
              transformOrigin: "left center",
              animation: `leafPop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both`,
            },
          }),
          h("path", {
            d: "M1.5,-0.2 Q5.5,-1 9,-0.8",
            style: {
              stroke: "var(--win)",
              strokeWidth: 0.8,
              fill: "none",
              opacity: 0.5,
              animation: `fadeIn 0.4s ease ${delay + 0.2}s both`,
            },
          }),
        ),
      );
    }
  });

  return h(
    "svg",
    { width: 72, height: rows.length * rowH, style: { display: "block", overflow: "visible" } },
    els,
  );
}
