import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Modals } from "./Modals";
import { useAppStore } from "../../state/appStore";
import { useNotificationStore } from "../../state/notificationStore";
import type { RepoInfo, Commit } from "../../lib/types";
import { fetchRemote, syncStatus, pull, push, outgoing, incoming } from "../../lib/api";

// Task 4: the Field helper now binds a real <label htmlFor> to the wrapped
// Input's id, so every modal field must be reachable via getByLabelText.

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    listBranches: vi.fn().mockResolvedValue([]),
    fetchRemote: vi.fn(),
    syncStatus: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    outgoing: vi.fn(),
    incoming: vi.fn(),
  };
});

function mkCommit(hash: string, subject = "commit"): Commit {
  return { hash, parents: [], author: "Ana", email: "ana@x.com", date: new Date().toISOString(), subject, refs: "" };
}

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
  // Sync failures raise notifications (conflict); clear the stack so a card
  // from one test can't leak into the next test's assertions.
  useNotificationStore.setState({ notifications: [] });
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

describe("PullModal: pre-action explanation and sync states", () => {
  beforeEach(() => {
    vi.mocked(fetchRemote).mockResolvedValue(undefined);
    vi.mocked(syncStatus).mockResolvedValue({ ahead: 0, behind: 2, upstream: "origin/main" });
    vi.mocked(incoming).mockResolvedValue([mkCommit("a1"), mkCommit("a2")]);
  });

  it("explains what a pull will do: source (upstream), destination (branch) and the count", async () => {
    useAppStore.setState({ modal: "pull" });
    renderModal();
    expect(await screen.findByText("Pull vai integrar 2 commit(s) de origin/main em main.")).toBeTruthy();
  });

  it("says the branch is up to date when there is nothing incoming", async () => {
    vi.mocked(syncStatus).mockResolvedValue({ ahead: 0, behind: 0, upstream: "origin/main" });
    vi.mocked(incoming).mockResolvedValue([]);
    useAppStore.setState({ modal: "pull" });
    renderModal();
    expect(await screen.findByText("main está atualizado com origin/main.")).toBeTruthy();
  });

  it("shows a distinct authentication-needed message on a credential failure, not the generic error text", async () => {
    vi.mocked(pull).mockRejectedValue({ message: "fatal: could not read Username for 'https://github.com': terminal prompts disabled" });
    useAppStore.setState({ modal: "pull" });
    renderModal();
    await screen.findByText("Pull vai integrar 2 commit(s) de origin/main em main.");
    fireEvent.click(screen.getByRole("button", { name: "Fazer pull" }));
    expect(await screen.findByText("Autenticação necessária")).toBeTruthy();
    expect(screen.queryByText("não foi possível fazer pull")).toBeNull();
  });

  it("shows a distinct network message (not the auth message) when the remote is unreachable", async () => {
    vi.mocked(pull).mockRejectedValue({ message: "fatal: unable to access 'https://github.com/x/y.git/': Could not resolve host: github.com" });
    useAppStore.setState({ modal: "pull" });
    renderModal();
    await screen.findByText("Pull vai integrar 2 commit(s) de origin/main em main.");
    fireEvent.click(screen.getByRole("button", { name: "Fazer pull" }));
    expect(await screen.findByText("Sem ligação ao remoto")).toBeTruthy();
    expect(screen.queryByText("Autenticação necessária")).toBeNull();
  });

  it("keeps unclassified pull failures as a plain, generic error", async () => {
    vi.mocked(pull).mockRejectedValue({ message: "fatal: something unexpected happened" });
    useAppStore.setState({ modal: "pull" });
    renderModal();
    await screen.findByText("Pull vai integrar 2 commit(s) de origin/main em main.");
    fireEvent.click(screen.getByRole("button", { name: "Fazer pull" }));
    expect(await screen.findByText("fatal: something unexpected happened")).toBeTruthy();
    expect(screen.queryByText("Autenticação necessária")).toBeNull();
  });

  it("renders a distinct conflict state and raises a conflict notification on a merge conflict", async () => {
    // The real combined stdout+stderr the backend now sends for a merge-mode
    // pull conflict (see combine_git_streams / the cargo conflict fixture).
    vi.mocked(pull).mockRejectedValue({
      message:
        "From https://github.com/example/repo\n * branch main -> FETCH_HEAD\nAuto-merging a.txt\nCONFLICT (content): Merge conflict in a.txt\nAutomatic merge failed; fix conflicts and then commit the result.",
    });
    useAppStore.setState({ modal: "pull" });
    renderModal();
    await screen.findByText("Pull vai integrar 2 commit(s) de origin/main em main.");
    fireEvent.click(screen.getByRole("button", { name: "Fazer pull" }));
    // Distinct conflict panel copy, not the auth/network/generic text.
    expect(await screen.findByText("Conflito ao integrar")).toBeTruthy();
    expect(screen.queryByText("Autenticação necessária")).toBeNull();
    // Side effect: the conflict notification is raised.
    expect(useNotificationStore.getState().notifications.some((n) => n.title === "Conflitos no pull")).toBe(true);
  });

  it("exposes inline help for the active pull mode", async () => {
    useAppStore.setState({ modal: "pull" });
    renderModal();
    await screen.findByText("Pull vai integrar 2 commit(s) de origin/main em main.");
    const help = screen.getByLabelText(/Sobre o modo/i);
    fireEvent.focus(help);
    expect(await screen.findByRole("tooltip")).toBeTruthy();
  });
});

describe("PushModal: pre-action explanation and sync states", () => {
  beforeEach(() => {
    vi.mocked(syncStatus).mockResolvedValue({ ahead: 3, behind: 0, upstream: "origin/main" });
    vi.mocked(outgoing).mockResolvedValue([mkCommit("b1"), mkCommit("b2"), mkCommit("b3")]);
  });

  it("explains what a push will do: source (branch), destination (upstream) and the count", async () => {
    useAppStore.setState({ modal: "push" });
    renderModal();
    expect(await screen.findByText("Push vai enviar 3 commit(s) de main para origin/main.")).toBeTruthy();
  });

  it("shows a distinct authentication-needed message on a credential failure, not the generic error text", async () => {
    vi.mocked(push).mockRejectedValue({ message: "git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository." });
    useAppStore.setState({ modal: "push" });
    renderModal();
    await screen.findByText("Push vai enviar 3 commit(s) de main para origin/main.");
    fireEvent.click(screen.getByRole("button", { name: "Fazer push" }));
    expect(await screen.findByText("Autenticação necessária")).toBeTruthy();
    expect(screen.queryByText("não foi possível fazer push")).toBeNull();
  });
});
