// Large-diff protections: paged rendering, backend-cap marker handling and
// the highlight limits. These are the guards against the 4–6s single-task
// freezes measured with 50k-line patches.
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";

// No global setup file: unmount between tests so queries (scoped to
// document.body) never see a previous test's tree.
afterEach(cleanup);
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
