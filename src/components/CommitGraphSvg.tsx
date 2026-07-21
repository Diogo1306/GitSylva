import { createElement as h, memo, useEffect, useMemo, useState, type ReactElement } from "react";
import { useThemeStore } from "../state/themeStore";
import type { GraphCommit } from "../graph/layout";
import type { TreeStyleKey } from "../theme/themes";

// The living history graph, ported from the design's buildGraph. Lanes are
// drawn as gently waving "vines"; branches and merges curl in with cubic
// beziers; commit nodes are buttons on the vine; and leaves (or blossoms, or
// palm fronds, or bare nodes) sprout at branch tips according to the tree style.
//
// Performance: elements are keyed by COMMIT HASH, so React keeps the DOM nodes
// of commits that were already on screen, and the entrance animation is only
// attached to hashes that were absent from the previous render — a new commit
// grows in alone; everything else stays still (R3 §8). Selecting, scrolling or
// hovering never rebuilds the SVG (memo on rows/rowH/style).

const LANE_W = 18;
// Deep parallel histories clamp at lane 12 — beyond that the far lines share
// the last column instead of running under the commit text.
const laneX = (l: number) => 10 + Math.min(l, 12) * LANE_W;
// Only --l0/--l1/--l2 exist as theme vars; higher lanes cycle the two branch
// colors (never the trunk's) — before this, lane ≥3 strokes referenced an
// undefined var and the lines simply didn't render.
const laneColor = (l: number) => (l === 0 ? "var(--l0)" : `var(--l${((l - 1) % 2) + 1})`);

// Entrance animation budget, PER ROW: the first screenfuls grow in; rows
// beyond this render static. The old all-or-nothing cap (skip when
// rows.length > 120) silenced the signature entrance on every real repo —
// a 200-commit log never animated at all.
const ANIM_ROWS = 120;

