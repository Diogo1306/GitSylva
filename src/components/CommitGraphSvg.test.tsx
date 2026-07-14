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
