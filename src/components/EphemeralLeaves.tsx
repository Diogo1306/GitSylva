import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/appStore";
import { useThemeStore } from "../state/themeStore";
import { LeafMark } from "./FallingLeaves";

// A single leaf drifts down inside the window after a git action (fetch,
// commit) or a repo switch — the handoff's `fxFall`. Leaves clean themselves
// up after the 2.4s animation; everything is gated by the animations toggle.

type Leaf = { id: number; left: string };

let nextId = 1;

export function EphemeralLeaves() {
  const treeStyle = useThemeStore((s) => s.treeStyle);
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const spawn = () => {
      if (!useThemeStore.getState().anims) return;
      const id = nextId++;
      setLeaves((l) => [...l, { id, left: `${18 + Math.round(Math.random() * 64)}%` }]);
      timers.current.push(
        window.setTimeout(() => setLeaves((l) => l.filter((x) => x.id !== id)), 2500),
      );
    };
    const onEvent = () => spawn();
    window.addEventListener("gitsylva:leaf", onEvent);
    // Repo switches also drop a leaf (spec: tab switch).
    const unsub = useAppStore.subscribe((s, prev) => {
      if (s.repo?.path !== prev.repo?.path && prev.repo) spawn();
    });
    const pending = timers.current;
    return () => {
      window.removeEventListener("gitsylva:leaf", onEvent);
      unsub();
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  if (leaves.length === 0) return null;
  // Spawn line sits just below the (two-row) titlebar in tab mode; the rail
  // keeps the original single-row height.
  const top = useThemeStore.getState().repoLayout === "rail" ? 54 : 82;
  return (
    <div style={{ position: "fixed", top, left: 0, right: 0, height: 0, pointerEvents: "none", zIndex: 45 }}>
      {leaves.map((l) => (
        <div key={l.id} style={{ position: "absolute", top: 0, left: l.left, animation: "fxFall 2.4s ease-in both" }}>
          <LeafMark style={treeStyle} />
        </div>
      ))}
    </div>
  );
}
