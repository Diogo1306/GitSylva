import { useEffect, type ReactNode } from "react";

// Centered modal shell with a scrim. Click outside, press Escape, or the ✕ to close.
export function Modal({ title, onClose, width = 460, children }: { title: string; onClose: () => void; width?: number; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", animation: "fadeIn 0.18s ease both" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          boxSizing: "border-box",
          background: "var(--win)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-2)",
          padding: "var(--sp-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-3)",
          color: "var(--text)",
          animation: "popIn 0.22s cubic-bezier(0.2,0.9,0.3,1) both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{title}</div>
          <div onClick={onClose} className="gs-row" style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--muted)", fontSize: 14 }}>✕</div>
        </div>
        {children}
      </div>
    </div>
  );
}
