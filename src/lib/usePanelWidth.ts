import { useRef, useState } from "react";

// Draggable panel width persisted in localStorage — the design's resizable
// dividers (sidebar 180–340, history detail 300–560, working copy 320–540).
// `edge` is the panel edge that carries the handle: "right" for left-side
// panels (drag right = grow), "left" for right-side panels (drag left = grow).
export function usePanelWidth(key: string, initial: number, min: number, max: number, edge: "left" | "right" = "right") {
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(key));
    return Number.isFinite(saved) && saved >= min && saved <= max ? saved : initial;
  });
  const drag = useRef<{ x: number; w: number } | null>(null);
  // Mirrors `width`; written only inside the pointer handlers (never in render).
  const widthRef = useRef(width);

  const handleProps = {
    onPointerDown: (e: React.PointerEvent) => {
      drag.current = { x: e.clientX, w: widthRef.current };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const next = Math.min(max, Math.max(min, drag.current.w + (edge === "right" ? dx : -dx)));
      widthRef.current = next;
      setWidth(next);
    },
    onPointerUp: () => {
      if (!drag.current) return;
      drag.current = null;
      localStorage.setItem(key, String(widthRef.current));
    },
  };

  return { width, handleProps, edge };
}
