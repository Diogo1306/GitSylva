import { createElement, memo, type ReactElement } from "react";
import { useThemeStore } from "../state/themeStore";
import type { TreeStyleKey } from "../theme/themes";

// The gitSylva mark: the OFFICIAL S silhouette from the design kit, drawn
// procedurally so it stays theme-aware and morphs by tree style (leaves
// become commit nodes in "grafo", cherry blossoms in "sakura").

type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt];

function bez(s: Seg, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
    u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1],
  ];
}

// Outline a chain of bezier segments into a filled path that tapers from width
// w0 at the start to w1 at the end.
function taper(
  segs: Seg[],
  w0: number,
  w1: number,
  color: string,
  animated: boolean,
  delay: number,
  key: string,
): ReactElement {
  const pts: Pt[] = [];
  const N = 14;
  segs.forEach((s, si) => {
    for (let i = si === 0 ? 0 : 1; i <= N; i++) pts.push(bez(s, i / N));
  });
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  const fmt = (p: Pt) => p[0].toFixed(1) + "," + p[1].toFixed(1);
  const d = "M" + left.map(fmt).join(" L") + " L" + right.reverse().map(fmt).join(" L") + " Z";
  return createElement("path", {
    key,
    d,
    style: { fill: color, animation: animated ? `fadeIn 0.35s ease ${delay}s both` : "none" },
  });
}

function node(cx: number, cy: number, r: number, delay: number, filled: boolean, animated: boolean): ReactElement {
  return createElement("circle", {
    key: `nd${cx}-${cy}`,
    cx,
    cy,
    r,
    style: {
      fill: filled ? "var(--l0)" : "var(--win)",
      stroke: "var(--l0)",
      strokeWidth: 3.2,
      transformBox: "fill-box",
      transformOrigin: "center",
      animation: animated ? `nodePop 0.3s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both` : "none",
    },
  });
}

function bloom(x: number, y: number, s: number, delay: number, animated: boolean): ReactElement {
  const petals: ReactElement[] = [];
  for (let a = 0; a < 5; a++) {
    const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
    petals.push(
      createElement("circle", {
        key: "p" + a,
        cx: Math.cos(ang) * 3.4,
        cy: Math.sin(ang) * 3.4,
        r: 2.3,
        // Themed like the graph's sakura petals (was a fixed pink).
        style: { fill: "var(--leaf)" },
      }),
    );
  }
  petals.push(createElement("circle", { key: "c", r: 1.5, style: { fill: "var(--win)" } }));
  return createElement(
    "g",
    { key: `bl${x}-${y}`, transform: `translate(${x}, ${y}) scale(${s})` },
    createElement(
      "g",
      {
        style: {
          animation: animated ? `nodePop 0.35s ease ${delay}s both` : "none",
          transformBox: "fill-box",
          transformOrigin: "center",
        },
      },
      petals,
    ),
  );
}

function leaf(styl: TreeStyleKey, x: number, y: number, rot: number, s: number, delay: number, animated: boolean): ReactElement {
  if (styl === "grafo") return node(x, y, 2.8, delay, true, animated);
  if (styl === "sakura") return bloom(x, y, s * 0.78, delay, animated);
  const d = styl === "tropical" ? "M0,0 Q7,-5 15,-1.8 Q7,1.6 0,0 Z" : "M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z";
  return createElement(
    "g",
    { key: `lf${x}-${y}-${styl}`, transform: `translate(${x}, ${y}) rotate(${rot}) scale(${s})` },
    createElement("path", {
      d,
      style: {
        fill: "var(--leaf)",
        opacity: 0.95,
        transformBox: "fill-box",
        transformOrigin: "left center",
        animation: animated ? `leafPop 0.45s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both` : "none",
      },
    }),
  );
}


