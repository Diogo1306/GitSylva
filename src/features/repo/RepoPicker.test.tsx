import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RepoPicker } from "./RepoPicker";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";
import { openRepo, initRepo, scanLocalRepos } from "../../lib/api";

// Task 4 (+ Floresta v2 §8 rework): form labels + keyboard accessibility, plus
// the 3-tab Local/Clonar/Criar picker with a recents+scan grid. Every
// clone/create input must be resolvable via getByLabelText, and the grid rows
// + tab/action controls must be fully keyboard operable (no <div onClick> left).

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    pickFolder: vi.fn().mockResolvedValue(null),
    openRepo: vi.fn().mockResolvedValue({ path: "/repo/a", current_branch: "main", head: "aaa", is_empty: false }),
    initRepo: vi.fn().mockResolvedValue({ path: "/repo/b", current_branch: "main", head: "bbb", is_empty: false }),
    cloneRepo: vi.fn().mockResolvedValue({ path: "/repo/c", current_branch: "main", head: "ccc", is_empty: false }),
    // Defaults to an empty scan (no ~/dev to read under jsdom); individual
    // tests override with mockResolvedValueOnce to exercise the grid.
    scanLocalRepos: vi.fn().mockResolvedValue([]),
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
  vi.clearAllMocks();
});

describe("RepoPicker: labelled inputs", () => {
  it("the local search input has an associated label", () => {
    render(<RepoPicker />);
    expect(screen.getByLabelText(/Procurar/)).toBeTruthy();
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

describe("RepoPicker: only 3 tabs (Local/Clonar/Criar)", () => {
  it("has exactly Local, Clonar and Criar in the tab strip", () => {
    render(<RepoPicker />);
    expect(screen.getByRole("button", { name: "Local" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clonar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Criar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remoto" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Adicionar" })).toBeNull();
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
    const create = screen.getByRole("button", { name: "Criar" });
    fireEvent.keyDown(create, { key: "Enter" });
    expect(screen.getByLabelText("Nome")).toBeTruthy();
  });

  it("renders each recent repo as a real, focusable row", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    // The row's own accessible name includes the repo name, its "Abrir" state
    // badge and the branch chip text; the separate remove button's name does
    // not include "main", so this regex disambiguates the two.
    const row = screen.getByRole("button", { name: /meurepo.*main/ });
    expect(row.tabIndex).toBe(0);
  });

  it("Enter on a recent row opens it (same as click)", async () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    const row = screen.getByRole("button", { name: /meurepo.*main/ });
    fireEvent.keyDown(row, { key: "Enter" });
    await vi.waitFor(() => expect(useAppStore.getState().repo?.path).toBe("/repo/a"));
    // Opening a local repo switches straight to its History (checklist §8).
    expect(useAppStore.getState().view).toBe("history");
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

  it("the primary action buttons (Criar/Clonar) are real buttons reachable by Tab", () => {
    render(<RepoPicker />);
    fireEvent.click(screen.getByRole("button", { name: "Clonar" }));
    // Two "Clonar"-named buttons now exist (tab strip + submit).
    const submits = screen.getAllByRole("button", { name: "Clonar" });
    expect(submits).toHaveLength(2);
    expect(submits.every((b) => b.tagName === "BUTTON" && b.tabIndex === 0)).toBe(true);
  });

  it("does not disable the outline inline on any new interactive control (focus ring must survive)", () => {
    render(<RepoPicker />);
    const clone = screen.getByRole("button", { name: "Clonar" });
    expect((clone as HTMLElement).style.outline).not.toBe("none");
  });
});

describe("RepoPicker: accent-tolerant search", () => {
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

describe("RepoPicker: empty/no-match state", () => {
  it("offers to open by path or clone when a search matches nothing", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    fireEvent.change(screen.getByLabelText(/Procurar/), { target: { value: "zzz-no-such-thing-zzz" } });
    expect(screen.getByText(/Nada encontrado/)).toBeTruthy();
    // Wired to the real clone flow (existing "Clonar" tab), not a fabricated action.
    fireEvent.click(screen.getByRole("button", { name: "Clonar…" }));
    expect(screen.getByLabelText("URL de origem")).toBeTruthy();
  });

  it("still shows the plain 'no local repos yet' message when there is nothing at all", () => {
    render(<RepoPicker />);
    expect(screen.getByText("Ainda sem repositórios locais.")).toBeTruthy();
    expect(screen.queryByText(/Nada encontrado/)).toBeNull();
  });

  it("opens the typed text directly as a path when nothing matches (preserves open-by-path)", async () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    fireEvent.change(screen.getByLabelText(/Procurar/), { target: { value: "/some/typed/path" } });
    fireEvent.click(screen.getByRole("button", { name: "Abrir caminho: /some/typed/path" }));
    await vi.waitFor(() => expect(openRepo).toHaveBeenCalledWith("/some/typed/path"));
    await vi.waitFor(() => expect(useAppStore.getState().view).toBe("history"));
  });
});

describe("RepoPicker: Local grid states (Já aberto / Abrir / Inicializar)", () => {
  it("badges a not-yet-open recent as Abrir", () => {
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    expect(screen.getByText("Abrir")).toBeTruthy();
  });

  it("badges an already-open repo as Já aberto and switches to it without re-opening", async () => {
    useAppStore.setState({
      repos: [{ path: "/repo/x", current_branch: "main", head: "existing-head", is_empty: false }],
      repo: null,
      view: "picker",
      prevView: "history",
    });
    useRecentsStore.setState({ recents: [{ path: "/repo/x", name: "meurepo", branch: "main" }] });
    render(<RepoPicker />);
    expect(screen.getByText("Já aberto")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /meurepo.*main/ }));
    // switchRepo picks the already-open entry — openRepo is never invoked again.
    expect(openRepo).not.toHaveBeenCalled();
    expect(useAppStore.getState().repo?.head).toBe("existing-head");
    expect(useAppStore.getState().view).toBe("history");
  });

  it("badges a scanned plain folder as Inicializar and git-inits it in place on click", async () => {
    vi.mocked(scanLocalRepos).mockResolvedValueOnce([{ path: "/dev/newproj", name: "newproj", is_repo: false }]);
    render(<RepoPicker />);
    const row = await screen.findByRole("button", { name: /newproj.*Inicializar/ });
    fireEvent.click(row);
    await vi.waitFor(() => expect(initRepo).toHaveBeenCalledWith("/dev", "newproj"));
    await vi.waitFor(() => expect(useAppStore.getState().view).toBe("history"));
  });

  it("scanned folders that are already repos are offered as Abrir, not duplicated with a matching recent", async () => {
    useRecentsStore.setState({ recents: [{ path: "/dev/meurepo", name: "meurepo", branch: "main" }] });
    vi.mocked(scanLocalRepos).mockResolvedValueOnce([{ path: "/dev/meurepo", name: "meurepo", is_repo: true }]);
    render(<RepoPicker />);
    // Give the scan effect a tick to resolve, then assert no duplicate tile appeared.
    await vi.waitFor(() => expect(scanLocalRepos).toHaveBeenCalled());
    expect(screen.getAllByText("meurepo")).toHaveLength(1);
  });
});
