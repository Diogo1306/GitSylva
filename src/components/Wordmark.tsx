import { TreeLogo } from "./TreeLogo";

// The git[S-tree]ylva lockup (Space Grotesk 600, S cropped and widened 1.22×),
// shared by the titlebar, the welcome screen and the onboarding column — it
// was previously hand-assembled in each place with diverging magic numbers.
export function Wordmark({ size = 17 }: { size?: number }) {
  const tree = Math.round(size * 0.85);
  const lift = Math.round(size * 0.12);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "0.3px",
      }}
    >
      <span>git</span>
      <span style={{ display: "inline-block", margin: "0 1px", transform: `translateY(${lift}px)` }}>
        <TreeLogo size={tree} crop xScale={1.22} />
      </span>
      <span>ylva</span>
    </div>
  );
}
