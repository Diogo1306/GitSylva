import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { CommitGraphSvg } from "./CommitGraphSvg";
import { useThemeStore } from "../state/themeStore";
import type { GraphCommit } from "../graph/layout";

// R3 §8: adding a commit must NOT remount or re-animate the existing nodes —
// only the new commit plays its entrance.

const commit = (hash: string, parents: string[]) => ({
  hash,
  parents,
  author: "",
  email: "",
  date: "",
  subject: "",
  refs: "",
});

const row = (hash: string, parents: string[], parentRows: number[], lane = 0): GraphCommit => ({
  commit: commit(hash, parents),
  lane,
  parentRows,
  merge: parents.length > 1,
});

beforeEach(() => {
  useThemeStore.getState().resetPrefs(); // anims: true
});

describe("CommitGraphSvg incremental animation", () => {
  it("keeps existing DOM nodes and only animates the new commit", () => {
    const rows1 = [row("aaa", ["bbb"], [1]), row("bbb", [], [])];
    const { container, rerender } = render(<CommitGraphSvg rows={rows1} rowH={52} />);

    const before = container.querySelector('[data-hash="aaa"]') as SVGCircleElement;
    expect(before).toBeTruthy();
    // First mount: the full tree grows in.
    expect(before.style.animation).toContain("nodePop");

    // A new commit lands on top (indices shift by one).
    const rows2 = [row("ccc", ["aaa"], [1]), row("aaa", ["bbb"], [2]), row("bbb", [], [])];
    rerender(<CommitGraphSvg rows={rows2} rowH={52} />);

    const after = container.querySelector('[data-hash="aaa"]') as SVGCircleElement;
    // Same DOM node — the stable hash key prevented a remount…
    expect(after).toBe(before);
    // …and its entrance does NOT replay.
    expect(after.style.animation).toBe("none");
    expect((container.querySelector('[data-hash="bbb"]') as SVGCircleElement).style.animation).toBe("none");

    // Only the new commit animates.
    const fresh = container.querySelector('[data-hash="ccc"]') as SVGCircleElement;
    expect(fresh.style.animation).toContain("nodePop");
  });

  it("renders every commit statically when animations are off", () => {
    useThemeStore.getState().savePrefs({ anims: false });
    const rows = [row("aaa", ["bbb"], [1]), row("bbb", [], [])];
    const { container } = render(<CommitGraphSvg rows={rows} rowH={52} />);
    container.querySelectorAll("circle[data-hash]").forEach((c) => {
      expect((c as SVGCircleElement).style.animation).toBe("none");
    });
  });
});

describe("CommitGraphSvg entrance budget", () => {
  it("large histories animate their first rows and render the rest static", () => {
    const n = 200;
    const rows: GraphCommit[] = [];
    for (let i = 0; i < n; i++) {
      rows.push(row(`h${i}`, i + 1 < n ? [`h${i + 1}`] : [], i + 1 < n ? [i + 1] : []));
    }
    const { container } = render(<CommitGraphSvg rows={rows} rowH={52} />);
    // The signature entrance plays above the fold (the old all-or-nothing cap
    // silenced it entirely for >120-commit logs)…
    const early = container.querySelector('[data-hash="h0"]') as SVGCircleElement;
    expect(early.style.animation).toContain("nodePop");
    // …while rows past the budget render static.
    const late = container.querySelector('[data-hash="h150"]') as SVGCircleElement;
    expect(late.style.animation).toBe("none");
  });
});

describe("CommitGraphSvg windowed mode", () => {
  it("emits only the visible range but keeps the full scroll height", () => {
    const n = 2000;
    const rows: GraphCommit[] = [];
    for (let i = 0; i < n; i++) {
      rows.push(row(`h${i}`, i + 1 < n ? [`h${i + 1}`] : [], i + 1 < n ? [i + 1] : []));
    }
    const { container } = render(<CommitGraphSvg rows={rows} rowH={52} visibleRange={{ start: 100, end: 140 }} />);

    // Only the windowed rows produce nodes (41 in range vs 2000 total)…
    const nodes = container.querySelectorAll("circle[data-hash]");
    expect(nodes.length).toBe(41);
    expect(container.querySelector('[data-hash="h100"]')).toBeTruthy();
    expect(container.querySelector('[data-hash="h99"]')).toBeNull();
    expect(container.querySelector('[data-hash="h141"]')).toBeNull();

    // …while the SVG keeps the full history height so alignment holds.
    const svg = container.querySelector("svg")!;
    expect(Number(svg.getAttribute("height"))).toBe(n * 52);
  });
});
