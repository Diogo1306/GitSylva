import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/Button";

type Props = {
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// Small confirmation dialog for destructive actions (danger variant).
// Autofocuses CANCEL (safe default), traps Tab between its controls, Escape
// cancels with the exit animation, and focus returns to the opener.
export function ConfirmDialog({ message, confirmLabel = "Descartar", onConfirm, onCancel }: Props) {
  const [closing, setClosing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  function requestCancel() {
    setClosing((already) => {
      if (!already) window.setTimeout(onCancel, 180);
      return true;
    });
  }

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => restoreRef.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = boxRef.current?.querySelectorAll<HTMLElement>("button");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={requestCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "grid",
        placeItems: "center",
        animation: closing ? "fadeOut 180ms var(--ease-standard) both" : "fadeIn 0.15s ease both",
      }}
    >
      <div
        ref={boxRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={message}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--win)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-2)",
          padding: "var(--sp-5)",
          borderRadius: "var(--radius)",
          maxWidth: 380,
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-4)",
          animation: closing
            ? "modalOut 180ms var(--ease-standard) both"
            : "popIn 0.2s var(--ease-pop) both",
        }}
      >
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text)" }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button ref={cancelRef} onClick={requestCancel}>Cancelar</Button>
          <Button variant="primary" style={{ background: "var(--danger)", color: "var(--dangerT)" }} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
