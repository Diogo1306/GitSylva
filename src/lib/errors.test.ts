import { describe, it, expect } from "vitest";
import { classifySyncError, fetchFailureNotice } from "./errors";

// Real substrings git/the backend emits on network-op failures (see
// src-tauri/src/git/mod.rs `friendly()` and run_git's GIT_TERMINAL_PROMPT=0).
// The backend may prepend a Portuguese hint, but always keeps the original
// stderr below it — the classifier matches on that raw, stable text.

describe("classifySyncError", () => {
  it("classifies HTTPS credential failures as auth", () => {
    expect(classifySyncError("fatal: Authentication failed for 'https://github.com/x/y.git'")).toBe("auth");
    expect(
      classifySyncError("fatal: could not read Username for 'https://github.com': terminal prompts disabled"),
    ).toBe("auth");
    expect(classifySyncError("remote: Invalid username or password.\nfatal: Authentication failed")).toBe("auth");
  });

  it("classifies SSH credential failures as auth", () => {
    expect(
      classifySyncError("git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository."),
    ).toBe("auth");
    expect(
      classifySyncError("Host key verification failed.\r\nfatal: Could not read from remote repository."),
    ).toBe("auth");
  });

  it("classifies an HTTP 403 as auth", () => {
    expect(classifySyncError("fatal: unable to access 'https://github.com/x/y.git/': The requested URL returned error: 403")).toBe(
      "auth",
    );
  });

  it("does not misclassify a hash containing the digits 403 as auth", () => {
    expect(classifySyncError("fatal: reference is not a tree: eb4033ffabc")).not.toBe("auth");
  });

  it("classifies unreachable-remote failures as network", () => {
    expect(
      classifySyncError("fatal: unable to access 'https://github.com/x/y.git/': Could not resolve host: github.com"),
    ).toBe("network");
    expect(classifySyncError("ssh: connect to host github.com port 22: Connection refused")).toBe("network");
    expect(classifySyncError("fatal: unable to access 'https://x': Failed to connect to github.com port 443")).toBe(
      "network",
    );
  });

  it("classifies merge/rebase conflicts as conflict", () => {
    // The REAL string the frontend now receives for a merge-mode pull
    // conflict: the backend's `combine_git_streams` (src-tauri/src/git/mod.rs)
    // joins git's stderr fetch summary with the STDOUT conflict text, because
    // git prints "CONFLICT ..."/"Automatic merge failed ..." to STDOUT and the
    // old code (stderr-only) dropped it. Verified end-to-end by the cargo test
    // `pull_merge_conflict_surfaces_conflict_text`.
    const realMergeConflict =
      "From https://github.com/example/repo\n" +
      " * branch            main       -> FETCH_HEAD\n" +
      "Auto-merging a.txt\n" +
      "CONFLICT (content): Merge conflict in a.txt\n" +
      "Automatic merge failed; fix conflicts and then commit the result.";
    expect(classifySyncError(realMergeConflict)).toBe("conflict");
    expect(classifySyncError("erro: conflito ao aplicar o commit")).toBe("conflict");
  });

  it("classifies pull rejected for diverging ff-only as other", () => {
    expect(
      classifySyncError("fatal: Not possible to fast-forward, aborting."),
    ).toBe("other");
  });

  it("falls back to other for unrecognized stderr", () => {
    expect(classifySyncError("")).toBe("other");
    expect(classifySyncError("fatal: something unexpected happened")).toBe("other");
  });

  it("classifies with the backend's Portuguese hint still present (hint prefix + raw stderr below)", () => {
    const msg =
      "Autenticação necessária: configura credenciais git (credential manager) ou usa um URL SSH com chave carregada.\nfatal: could not read Username for 'https://github.com': terminal prompts disabled";
    expect(classifySyncError(msg)).toBe("auth");
  });
});

// Fetch has no dedicated modal — it is a one-shot action wired to a top-right
// notification in several places (Titlebar, Sidebar, CommandPalette,
// AppShell shortcut). This gives every one of those call sites the same
// distinct auth-needed title without duplicating classification logic.
describe("fetchFailureNotice", () => {
  it("gives an actionable, distinct title for an auth failure and keeps the raw message", () => {
    const n = fetchFailureNotice({ message: "fatal: Authentication failed for 'https://github.com/x/y.git'" });
    expect(n.title).toBe("Autenticação necessária");
    // Raw git detail must survive, not be swallowed by the canned guidance.
    expect(n.sub).toContain("fatal: Authentication failed for 'https://github.com/x/y.git'");
  });

  it("gives a distinct title for a network failure", () => {
    const n = fetchFailureNotice({ message: "fatal: unable to access 'https://x': Could not resolve host: github.com" });
    expect(n.title).toBe("Sem ligação ao remoto");
  });

  it("falls back to the generic fetch-failed title for anything else", () => {
    const n = fetchFailureNotice({ message: "fatal: something unexpected happened" });
    expect(n.title).toBe("Fetch falhou");
    expect(n.sub).toBe("fatal: something unexpected happened");
  });

  it("uses a safe fallback message when the error carries none", () => {
    const n = fetchFailureNotice({});
    expect(n.sub).toBe("não foi possível fazer fetch");
  });
});