function buildGraph(
  rows: GraphCommit[],
  rowH: number,
  styleKey: TreeStyleKey,
  anims: boolean,
  seenHashes: ReadonlySet<string>,
  range?: { start: number; end: number },
): ReactElement[] {
  const els: ReactElement[] = [];
  // Only commits that weren't on screen last render play their entrance, and
  // only within the first ANIM_ROWS rows (the rest is below the fold).
  const fresh = (hash: string, i: number) => anims && i < ANIM_ROWS && !seenHashes.has(hash);
  const anim = (on: boolean, s: string) => (on ? s : "none");
  // Windowed mode (huge histories): only emit elements whose row span
  // intersects the visible range. Geometry is index-based, so skipping rows
  // never changes where anything is drawn.
  const inRange = (a: number, b = a) => !range || (Math.min(a, b) <= range.end && Math.max(a, b) >= range.start);

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

  const pathEl = (key: string, d: string, lane: number, delay: number, on: boolean, w?: number) =>
    h("path", {
      key,
      d,
      fill: "none",
      ...(on ? { pathLength: 1 } : {}),
      style: {
        stroke:
          (styleKey === "tropical" || styleKey === "sakura") && lane === 0
            ? "var(--trunk)"
            : laneColor(lane),
        // Slimmed ~25% (R5.27 — user wants lighter commit lines).
        strokeWidth:
          w ||
          (lane === 0
            ? styleKey === "tropical"
              ? 3.2
              : styleKey === "sakura"
                ? 2.9
                : 2.6
            : styleKey === "tropical"
              ? 2.2
              : styleKey === "sakura"
                ? 1.9
                : 1.7),
        strokeLinecap: "round" as const,
        opacity: 0.9,
        // The dash-reveal only exists while animating; static paths skip it.
        ...(on ? { strokeDasharray: 1, animation: `vineDraw 0.8s ease-out ${delay}s both` } : {}),
      },
    });

  // Edges (keyed child-hash → parent-hash; they animate with the CHILD commit).
  rows.forEach((c, i) => {
    const hash = c.commit.hash;
    const on = fresh(hash, i);
    const x1 = laneX(c.lane);
    const y1 = i * rowH + rowH / 2;
    const delay = Math.min(i * 0.045, 0.6);
    c.parentRows.forEach((p) => {
      const pc = rows[p];
      if (!pc) return;
      // An edge is visible when any part of its child→parent span is.
      if (!inRange(i, p)) return;
      const pHash = pc.commit.hash;
      const x2 = laneX(pc.lane);
      const y2 = p * rowH + rowH / 2;
      const lane = x1 === x2 ? c.lane : Math.max(c.lane, pc.lane);
      if (x1 === x2) {
        els.push(pathEl(`e-${hash}-${pHash}`, vine(x1, y1, y2, i), lane, delay, on));
      } else if (c.merge) {
        els.push(
          pathEl(
            `e-${hash}-${pHash}-a`,
            `M${x1},${y1} C${x1 + 4},${y1 + rowH * 0.8} ${x2 - 5},${y1 + rowH * 0.15} ${x2},${y1 + rowH * 0.55} S${x2 - 1.5},${y1 + rowH * 0.9} ${x2},${y1 + rowH}`,
            lane,
            delay,
            on,
          ),
        );
        if (y2 > y1 + rowH) els.push(pathEl(`e-${hash}-${pHash}-b`, vine(x2, y1 + rowH, y2, i + 1), lane, delay + 0.1, on));
      } else {
        if (y2 - rowH > y1) els.push(pathEl(`e-${hash}-${pHash}-a`, vine(x1, y1, y2 - rowH, i), lane, delay, on));
        els.push(
          pathEl(
            `e-${hash}-${pHash}-b`,
            `M${x1},${y2 - rowH} C${x1 - 4},${y2 - rowH * 0.2} ${x2 + 5},${y2 - rowH * 0.85} ${x2},${y2 - rowH * 0.45} S${x2 + 1.5},${y2 - rowH * 0.1} ${x2},${y2}`,
            lane,
            delay + 0.1,
            on,
          ),
        );
      }
    });
  });

  // Nodes.
  rows.forEach((c, i) => {
    if (!inRange(i)) return;
    const hash = c.commit.hash;
    const on = fresh(hash, i);
    const x = laneX(c.lane);
    const y = i * rowH + rowH / 2;
    const delay = Math.min(i * 0.045, 0.6) + 0.25;
    els.push(
      h("circle", {
        key: `n-${hash}`,
        "data-hash": hash,
        cx: x,
        cy: y,
        r: c.merge ? 3.3 : 4.5,
        style: {
          fill: c.merge ? laneColor(c.lane) : "var(--win)",
          stroke: laneColor(c.lane),
          strokeWidth: 2,
          transformBox: "fill-box" as const,
          transformOrigin: "center",
          animation: anim(on, `nodePop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both`),
        },
      }),
    );
  });

  // Leaves at branch tips, by tree style.
  const tipLanes = new Set<number>();
  rows.forEach((c, i) => {
    if (styleKey === "grafo") return;
    const hash = c.commit.hash;
    const on = fresh(hash, i);
    // Tip bookkeeping must run for EVERY row (it accumulates), so the range
    // check happens after it — skipping only the element creation.
    const isTip = (c.lane > 0 && !tipLanes.has(c.lane)) || i === 0;
    tipLanes.add(c.lane);
    if (!inRange(i)) return;
    if (c.merge && !isTip) return;
    const x = laneX(c.lane);
    const y = i * rowH + rowH / 2;
    const side = c.lane > 0 ? 1 : i % 2 === 0 ? 1 : -1;
    const s = isTip ? 1 : 0.62;
    const delay = Math.min(i * 0.045, 0.6) + 0.4;

    if (styleKey !== "tropical") {
      els.push(
        h("path", {
          key: `stem-${hash}`,
          d: `M${x + side * 3.5},${y - 1} Q${x + side * 6},${y - 4} ${x + side * 8.5},${y - 5.5}`,
          style: {
            stroke: styleKey === "sakura" ? "var(--trunk)" : laneColor(c.lane),
            strokeWidth: 1.1,
            fill: "none",
            opacity: 0.65,
            animation: anim(on, `fadeIn 0.4s ease ${delay}s both`),
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
          { key: `leaf-${hash}`, transform: `translate(${x + side * 9}, ${y - 6.5}) scale(${isTip ? 1.15 : 0.78})` },
          h(
            "g",
            {
              style: {
                animation: anim(on, `nodePop 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both`),
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
              animation: anim(on, `leafPop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) ${d2}s both`),
            },
          }),
          h("path", {
            d: `M1,0 Q${len * 0.5},${-len * 0.16} ${len - 2},${-len * 0.1}`,
            style: {
              stroke: "var(--win)",
              strokeWidth: 0.7,
              fill: "none",
              opacity: 0.45,
              animation: anim(on, `fadeIn 0.4s ease ${d2 + 0.15}s both`),
            },
          }),
        );
      if (isTip) {
        els.push(
          h(
            "g",
            { key: `leaf-${hash}`, transform: `translate(${x}, ${y - 3})` },
            [-165, -128, -90, -52, -15].map((rot, k) => frond(`f${k}`, rot, 17 + (k % 2) * 4, delay + k * 0.05)),
          ),
        );
        els.push(
          h("circle", {
            key: `coco-${hash}-a`,
            cx: x - 3.2,
            cy: y + 1.5,
            r: 2.2,
            style: {
              fill: "var(--trunk)",
              stroke: "var(--win)",
              strokeWidth: 0.7,
              animation: anim(on, `nodePop 0.4s ease ${delay + 0.3}s both`),
              transformBox: "fill-box" as const,
              transformOrigin: "center",
            },
          }),
        );
        els.push(
          h("circle", {
            key: `coco-${hash}-b`,
            cx: x + 3.4,
            cy: y + 2,
            r: 2.2,
            style: {
              fill: "var(--trunk)",
              stroke: "var(--win)",
              strokeWidth: 0.7,
              animation: anim(on, `nodePop 0.4s ease ${delay + 0.38}s both`),
              transformBox: "fill-box" as const,
              transformOrigin: "center",
            },
          }),
        );
      } else {
        els.push(
          h(
            "g",
            { key: `leaf-${hash}`, transform: `translate(${x + side * 4}, ${y - 3})${side > 0 ? "" : " scale(-1,1)"}` },
            [frond("f0", -60, 14, delay), frond("f1", -18, 12, delay + 0.08)],
          ),
        );
      }
    } else {
      els.push(
        h(
          "g",
          {
            key: `leaf-${hash}`,
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
              animation: anim(on, `leafPop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both`),
            },
          }),
          h("path", {
            d: "M1.5,-0.2 Q5.5,-1 9,-0.8",
            style: {
              stroke: "var(--win)",
              strokeWidth: 0.8,
              fill: "none",
              opacity: 0.5,
              animation: anim(on, `fadeIn 0.4s ease ${delay + 0.2}s both`),
            },
          }),
        ),
      );
    }
  });

  return els;
}

export const CommitGraphSvg = memo(function CommitGraphSvg({
  rows,
  rowH,
  visibleRange,
}: {
  rows: GraphCommit[];
  rowH: number;
  /** Windowed mode: only rows in [start, end] emit SVG elements. */
  visibleRange?: { start: number; end: number };
}) {
  const styleKey = useThemeStore((s) => s.treeStyle);
  const anims = useThemeStore((s) => s.anims);
  // The per-row budget (ANIM_ROWS in buildGraph) bounds the entrance cost:
  // any history size animates its first screenfuls, the rest is static.

  // Incremental entrance: hashes from the PREVIOUS render become "seen" and
  // never replay; only genuinely new commits animate. Render-phase state
  // adjustment is the sanctioned derive-on-change pattern.
  const hashesKey = useMemo(() => rows.map((r) => r.commit.hash).join("|"), [rows]);
  const [prevKey, setPrevKey] = useState<string | null>(null);
  const [seenHashes, setSeenHashes] = useState<ReadonlySet<string>>(() => new Set());
  if (hashesKey !== prevKey) {
    setPrevKey(hashesKey);
    if (prevKey !== null) setSeenHashes(new Set(prevKey.split("|")));
  }

  // Once the entrance finishes (longest chain ≈ 0.6s stagger + 0.8s draw),
  // everything becomes "seen": in windowed mode, scrolling away and back
  // remounts elements, and without this they would replay their entrance.
  // The rebuild is invisible — every keyframe ends at the static pose.
  useEffect(() => {
    if (!anims || rows.length === 0) return;
    if (rows.every((r) => seenHashes.has(r.commit.hash))) return;
    const t = window.setTimeout(() => {
      setSeenHashes(new Set(rows.map((r) => r.commit.hash)));
    }, 1600);
    return () => window.clearTimeout(t);
  }, [anims, rows, seenHashes]);

  const els = useMemo(
    () => buildGraph(rows, rowH, styleKey, anims, seenHashes, visibleRange),
    [rows, rowH, styleKey, anims, seenHashes, visibleRange],
  );
  return h("svg", { width: 72, height: rows.length * rowH, style: { display: "block", overflow: "visible" } }, els);
});
