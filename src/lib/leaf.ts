// Ephemeral falling leaf (handoff: fxFall on tab switch / fetch / commit).
// Fired as a window event so any success handler can trigger it without
// coupling to the component that renders the leaves.
export function spawnLeaf() {
  window.dispatchEvent(new CustomEvent("gitsylva:leaf"));
}
