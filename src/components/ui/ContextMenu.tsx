import { useEffect } from "react";

export type MenuItem = { label: string; onClick: () => void; danger?: boolean; divider?: boolean };

// A right-click menu positioned at (x, y). A full-screen backdrop closes it on
// any click or on Escape.
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the menu on-screen.
  const left = Math.min(x, window.innerWidth - 220);
  const top = Math.min(y, window.innerHeight - items.length * 34 - 12);

  return (
    <div onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 70 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          left,
          top,
          minWidth: 200,
          background: "var(--win)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "var(--shadow-1)",
          padding: 4,
          animation: "popIn 0.14s cubic-bezier(0.2,0.9,0.3,1) both",
          color: "var(--text)",
        }}
      >
        {items.map((it, i) =>
          it.divider ? (
            <div key={i} style={{ height: 1, background: "var(--border)", margin: "4px 6px" }} />
          ) : (
            <div
              key={i}
              onClick={() => { it.onClick(); onClose(); }}
              className="gs-row"
              style={{ display: "flex", alignItems: "center", padding: "7px 10px", borderRadius: 7, fontSize: 13, cursor: "pointer", color: it.danger ? "var(--ddT)" : "var(--text)" }}
            >
              {it.label}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
