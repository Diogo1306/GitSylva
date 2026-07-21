import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RepoPicker } from "./RepoPicker";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";

// Task 4: form labels + keyboard accessibility. Every clone/create/add input
// must be resolvable via getByLabelText, and the recents list + tab/action
// controls must be fully keyboard operable (no <div onClick> left).

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    pickFolder: vi.fn().mockResolvedValue(null),
    openRepo: vi.fn().mockResolvedValue({ path: "/repo/a", current_branch: "main", head: "aaa", is_empty: false }),
    initRepo: vi.fn().mockResolvedValue({ path: "/repo/b", current_branch: "main", head: "bbb", is_empty: false }),
    cloneRepo: vi.fn().mockResolvedValue({ path: "/repo/c", current_branch: "main", head: "ccc", is_empty: false }),
  };
});

beforeEach(() => {
  useAppStore.setState({ repo: null, repos: [], view: "picker", prevView: "history" });
  useRecentsStore.setState({ recents: [] });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], view: "history", prevView: "history" });
  useRecentsStore.setState({ recents: [] });
});

describe("RepoPicker: labelled inputs", () => {
  it("the local recents search input has an associated label", () => {
    render(<RepoPicker />);
    expect(screen.getByLabelText(/Procurar/)).toBeTruthy();
  });

  it("the add-existing path input has an associated label", () => {
    render(<RepoPicker />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.getByLabelText("Caminho da pasta (com .git)")).toBeTruthy();
  });

  it("the create-repo name and root-folder inputs have associated labels", () => {
    render(<RepoPicker />);
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(screen.getByLabelText("Nome")).toBeTruthy();
    expect(screen.getByLabelText("Pasta raiz")).toBeTruthy();
  });

  it("the clone URL and destination-folder inputs have associated labels", () => {
    render(<RepoPicker />);
    fireEvent.click(screen.getByRole("button", { name: "Clonar" }));
    expect(screen.getByLabelText("URL de origem")).toBeTruthy();
    expect(screen.getByLabelText("Pasta de destino")).toBeTruthy();
  });
});

describe("RepoPicker: keyboard operability", () => {
  it("tab strip entries are real, Tab-reachable buttons that switch tabs on click", () => {
    render(<RepoPicker />);
    const clone = screen.getByRole("button", { name: "Clonar" });
    expect(clone.tagName).toBe("BUTTON");
    expect(clone.tabIndex).toBe(0);
    fireEvent.click(clone);
    expect(screen.getByLabelText("URL de origem")).toBeTruthy();
  });

  it("Enter on a tab strip button switches tabs (no div onClick left)", () => {
    render(<RepoPicker />);
    const add = screen.getByRole("button", { name: "Adicionar" });
    fireEvent.keyDown(add, { key: "Enter" });
    expect(screen.getByLabelText("Caminho da pasta (com .git)")).toBeTruthy();
  });

  it("renders each recent repo as a real, focusable row", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    // The row's own accessible name includes both the repo name and the
    // branch chip text; the separate remove button's name does not include
    // "main", so this regex disambiguates the two.
    const row = screen.getByRole("button", { name: /meurepo.*main/ });
    expect(row.tabIndex).toBe(0);
  });

  it("Enter on a recent row opens it (same as click)", async () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    const row = screen.getByRole("button", { name: /meurepo.*main/ });
    fireEvent.keyDown(row, { key: "Enter" });
    await vi.waitFor(() => expect(useAppStore.getState().repo?.path).toBe("/repo/a"));
  });

  it("the per-row remove button is independently focusable and does not also open the repo", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    const remove = screen.getByRole("button", { name: /Remover meurepo/ });
    expect(remove.tagName).toBe("BUTTON");
    fireEvent.click(remove);
    expect(useRecentsStore.getState().recents).toHaveLength(0);
    expect(useAppStore.getState().repo).toBeNull();
  });

  it("Enter on the per-row remove button does not bubble into the row's own select", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    const remove = screen.getByRole("button", { name: /Remover meurepo/ });
    remove.focus();
    fireEvent.keyDown(remove, { key: "Enter" });
    expect(useRecentsStore.getState().recents).toHaveLength(0);
    expect(useAppStore.getState().repo).toBeNull();
  });

  it("the primary action buttons (Adicionar/Criar/Clonar) are real buttons reachable by Tab", () => {
    render(<RepoPicker />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    // Two "Adicionar"-named buttons now exist (tab strip + submit).
    const submits = screen.getAllByRole("button", { name: "Adicionar" });
    expect(submits).toHaveLength(2);
    expect(submits.every((b) => b.tagName === "BUTTON" && b.tabIndex === 0)).toBe(true);
  });

  it("does not disable the outline inline on any new interactive control (focus ring must survive)", () => {
    render(<RepoPicker />);
    const clone = screen.getByRole("button", { name: "Clonar" });
    expect((clone as HTMLElement).style.outline).not.toBe("none");
  });
});

describe("RepoPicker: accent-tolerant recents search", () => {
  it("finds an accented recent when searching without accents", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "código-base", branch: "main" }] });
    render(<RepoPicker />);
    fireEvent.change(screen.getByLabelText(/Procurar/), { target: { value: "codigo" } });
    expect(screen.getByRole("button", { name: /código-base.*main/ })).toBeTruthy();
  });

  it("finds a plain recent when searching with accents", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "historico", branch: "main" }] });
    render(<RepoPicker />);
    fireEvent.change(screen.getByLabelText(/Procurar/), { target: { value: "histórico" } });
    expect(screen.getByRole("button", { name: /historico.*main/ })).toBeTruthy();
  });
});

describe("RepoPicker: empty search state with suggestion", () => {
  it("offers to open or clone when a recents search matches nothing", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    fireEvent.change(screen.getByLabelText(/Procurar/), { target: { value: "zzz-no-such-thing-zzz" } });
    expect(screen.getByText(/Nenhum recente corresponde/)).toBeTruthy();
    // Wired to the real clone flow (existing "Clonar" tab), not a fabricated action.
    fireEvent.click(screen.getByRole("button", { name: "Clonar…" }));
    expect(screen.getByLabelText("URL de origem")).toBeTruthy();
  });

  it("still shows the plain 'no recents yet' message when there are no recents at all", () => {
    render(<RepoPicker />);
    expect(screen.getByText("Ainda sem repositórios recentes.")).toBeTruthy();
    expect(screen.queryByText(/Nenhum recente corresponde/)).toBeNull();
  });
});
