import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { layoutForSize, useBreakpoint } from "./useBreakpoint";

// Task 6 ("Layout na janela mínima"): the four sizes the brief asks to verify
// conceptually — 900x560 is the window minimum (tauri.conf.json), the other
// three are checkpoints on the way back up to a comfortable layout.
describe("layoutForSize", () => {
  it("900x560 (window minimum): min breakpoint — sidebar collapsed, history stacked, secondary hidden", () => {
    const bp = layoutForSize(900, 560);
    expect(bp.name).toBe("min");
    expect(bp.sidebarCollapsed).toBe(true);
    expect(bp.historyStacked).toBe(true);
    expect(bp.hideSecondary).toBe(true);
  });

  it("1024x640: past the sidebar/history threshold, secondary chrome still hidden", () => {
    const bp = layoutForSize(1024, 640);
    expect(bp.name).toBe("compact");
    expect(bp.sidebarCollapsed).toBe(false);
    expect(bp.historyStacked).toBe(false);
    expect(bp.hideSecondary).toBe(true);
  });

  it("1200x800: comfortable — full sidebar/history layout, secondary chrome shows", () => {
    const bp = layoutForSize(1200, 800);
    expect(bp.name).toBe("comfortable");
    expect(bp.sidebarCollapsed).toBe(false);
    expect(bp.historyStacked).toBe(false);
    expect(bp.hideSecondary).toBe(false);
  });

  it("1440x900: wide — full layout", () => {
    const bp = layoutForSize(1440, 900);
    expect(bp.name).toBe("wide");
    expect(bp.sidebarCollapsed).toBe(false);
    expect(bp.historyStacked).toBe(false);
    expect(bp.hideSecondary).toBe(false);
  });

  it("keeps the pre-existing WorkingCopy 980px stack threshold (consolidated, not changed)", () => {
    expect(layoutForSize(979, 700).workingCopyStacked).toBe(true);
    expect(layoutForSize(980, 700).workingCopyStacked).toBe(false);
  });

  it("is a pure function of width/height (same input, same output)", () => {
    expect(layoutForSize(900, 560)).toEqual(layoutForSize(900, 560));
  });
});

describe("useBreakpoint", () => {
  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 768 });
  });

  it("reads the initial layout from the current window size", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 900 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 560 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.name).toBe("min");
    expect(result.current.sidebarCollapsed).toBe(true);
  });

  it("updates when the window is resized", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1440 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 900 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current.name).toBe("wide");

    act(() => {
      Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 900 });
      Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 560 });
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current.name).toBe("min");
    expect(result.current.sidebarCollapsed).toBe(true);
  });
});