// The OFFICIAL logo silhouette (design kit): the S spine, its three branches,
// two hollow + two filled nodes and three foliage anchors — nothing else.
// Only the TREATMENT is alive: tapered strokes, draw-in animation and foliage
// that morphs with the tree style (R5.25 — "o S tem de ser igual ao logo").
function treeSKids(styl: TreeStyleKey, animated: boolean, kb: string): ReactElement[] {
  const tc = styl === "normal" || styl === "grafo" ? "var(--l0)" : "var(--trunk, var(--l0))";
  const T = (segs: Seg[], w0: number, w1: number, d: number, k: string) =>
    taper(segs, w0, w1, tc, animated, d, kb + k + styl);
  return [
    T(
      [
        [[34, 12], [31, 4], [14, 4], [13, 14]],
        [[13, 14], [12, 24], [33, 32], [33, 44]],
        [[33, 44], [34, 56], [13, 58], [12, 48]],
      ],
      6,
      7.6,
      0.05,
      "t",
    ),
    T([[[26, 32], [31, 34], [35, 37], [38, 41]]], 4.2, 2.6, 0.4, "b1"),
    T([[[13.5, 13.5], [10, 10.5], [7.5, 7.5], [5, 4.5]]], 3.6, 2.2, 0.5, "b2"),
    T([[[28, 51], [31.5, 53.5], [34, 55.5], [36.5, 58]]], 3.6, 2.2, 0.6, "b3"),
    node(34, 12, 4, 0.72, false, animated),
    node(12, 48, 4, 0.8, false, animated),
    node(38, 41, 3.2, 0.88, true, animated),
    node(5, 4.5, 3, 0.96, true, animated),
    leaf(styl, 36, 57, -25, 0.85, 1.05, animated),
    leaf(styl, 9, 9, -60, 0.7, 1.15, animated),
    leaf(styl, 30, 6, -110, 0.6, 1.25, animated),
  ];
}

type Props = {
  size: number;
  animated?: boolean;
  crop?: boolean;
  xScale?: number;
  /** Override the tree style; defaults to the current theme preference. */
  treeStyle?: TreeStyleKey;
};

// Memoized: the mark sits in the Titlebar, which re-renders on every status
// change — the ~300-element SVG must not be rebuilt each time.
export const TreeLogo = memo(function TreeLogo({ size, animated = false, crop = false, xScale, treeStyle }: Props) {
  const prefStyle = useThemeStore((s) => s.treeStyle);
  const styl = treeStyle ?? prefStyle;
  const vbH = crop ? 52 : 62;
  const width = Math.round((size * 46) / vbH) * (xScale ?? 1);
  return createElement(
    "svg",
    {
      viewBox: `0 0 46 ${vbH}`,
      width,
      height: size,
      preserveAspectRatio: xScale ? "none" : "xMidYMid meet",
      style: { display: "block", overflow: "visible" },
    },
    treeSKids(styl, animated, "ls"),
  );
});

// The onboarding tree: the OFFICIAL logo mark grows in stages (0 = login
// sapling, 1 = setup, 2 = planted) by revealing the logo's own parts — the
// silhouette always converges on the exact mark (R5.25).
function onboardKids(stage: number, styl: TreeStyleKey): ReactElement[] {
  const tc = styl === "normal" || styl === "grafo" ? "var(--l0)" : "var(--trunk, var(--l0))";
  const T = (segs: Seg[], w0: number, w1: number, d: number, k: string) =>
    taper(segs, w0, w1, tc, true, d, k + styl);
  if (stage === 0) {
    // Sapling: the bottom hook of the S sprouting from the ground.
    return [
      T([[[33, 44], [34, 56], [13, 58], [12, 48]]], 6.6, 7.4, 0.1, "s0"),
      leaf(styl, 36, 57, -25, 0.85, 0.6, true),
    ];
  }
  const kids: ReactElement[] = [
    T(
      [
        [[34, 12], [31, 4], [14, 4], [13, 14]],
        [[13, 14], [12, 24], [33, 32], [33, 44]],
        [[33, 44], [34, 56], [13, 58], [12, 48]],
      ],
      6,
      7.6,
      0.05,
      "t",
    ),
    T([[[28, 51], [31.5, 53.5], [34, 55.5], [36.5, 58]]], 3.6, 2.2, 0.5, "b3"),
    node(34, 12, 4, 0.7, false, true),
    leaf(styl, 36, 57, -25, 0.85, 0.9, true),
    leaf(styl, 9, 9, -60, 0.7, 1.0, true),
  ];
  if (stage >= 2) {
    kids.push(
      T([[[26, 32], [31, 34], [35, 37], [38, 41]]], 4.2, 2.6, 0.4, "b1"),
      T([[[13.5, 13.5], [10, 10.5], [7.5, 7.5], [5, 4.5]]], 3.6, 2.2, 0.55, "b2"),
      node(12, 48, 4, 0.75, false, true),
      node(38, 41, 3.2, 0.85, true, true),
      node(5, 4.5, 3, 0.95, true, true),
      leaf(styl, 30, 6, -110, 0.6, 1.1, true),
    );
  }
  return kids;
}

export function OnboardTree({ stage }: { stage: number }) {
  const styl = useThemeStore((s) => s.treeStyle);
  return createElement(
    "svg",
    {
      viewBox: "0 0 46 62",
      width: "100%",
      height: "100%",
      style: { display: "block", overflow: "visible" },
      // key on style+stage so switching either replays the growth animation
      key: `${styl}-${stage}`,
    },
    onboardKids(stage, styl),
  );
}
