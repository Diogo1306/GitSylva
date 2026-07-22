import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ForestBackdrop } from "./ForestBackdrop";
import { useThemeStore } from "../state/themeStore";

type MinimalMediaQueryList = Pick<MediaQueryList, "matches" | "addEventListener" | "removeEventListener">;

function mockReducedMotion(matches: boolean): void {
  const mql: MinimalMediaQueryList = {
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => mql as MediaQueryList,
  });
}

const hadMatchMedia = typeof window.matchMedia === "function";

beforeEach(() => {
  useThemeStore.getState().resetPrefs(); // anims: true, treeStyle: "normal"
});

afterEach(() => {
  if (!hadMatchMedia) {
    // jsdom doesn't implement matchMedia by default; restore that baseline
    // so a mock set by one test never leaks into the next test file.
    Reflect.deleteProperty(window, "matchMedia");
  }
});

describe("ForestBackdrop", () => {
  it("renders boughs and falling leaves without throwing", () => {
    const { container } = render(<ForestBackdrop />);
    expect(container.querySelector(".gs-ambient")).toBeTruthy();
    expect(container.querySelectorAll("[data-forest-bough]").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[data-forest-leaf]").length).toBeGreaterThan(0);
  });

  it("opts into the shared pause-on-hidden mechanism (.gs-ambient, matches FallingLeaves/EphemeralLeaves)", () => {
    const { container } = render(<ForestBackdrop />);
    expect(container.firstElementChild?.className).toContain("gs-ambient");
  });

  it("animates sway and leafFall when animations are enabled and motion isn't reduced", () => {
    const { container } = render(<ForestBackdrop />);
    container.querySelectorAll("[data-forest-bough]").forEach((el) => {
      expect((el as SVGGElement).style.animation).toContain("sway");
    });
    container.querySelectorAll("[data-forest-leaf]").forEach((el) => {
      expect((el as HTMLDivElement).style.animation).toContain("leafFall");
    });
  });

  it("stays visible but static (no animation style) when the anims toggle is off", () => {
    useThemeStore.getState().savePrefs({ anims: false });
    const { container } = render(<ForestBackdrop />);
    container.querySelectorAll("[data-forest-bough]").forEach((el) => {
      expect((el as SVGGElement).style.animation).toBe("none");
    });
    container.querySelectorAll("[data-forest-leaf]").forEach((el) => {
      expect((el as HTMLDivElement).style.animation).toBe("none");
    });
    // Paused, not unmounted: the geometry (boughs + leaves) still renders.
    expect(container.querySelectorAll("[data-forest-bough]").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("[data-forest-leaf]").length).toBeGreaterThan(0);
  });

  it("stays visible but static when the OS prefers reduced motion, even with anims on", () => {
    mockReducedMotion(true);
    const { container } = render(<ForestBackdrop />);
    container.querySelectorAll("[data-forest-bough]").forEach((el) => {
      expect((el as SVGGElement).style.animation).toBe("none");
    });
    container.querySelectorAll("[data-forest-leaf]").forEach((el) => {
      expect((el as HTMLDivElement).style.animation).toBe("none");
    });
  });

  it("animates again once reduced-motion is explicitly false, matchMedia present", () => {
    mockReducedMotion(false);
    const { container } = render(<ForestBackdrop />);
    const bough = container.querySelector("[data-forest-bough]") as SVGGElement;
    expect(bough.style.animation).toContain("sway");
  });

  it("does not throw when window.matchMedia is unavailable (default jsdom / older webviews)", () => {
    Reflect.deleteProperty(window, "matchMedia");
    expect(() => render(<ForestBackdrop />)).not.toThrow();
  });

  it("follows the tree style for its leaf marks, like FallingLeaves", () => {
    useThemeStore.getState().savePrefs({ treeStyle: "grafo" });
    const { container } = render(<ForestBackdrop />);
    // The "grafo" mark is a circle (commit-node motif), not the default leaf path.
    const faller = container.querySelector("[data-forest-leaf]") as HTMLDivElement;
    expect(faller.querySelector("circle")).toBeTruthy();
    expect(faller.querySelector("path")).toBeNull();
  });
});
