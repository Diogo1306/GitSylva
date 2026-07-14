import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ModalCloseContext } from "./modalClose";

// Shared modal shell (handoff §10): scrim + dialog with entrance/exit
// animation, Escape/scrim/✕ close, focus trap, autofocus on the first field
// and focus returned to the opener on unmount.

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ title, onClose, width = 460, children }: { title: string; onClose: () => void; width?: number; children: ReactNode }) {
  const [closing, setClosing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const requestClose = useCallback(() => {
    setClosing((already) => {
      if (!already) window.setTimeout(onClose, 200);
      return true;
    });
  }, [onClose]);

  // Remember the opener, autofocus the first field, restore focus on unmount.
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const first = boxRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? boxRef.current)?.focus();
    return () => restoreRef.current?.focus?.();
  }, []);

  // Escape closes (animated); Tab cycles inside the dialog (focus trap).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = boxRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const list = Array.from(nodes);
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && !!boxRef.current?.contains(active);
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return (
    <div
      onClick={requestClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        animation: closing ? "fadeOut 200ms var(--ease-standard) both" : "fadeIn 0.18s ease both",
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          boxSizing: "border-box",
          maxHeight: "84vh",
          overflowY: "auto",
          background: "var(--win)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-2)",
          padding: "var(--sp-5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-3)",
          color: "var(--text)",
          outline: "none",
          animation: closing
            ? "modalOut 200ms var(--ease-standard) both"
            : "popIn 0.22s var(--ease-pop) both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{title}</div>
          <button
            onClick={requestClose}
            aria-label="Fechar"
            className="gs-row"
            style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--muted)", fontSize: 14, background: "transparent", border: "none", fontFamily: "inherit" }}
          >
            ✕
          </button>
        </div>
        <ModalCloseContext.Provider value={requestClose}>{children}</ModalCloseContext.Provider>
      </div>
    </div>
  );
}
