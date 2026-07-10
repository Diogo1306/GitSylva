import { useThemeStore } from "../state/themeStore";

// Decorative leaves drifting down over the desk background (welcome / onboarding).
// Gated by the "decorative animations" setting; OS reduced-motion neutralizes the
// fall via the global media query. The mark shape follows the tree style.

type Drop = { left: string; delay: number; dur: number; scale: number };

const DROPS: Drop[] = [
  { left: "8%", delay: 0, dur: 11, scale: 1 },
  { left: "20%", delay: 3.5, dur: 13, scale: 0.8 },
  { left: "34%", delay: 6, dur: 10, scale: 1.1 },
  { left: "48%", delay: 1.5, dur: 14, scale: 0.7 },
  { left: "62%", delay: 5, dur: 12, scale: 0.95 },
  { left: "76%", delay: 8, dur: 11, scale: 0.85 },
  { left: "88%", delay: 2.5, dur: 13, scale: 1.05 },
  { left: "95%", delay: 7, dur: 10, scale: 0.75 },
];

function Mark({ style }: { style: string }) {
  if (style === "grafo")
    return <svg width={9} height={9} viewBox="0 0 9 9"><circle cx={4.5} cy={4.5} r={3} fill="var(--win)" stroke="var(--l0)" strokeWidth={1.6} /></svg>;
  if (style === "sakura")
    return (
      <svg width={14} height={14} viewBox="0 0 14 14">
        {[0, 1, 2, 3, 4].map((a) => {
          const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
          return <circle key={a} cx={7 + Math.cos(ang) * 3} cy={7 + Math.sin(ang) * 3} r={2} fill="var(--leaf)" />;
        })}
        <circle cx={7} cy={7} r={1.3} fill="var(--win)" />
      </svg>
    );
  if (style === "tropical")
    return <svg width={20} height={12} viewBox="0 0 20 12"><path d="M2,6 Q10,-2 19,3 Q10,7 2,6 Z" fill="var(--leaf)" /></svg>;
  return <svg width={16} height={12} viewBox="0 0 16 12"><path d="M1,10 Q6,2 15,4 Q7,9 1,10 Z" fill="var(--leaf)" /></svg>;
}

export function FallingLeaves() {
  const anims = useThemeStore((s) => s.anims);
  const treeStyle = useThemeStore((s) => s.treeStyle);
  if (!anims) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {DROPS.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: d.left,
            transform: `scale(${d.scale})`,
            animation: `leafFall ${d.dur}s linear ${d.delay}s infinite`,
          }}
        >
          <Mark style={treeStyle} />
        </div>
      ))}
    </div>
  );
}
