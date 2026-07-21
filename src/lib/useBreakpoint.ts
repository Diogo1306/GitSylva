import { useEffect, useState } from "react";

// Task 6 ("Layout na janela mínima"): consolidates the app's width/height
// driven layout decisions in one place. The window floor is 900x560
// (src-tauri/tauri.conf.json — do not lower it); everything below "wide" is a
// responsive concession for that floor and the sizes on the way back up to it
// (verified conceptually at 900x560 / 1024x640 / 1200x800 / 1440x900).
//
// Thresholds (picked per the task brief's own suggestions, documented here as
// the single source of truth instead of scattering more matchMedia calls):
//   - "min"    (<1024px wide): sidebar defaults to collapsed, History's
//     commit detail moves below the list instead of beside it, secondary
//     chrome hides.
//   - "compact" (1024–1179px wide): sidebar/History stay at full layout, but
//     secondary chrome (avatars, footer stats, muted labels) still hides —
//     matches the pre-existing .gs-resp-time 1180px threshold in shell.css.
//   - "comfortable" (1180–1439px) / "wide" (>=1440px): full layout.
// `workingCopyStacked` keeps the WorkingCopy split's pre-existing 980px
// threshold (previously its own local matchMedia) unchanged.
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

// The window IS the viewport in Tauri (single-window app) — window resize is
// the right (and only) signal, no ResizeObserver/element needed.
export function useBreakpoint(): Breakpoint {
  const [state, setState] = useState(() => layoutForSize(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const onResize = () => setState(layoutForSize(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return state;
}
