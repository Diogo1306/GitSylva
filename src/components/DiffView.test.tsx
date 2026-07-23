// Large-diff protections: paged rendering, backend-cap marker handling and
// the highlight limits. These are the guards against the 4–6s single-task
// freezes measured with 50k-line patches.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

// No global setup file: unmount between tests so queries (scoped to
// document.body) never see a previous test's tree.
afterEach(cleanup);
// The diff mode toggle persists to sessionStorage; start each test clean.
beforeEach(() => sessionStorage.removeItem("gitsylva-diff-mode"));
import { DiffView } from "./DiffView";
import { DIFF_PAGE_LINES, TRUNCATED_MARKER } from "../lib/diffLimits";

function makePatch(contentLines: number): string {
  let out = `diff --git a/big.ts b/big.ts\n--- a/big.ts\n+++ b/big.ts\n@@ -1,0 +1,${contentLines} @@\n`;
  for (let i = 0; i < contentLines; i++) out += `+linha ${i}\n`;
  return out;
}

describe("DiffView paging", () => {
  it("renders only the first page of a huge patch and loads more on demand", () => {
    const patch = makePatch(4000);
    const { container, getByText } = render(<DiffView patch={patch} />);
    // First page only: the row count is bounded by DIFF_PAGE_LINES, not 4000.
    expect(container.textContent).toContain("linha 0");
    expect(container.textContent).not.toContain("linha 3999");
    const more = getByText(/Mostrar mais/);
    expect(more.textContent).toContain("ocultas");
    fireEvent.click(more);
    expect(container.textContent).toContain(`linha ${DIFF_PAGE_LINES + 10}`);
  });

  it("small patches render whole, with no footer", () => {
    const { container, queryByText } = render(<DiffView patch={makePatch(20)} />);
    expect(container.textContent).toContain("linha 19");
    expect(queryByText(/Mostrar mais/)).toBeNull();
    expect(queryByText(/Carregar diff completo/)).toBeNull();
  });

  it("strips the backend truncation marker and offers the full diff", () => {
    const patch = makePatch(10) + TRUNCATED_MARKER + "\n";
    const onLoadFull = vi.fn();
    const { container, getByText } = render(<DiffView patch={patch} onLoadFull={onLoadFull} />);
    // The marker line never renders as content.
    expect(container.textContent).not.toContain("gitsylva:truncated");
    fireEvent.click(getByText("Carregar diff completo"));
    expect(onLoadFull).toHaveBeenCalledTimes(1);
  });

  it("does not offer staging for the possibly-cut last hunk", () => {
    const patch = makePatch(4000);
    const onStage = vi.fn();
    const { queryAllByText } = render(<DiffView patch={patch} onStageHunk={onStage} stageLabel="Preparar" />);
    // Single hunk, cut by paging: no stage button may appear for it.
    expect(queryAllByText("Preparar")).toHaveLength(0);
  });
});

describe("DiffView clean mode (commit detail)", () => {
  const plumbing =
    "diff --git a/x.ts b/x.ts\n" +
    "index 1111111..2222222 100644\n" +
    "--- a/x.ts\n" +
    "+++ b/x.ts\n" +
    "@@ -1,2 +1,2 @@\n" +
    "-antigo\n" +
    "+novo\n" +
    " contexto\n";

  it("strips the git plumbing lines but keeps the code", () => {
    const { container } = render(<DiffView patch={plumbing} clean />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("diff --git");
    expect(text).not.toContain("index ");
    expect(text).not.toContain("--- a/");
    expect(text).not.toContain("+++ b/");
    // The actual change stays visible.
    expect(text).toContain("novo");
    expect(text).toContain("antigo");
    expect(text).toContain("contexto");
    // The raw @@ header is replaced by a quiet range separator.
    expect(text).not.toContain("@@");
  });

  it("still shows the plumbing when clean is off", () => {
    const { container } = render(<DiffView patch={plumbing} />);
    expect(container.textContent).toContain("diff --git");
  });
});

describe("DiffView unified/split toggle is keyboard-operable", () => {
  it("renders both modes as real, focusable buttons with aria-pressed state", () => {
    const { getByRole } = render(<DiffView patch={makePatch(5)} />);
    const unified = getByRole("button", { name: "Unificado" });
    const split = getByRole("button", { name: "Lado a lado" });
    expect(unified.getAttribute("aria-pressed")).toBe("true");
    expect(split.getAttribute("aria-pressed")).toBe("false");
  });

  it("switches mode on click and on Enter/Space", () => {
    const { getByRole, container } = render(<DiffView patch={makePatch(5)} />);
    const split = getByRole("button", { name: "Lado a lado" });
    fireEvent.click(split);
    expect(split.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[style*="grid-template-columns"]')).toBeTruthy();

    fireEvent.keyDown(getByRole("button", { name: "Unificado" }), { key: "Enter" });
    expect(getByRole("button", { name: "Unificado" }).getAttribute("aria-pressed")).toBe("true");
  });
});
