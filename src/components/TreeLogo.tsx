import { createElement, memo, type ReactElement } from "react";
import { useThemeStore } from "../state/themeStore";
import type { TreeStyleKey } from "../theme/themes";

// The gitSylva mark: the OFFICIAL S silhouette from the design kit, drawn
// procedurally so it stays theme-aware and morphs by tree style (leaves
// become commit nodes in "grafo", cherry blossoms in "sakura").



function node(cx: number, cy: number, r: number, delay: number, filled: boolean, animated: boolean, sw = 3.2): ReactElement {
  return createElement("circle", {
    key: `nd${cx}-${cy}`,
    cx,
    cy,
    r,
    style: {
      fill: filled ? "var(--l0)" : "var(--win)",
      stroke: "var(--l0)",
      strokeWidth: sw,
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


// A true SVG stroke with the kit's exact path — round caps, uniform width —
// so the drawn S is pixel-faithful to the logo (the old tapered polygon
// outline read slightly crooked). Draw-in uses the kit's dash technique.
function strokePath(key: string, d: string, w: number, color: string, delay: number, animated: boolean, dur = 0.35): ReactElement {
  return createElement("path", {
    key,
    d,
    pathLength: 1,
    fill: "none",
    stroke: color,
    strokeWidth: w,
    strokeLinecap: "round",
    style: animated
      ? { strokeDasharray: 1, strokeDashoffset: 1, animation: `gsDraw ${dur}s cubic-bezier(0.2, 0.9, 0.3, 1) ${delay}s both` }
      : undefined,
  });
}

const SPINE_D = "M34,12 C31,4 14,4 13,14 C12,24 33,32 33,44 C34,56 13,58 12,48";
const HOOK_D = "M33,44 C34,56 13,58 12,48";
const BR1_D = "M26,32 C31,34 35,37 38,41";
const BR2_D = "M13.5,13.5 C10,10.5 7.5,7.5 5,4.5";
const BR3_D = "M28,51 C31.5,53.5 34,55.5 36.5,58";

// The OFFICIAL logo, stroke-for-stroke (design kit): spine, three branches,
// two hollow + two filled nodes and three foliage anchors. Only the foliage
// is alive — it morphs with the tree style (R5.25/26).
function treeSKids(styl: TreeStyleKey, animated: boolean, kb: string): ReactElement[] {
  const tc = styl === "normal" || styl === "grafo" ? "var(--l0)" : "var(--trunk, var(--l0))";
  const S = (k: string, d: string, w: number, delay: number, dur?: number) =>
    strokePath(kb + k + styl, d, w, tc, delay, animated, dur);
  return [
    S("t", SPINE_D, 7, 0.1, 0.9),
    S("b1", BR1_D, 4.5, 0.75),
    S("b2", BR2_D, 4, 0.9),
    S("b3", BR3_D, 4, 1.0),
    node(34, 12, 4, 1.1, false, animated, 4),
    node(12, 48, 4, 1.2, false, animated, 4),
    node(38, 41, 3.2, 1.3, true, animated, 4),
    node(5, 4.5, 3, 1.4, true, animated, 4),
    leaf(styl, 36, 57, -25, 0.85, 1.45, animated),
    leaf(styl, 9, 9, -60, 0.7, 1.55, animated),
    leaf(styl, 30, 6, -110, 0.6, 1.65, animated),
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
  const S = (k: string, d: string, w: number, delay: number, dur?: number) =>
    strokePath(k + styl, d, w, tc, delay, true, dur);
  if (stage === 0) {
    // Sapling: the bottom hook of the S sprouting from the ground.
    return [S("s0", HOOK_D, 7, 0.1, 0.6), leaf(styl, 36, 57, -25, 0.85, 0.6, true)];
  }
  const kids: ReactElement[] = [
    S("t", SPINE_D, 7, 0.05, 0.9),
    S("b3", BR3_D, 4, 0.8),
    node(34, 12, 4, 0.9, false, true, 4),
    leaf(styl, 36, 57, -25, 0.85, 1.0, true),
    leaf(styl, 9, 9, -60, 0.7, 1.1, true),
  ];
  if (stage >= 2) {
    kids.push(
      S("b1", BR1_D, 4.5, 0.75),
      S("b2", BR2_D, 4, 0.85),
      node(12, 48, 4, 0.95, false, true, 4),
      node(38, 41, 3.2, 1.05, true, true, 4),
      node(5, 4.5, 3, 1.15, true, true, 4),
      leaf(styl, 30, 6, -110, 0.6, 1.25, true),
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
