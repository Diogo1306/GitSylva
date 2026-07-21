import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Modals } from "./Modals";
import { useAppStore } from "../../state/appStore";
import type { RepoInfo } from "../../lib/types";

// Task 4: the Field helper now binds a real <label htmlFor> to the wrapped
// Input's id, so every modal field must be reachable via getByLabelText.

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    listBranches: vi.fn().mockResolvedValue([]),
  };
});

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa", is_empty: false };

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Modals />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAppStore.setState({ repo, repos: [repo], modal: null });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], modal: null });
});

describe("Modals: labelled fields", () => {
  it("BranchModal's name input has an associated label", () => {
    useAppStore.setState({ modal: "branch" });
    renderModal();
    const input = screen.getByLabelText("Nome da branch") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.id).toBeTruthy();
  });

  it("StashModal's message input has an associated label", () => {
    useAppStore.setState({ modal: "stash" });
    renderModal();
    expect(screen.getByLabelText("Mensagem (opcional)")).toBeTruthy();
  });

  it("TagModal's name and message inputs have associated labels", () => {
    useAppStore.setState({ modal: "tag" });
    renderModal();
    expect(screen.getByLabelText("Nome")).toBeTruthy();
    expect(screen.getByLabelText("Mensagem (opcional · cria uma tag anotada)")).toBeTruthy();
  });

  it("does not disable the outline inline on a labelled modal input (focus ring must survive)", () => {
    useAppStore.setState({ modal: "branch" });
    renderModal();
    const input = screen.getByLabelText("Nome da branch") as HTMLInputElement;
    expect(input.style.outline).not.toBe("none");
  });
});
