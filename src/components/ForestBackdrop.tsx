import { useEffect, useState } from "react";
import { useThemeStore } from "../state/themeStore";
import { LeafMark } from "./FallingLeaves";

// Ambient forest sitting behind the app window, on the --desk backdrop:
// corner-anchored SVG boughs that sway + a handful of leaves that drift the
// whole way down (design_handoff_gitsylva/animation-specs/animations.md,
// "Forest sway" / "Falling leaves" rows). Reuses FallingLeaves' leaf mark —
// its shape already follows the tree style — and the shared `.gs-ambient`
// class so the existing `[data-win-hidden]` rule in tokens.css pauses it
// exactly like FallingLeaves/EphemeralLeaves. Colors come from
// --trunk/--leaf/--l0/--win (the last three via LeafMark) — nothing
// hardcoded.
//
// The anims toggle and OS reduced-motion both gate MOTION only: the geometry
// keeps rendering (boughs stay put, leaves stay visible) so flipping either
// setting doesn't pop the backdrop in/out — the spec lists both rows as
// "disabled" under reduced-motion, not "removed".

function prefersReducedMotionNow(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotionNow);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    let mql: MediaQueryList;
    try {
      mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

// Cubic bezier point at t in [0,1] — used to scatter leaves along a bough.
function bezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

// Deterministic pseudo-random in [0,1) — keeps the leaf scatter stable across
// renders/tests without depending on Math.random.
function pseudoRandom(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

type Point = [number, number];
type BoughSpec = {
  key: string;
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  leafCount: number;
  seed: number;
  swayDur: number;
  swayDelay: number;
  origin: string;
  box: { width: number; height: number; top?: number; bottom?: number; left?: number; right?: number };
};
type BoughLeaf = { x: number; y: number; rot: number; scale: number };

// Three corner-anchored boughs (top-left, top-right, bottom-left), each a
// single cubic bezier "wood" path with a handful of leaves scattered along
// it. Sway durations (7-9.6s) and per-bough delay offsets follow the spec.
const BOUGHS: BoughSpec[] = [
  { key: "b1", p0: [-10, 40], p1: [70, 8], p2: [160, 20], p3: [260, 58], leafCount: 6, seed: 11, swayDur: 7.5, swayDelay: 0, origin: "-10px 40px", box: { width: 300, height: 190, top: -20, left: -20 } },
  { key: "b2", p0: [340, 34], p1: [258, 6], p2: [168, 18], p3: [66, 56], leafCount: 6, seed: 47, swayDur: 8.6, swayDelay: 0.6, origin: "340px 34px", box: { width: 360, height: 190, top: -20, right: -20 } },
  { key: "b3", p0: [-10, 172], p1: [72, 152], p2: [154, 140], p3: [244, 108], leafCount: 5, seed: 83, swayDur: 9.4, swayDelay: 1.1, origin: "-10px 172px", box: { width: 280, height: 210, bottom: -20, left: -20 } },
];

function boughLeaves(b: BoughSpec): BoughLeaf[] {
  const leaves: BoughLeaf[] = [];
  for (let i = 0; i < b.leafCount; i++) {
    const t = 0.12 + (0.86 * i) / Math.max(1, b.leafCount - 1);
    const [x, y] = bezierPoint(b.p0, b.p1, b.p2, b.p3, t);
    leaves.push({
      x: x + (pseudoRandom(b.seed + i * 1.9) - 0.5) * 22,
      y: y + (pseudoRandom(b.seed + i * 2.3) - 0.5) * 22,
      rot: pseudoRandom(b.seed + i * 7.3) * 360,
      scale: 0.6 + pseudoRandom(b.seed + i * 3.7) * 0.5,
    });
  }
  return leaves;
}

const BOUGHS_WITH_LEAVES = BOUGHS.map((b) => ({ ...b, leaves: boughLeaves(b) }));

type Faller = { left: string; delay: number; dur: number; scale: number };

// 15-22s, staggered — the range in animation-specs/animations.md ("Falling
// leaves" row), slower than the welcome screen's FallingLeaves (10-14s) since
// this one loops behind the whole session rather than a brief first-run beat.
const FALLERS: Faller[] = [
  { left: "12%", delay: 0, dur: 17, scale: 0.85 },
  { left: "34%", delay: 5, dur: 20, scale: 0.7 },
  { left: "58%", delay: 9, dur: 16, scale: 0.95 },
  { left: "82%", delay: 3, dur: 22, scale: 0.75 },
];

export function ForestBackdrop() {
  const anims = useThemeStore((s) => s.anims);
  const treeStyle = useThemeStore((s) => s.treeStyle);
  const reducedMotion = usePrefersReducedMotion();
  const active = anims && !reducedMotion;

  return (
    <div
      className="gs-ambient"
      aria-hidden
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}
    >
      {BOUGHS_WITH_LEAVES.map((b) => (
        <svg
          key={b.key}
          width={b.box.width}
          height={b.box.height}
          style={{ position: "absolute", top: b.box.top, bottom: b.box.bottom, left: b.box.left, right: b.box.right, overflow: "visible" }}
        >
          <g
            data-forest-bough={b.key}
            style={{
              transformOrigin: b.origin,
              transformBox: "view-box",
              animation: active ? `sway ${b.swayDur}s ease-in-out ${b.swayDelay}s infinite alternate` : "none",
            }}
          >
            <path
              d={`M${b.p0[0]},${b.p0[1]} C${b.p1[0]},${b.p1[1]} ${b.p2[0]},${b.p2[1]} ${b.p3[0]},${b.p3[1]}`}
              stroke="var(--trunk)"
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
            {b.leaves.map((lf, i) => (
              <g key={i} transform={`translate(${lf.x},${lf.y}) rotate(${lf.rot}) scale(${lf.scale})`}>
                <LeafMark style={treeStyle} />
              </g>
            ))}
          </g>
        </svg>
      ))}
      {FALLERS.map((f, i) => (
        <div
          key={i}
          data-forest-leaf={i}
          style={{
            position: "absolute",
            top: 0,
            left: f.left,
            transform: `scale(${f.scale})`,
            animation: active ? `leafFall ${f.dur}s linear ${f.delay}s infinite` : "none",
            opacity: active ? undefined : 0.55,
          }}
        >
          <LeafMark style={treeStyle} />
        </div>
      ))}
    </div>
  );
}
