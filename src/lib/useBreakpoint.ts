import { useEffect, useState } from "react";

// Central width/height-driven layout decisions. Window floor is 900x560 (src-tauri/tauri.conf.json — do not lower); the threshold constants below are the single source of truth.
export type BreakpointName = "min" | "compact" | "comfortable" | "wide";

export interface Breakpoint {
  name: BreakpointName;
  width: number;
  height: number;
  /** Sidebar's width-driven default: collapsed to an icon rail below this width. */
  sidebarCollapsed: boolean;
  /** History's commit detail renders below the list instead of beside it. */
  historyStacked: boolean;
  /** WorkingCopy's file/diff split stacks vertically. */
  workingCopyStacked: boolean;
  /** Secondary/decorative chrome (avatars, footer stats, muted labels) hides. */
  hideSecondary: boolean;
}

const SIDEBAR_COLLAPSE_MAX = 1024;
const HISTORY_STACK_MAX = 1024;
const WORKING_COPY_STACK_MAX = 980;
const HIDE_SECONDARY_MAX = 1180;
const WIDE_MIN = 1440;

export function layoutForSize(width: number, height: number): Breakpoint {
  const name: BreakpointName =
    width < SIDEBAR_COLLAPSE_MAX ? "min" : width < HIDE_SECONDARY_MAX ? "compact" : width < WIDE_MIN ? "comfortable" : "wide";
  return {
    name,
    width,
    height,
    sidebarCollapsed: width < SIDEBAR_COLLAPSE_MAX,
    historyStacked: width < HISTORY_STACK_MAX,
    workingCopyStacked: width < WORKING_COPY_STACK_MAX,
    hideSecondary: width < HIDE_SECONDARY_MAX,
  };
}

// The window is the viewport in Tauri (single-window app); resize is the only signal needed.
export function useBreakpoint(): Breakpoint {
  const [state, setState] = useState(() => layoutForSize(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const onResize = () => setState(layoutForSize(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return state;
}
