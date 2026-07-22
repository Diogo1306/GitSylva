import { useRef, useState } from "react";

// Draggable panel width persisted in localStorage. `edge` carries the handle: "right" for left-side panels (drag right grows), "left" for right-side panels.
export function usePanelWidth(
  key: string,
  initial: number,
  min: number,
  max: number,
  edge: "left" | "right" = "right",
  /** Dragging well past the minimum collapses the panel (R5.13). */
  onCollapse?: () => void,
) {
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
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* synthetic events (tests) have no capturable pointer */
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const raw = drag.current.w + (edge === "right" ? dx : -dx);
      if (onCollapse && raw < min - 60) {
        drag.current = null;
        onCollapse();
        return;
      }
      const next = Math.min(max, Math.max(min, raw));
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

// Vertical sibling: draggable section height. `edge` = handle side: "bottom" = below content (drag down grows), "top" = above a bottom panel (drag down shrinks).
export function usePanelHeight(
  key: string,
  initial: number,
  min: number,
  max: number,
  edge: "bottom" | "top" = "bottom",
  /** Dragging well past the minimum collapses the panel (R5.13). */
  onCollapse?: () => void,
) {
  const [height, setHeight] = useState(() => {
    const saved = Number(localStorage.getItem(key));
    return Number.isFinite(saved) && saved >= min && saved <= max ? saved : initial;
  });
  const drag = useRef<{ y: number; h: number } | null>(null);
  const heightRef = useRef(height);

  const handleProps = {
    onPointerDown: (e: React.PointerEvent) => {
      drag.current = { y: e.clientY, h: heightRef.current };
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* synthetic events (tests) have no capturable pointer */
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!drag.current) return;
      const dy = e.clientY - drag.current.y;
      const raw = drag.current.h + (edge === "bottom" ? dy : -dy);
      if (onCollapse && raw < min - 60) {
        drag.current = null;
        onCollapse();
        return;
      }
      const next = Math.min(max, Math.max(min, raw));
      heightRef.current = next;
      setHeight(next);
    },
    onPointerUp: () => {
      if (!drag.current) return;
      drag.current = null;
      localStorage.setItem(key, String(heightRef.current));
    },
  };

  return { height, handleProps };
}
