import { type CSSProperties, type ReactElement } from "react";
import { useThemeStore } from "../state/themeStore";
import type { TreeStyleKey } from "../theme/themes";

// The living S-tree (R5.23): the EXACT geometry from the design kit's
// animated SVG (viewBox 46×62), drawn procedurally so it stays theme-aware
// (CSS vars) and the foliage morphs with the tree style — leaves, sakura
// blooms, tropical fronds or bare nodes — like the old mark did, but with
// the new, better S. `stage` grows it through the onboarding steps.

const LEAF_D = "M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z";
const FROND_D = "M0,0 Q7,-5 15,-1.8 Q7,1.6 0,0 Z";

type Anim = { animated: boolean; delay: number };

function stroke(key: string, d: string, w: number, { animated, delay }: Anim, dur = 0.3): ReactElement {
  return (
    <path
      key={key}
      d={d}
      pathLength={1}
      fill="none"
      stroke="var(--l0)"
      strokeWidth={w}
      strokeLinecap="round"
      style={
        animated
          ? { strokeDasharray: 1, strokeDashoffset: 1, animation: `gsDraw ${dur}s cubic-bezier(0.2,0.9,0.3,1) ${delay}s both` }
          : undefined
      }
    />
  );
}

function node(key: string, cx: number, cy: number, r: number, filled: boolean, { animated, delay }: Anim): ReactElement {
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      fill={filled ? "var(--l0)" : "var(--win)"}
      stroke="var(--l0)"
      strokeWidth={4}
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        animation: animated ? `gsPop 0.35s cubic-bezier(0.2,0.9,0.3,1) ${delay}s both` : undefined,
      }}
    />
  );
}

function foliage(styl: TreeStyleKey, key: string, x: number, y: number, rot: number, s: number, anim: Anim): ReactElement {
  const pop: CSSProperties = {
    transformBox: "fill-box",
    transformOrigin: "left center",
    animation: anim.animated ? `gsLeaf 0.45s cubic-bezier(0.2,0.9,0.3,1) ${anim.delay}s both` : undefined,
  };
  if (styl === "grafo") {
    // Bare graph mode: foliage becomes a small filled commit node.
    return node(key, x, y, 2.4, true, anim);
  }
  if (styl === "sakura") {
    const petals: ReactElement[] = [];
    for (let a = 0; a < 5; a++) {
      const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
      petals.push(<circle key={a} cx={Math.cos(ang) * 3.2} cy={Math.sin(ang) * 3.2} r={2.2} fill="var(--leaf)" />);
    }
    petals.push(<circle key="c" r={1.4} fill="var(--win)" />);
    return (
      <g key={key} transform={`translate(${x}, ${y}) scale(${s})`}>
        <g style={{ ...pop, transformOrigin: "center" }}>{petals}</g>
      </g>
    );
  }
  const d = styl === "tropical" ? FROND_D : LEAF_D;
  return (
    <g key={key} transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
      <path d={d} fill="var(--leaf)" opacity={0.95} style={pop} />
    </g>
  );
}

export function STree({
  size,
  stage = 2,
  animated = true,
  treeStyle,
}: {
  /** Rendered height in px (the mark is 46×62). */
  size: number;
  /** 0 = sapling, 1 = young tree, 2 = the full S. */
  stage?: 0 | 1 | 2;
  animated?: boolean;
  treeStyle?: TreeStyleKey;
}) {
  const prefStyle = useThemeStore((s) => s.treeStyle);
  const styl = treeStyle ?? prefStyle;
  const A = (delay: number): Anim => ({ animated, delay });

  const els: ReactElement[] = [];
  // Kit geometry — spine, branches, nodes, foliage anchors.
  if (stage === 0) {
    // Sapling: just the bottom hook of the S sprouting from the ground.
    els.push(stroke("sprout", "M33,44 C34,56 13,58 12,48", 7, A(0.1), 0.6));
    els.push(foliage(styl, "lf0", 36, 57, -25, 0.85, A(0.6)));
  } else {
    els.push(stroke("spine", "M34,12 C31,4 14,4 13,14 C12,24 33,32 33,44 C34,56 13,58 12,48", 7, A(0.1), 0.9));
    els.push(stroke("br-right", "M26,32 C31,34 35,37 38,41", 4.5, A(0.75)));
    els.push(stroke("br-bottom", "M28,51 C31.5,53.5 34,55.5 36.5,58", 4, A(1.0)));
    els.push(node("nd-top", 34, 12, 4, false, A(1.1)));
    els.push(foliage(styl, "lf0", 36, 57, -25, 0.85, A(1.45)));
    els.push(foliage(styl, "lf1", 9, 9, -60, 0.7, A(1.55)));
    if (stage === 2) {
      els.push(stroke("br-left", "M13.5,13.5 C10,10.5 7.5,7.5 5,4.5", 4, A(0.9)));
      els.push(node("nd-bottom", 12, 48, 4, false, A(1.2)));
      els.push(node("nd-right", 38, 41, 3.2, true, A(1.3)));
      els.push(node("nd-crown", 5, 4.5, 3, true, A(1.4)));
      els.push(foliage(styl, "lf2", 30, 6, -110, 0.6, A(1.65)));
    }
  }

  return (
    <svg viewBox="0 0 46 62" width={Math.round((size * 46) / 62)} height={size} style={{ display: "block", overflow: "visible" }}>
      {els}
    </svg>
  );
}
