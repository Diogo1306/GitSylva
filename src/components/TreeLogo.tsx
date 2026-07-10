import { createElement, type ReactElement } from "react";
import { useThemeStore } from "../state/themeStore";
import type { TreeStyleKey } from "../theme/themes";

// The gitSylva mark: an "S" drawn as a git branch. A tapered bezier trunk with
// roots at the base and a crown of nodes and leaves at the top. Ported from the
// design's procedural generator so it stays faithful and morphs by tree style
// (leaves become commit nodes in "grafo", cherry blossoms in "sakura").

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
        style: { fill: "#E8A6C0" },
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

function tuft(styl: TreeStyleKey, x: number, y: number, rot: number, s: number, delay: number, animated: boolean): ReactElement {
  if (styl === "grafo") {
    return createElement(
      "g",
      { key: `tf${x}-${y}-gr` },
      node(x, y, 3.4, delay, false, animated),
      node(x + 7 * s, y - 5 * s, 2.2, delay + 0.12, true, animated),
    );
  }
  if (styl === "sakura") {
    return createElement(
      "g",
      { key: `tf${x}-${y}-sk` },
      bloom(x, y, s * 0.95, delay, animated),
      bloom(x + 6 * s, y - 4.5 * s, s * 0.58, delay + 0.12, animated),
    );
  }
  const fan: [number, number, number][] =
    styl === "tropical"
      ? [[-112, 0.8, 0.18], [-70, 0.92, 0], [-26, 1, 0.08], [16, 0.85, 0.14]]
      : [[-44, 0.8, 0.08], [0, 1, 0], [42, 0.78, 0.14]];
  const d = styl === "tropical" ? "M0,0 Q8,-5 17,-2 Q8,1.5 0,0 Z" : "M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z";
  return createElement(
    "g",
    { key: `tf${x}-${y}-${styl}`, transform: `translate(${x}, ${y}) rotate(${rot}) scale(${s})` },
    fan.map(([dr, ds, dd], k) =>
      createElement(
        "g",
        { key: k, transform: `rotate(${dr}) scale(${ds})` },
        createElement("path", {
          d,
          style: {
            fill: "var(--leaf)",
            opacity: 0.95,
            transformBox: "fill-box",
            transformOrigin: "left center",
            animation: animated ? `leafPop 0.45s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay + dd}s both` : "none",
          },
        }),
      ),
    ),
  );
}

function treeSKids(styl: TreeStyleKey, animated: boolean, kb: string): ReactElement[] {
  const tc = styl === "normal" || styl === "grafo" ? "var(--l0)" : "var(--trunk, var(--l0))";
  const T = (segs: Seg[], w0: number, w1: number, d: number, k: string) =>
    taper(segs, w0, w1, tc, animated, d, kb + k + styl);
  return [
    T([[[12, 47.5], [8.5, 51], [5.5, 53.5], [2, 56.5]]], 6, 1, 0.05, "r1"),
    T([[[12, 47.5], [14.5, 51.5], [17, 54], [20, 57]]], 6, 1, 0.08, "r2"),
    T(
      [
        [[34, 12], [31, 4], [14, 4], [13, 14]],
        [[13, 14], [12, 24], [33, 32], [33, 44]],
        [[33, 44], [34, 56], [13, 58], [12, 48]],
      ],
      2.6,
      9,
      0.05,
      "t",
    ),
    T([[[13.5, 13.5], [10, 10.5], [7.5, 7.5], [5, 4.5]]], 3, 1.2, 0.18, "c1"),
    T([[[24, 4.8], [21.5, 3.2], [19.5, 2.2], [17, 1]]], 2.6, 1.1, 0.24, "c2"),
    T([[[30, 6.5], [32, 4.5], [33.5, 3], [35.5, 1.5]]], 2.4, 1, 0.3, "c3"),
    node(34, 12, 3.8, 0.42, false, animated),
    tuft(styl, 17, 1, -105, 0.9, 0.5, animated),
    tuft(styl, 35.5, 1.5, -55, 0.62, 0.6, animated),
    node(5, 4.5, 2.8, 0.7, true, animated),
    leaf(styl, 9, 9, -55, 0.55, 0.78, animated),
    leaf(styl, 12.5, 20, 170, 0.5, 0.85, animated),
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

export function TreeLogo({ size, animated = false, crop = false, xScale, treeStyle }: Props) {
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
}

// The onboarding tree: the logo mark grows in stages (0 = login sapling,
// 1 = setup, 2 = planted) by adding branches, tufts, nodes and leaves.
function onboardKids(stage: number, styl: TreeStyleKey): ReactElement[] {
  const tc = styl === "normal" || styl === "grafo" ? "var(--l0)" : "var(--trunk, var(--l0))";
  const T = (segs: Seg[], w0: number, w1: number, d: number, k: string) =>
    taper(segs, w0, w1, tc, true, d, k + styl);
  const kids: ReactElement[] = [
    createElement("g", { key: "base", transform: "translate(19, 48)" }, treeSKids(styl, true, "ob")),
  ];
  if (stage >= 1) {
    kids.push(
      createElement(
        "g",
        { key: "ext" },
        T([[[53, 60], [56, 50], [52, 40], [47, 32]]], 3, 1.3, 0.1, "e1"),
        T([[[51, 44], [46, 40], [41, 37], [35, 34]]], 2.2, 1, 0.3, "e2"),
        tuft(styl, 35, 34, -150, 0.8, 0.5, true),
        node(47, 32, 3.4, 0.6, false, true),
        leaf(styl, 54, 51, 15, 0.6, 0.7, true),
      ),
    );
  }
  if (stage >= 2) {
    kids.push(
      createElement(
        "g",
        { key: "cr" },
        T([[[49, 42], [55, 39], [61, 36], [66, 32]]], 2, 0.9, 0.05, "f1"),
        T([[[47, 31], [49, 27], [51, 25], [53, 22]]], 1.8, 0.8, 0.3, "f2"),
        tuft(styl, 66, 32, -35, 0.85, 0.3, true),
        tuft(styl, 53, 22, -80, 0.95, 0.5, true),
        tuft(styl, 47, 30, -120, 0.8, 0.4, true),
        node(66, 32, 2.6, 0.55, true, true),
        leaf(styl, 58, 37.5, -60, 0.6, 0.6, true),
        leaf(styl, 43, 34, 150, 0.55, 0.68, true),
      ),
    );
  }
  return kids;
}

export function OnboardTree({ stage }: { stage: number }) {
  const styl = useThemeStore((s) => s.treeStyle);
  return createElement(
    "svg",
    {
      viewBox: "0 0 84 112",
      width: "100%",
      height: "100%",
      style: { display: "block", overflow: "visible" },
      // key on style+stage so switching either replays the growth animation
      key: `${styl}-${stage}`,
    },
    onboardKids(stage, styl),
  );
}
