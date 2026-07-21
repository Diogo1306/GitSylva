import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./appStore";
import type { RepoInfo } from "../lib/types";

const repo = (path: string): RepoInfo => ({ path, current_branch: "main" } as RepoInfo);

describe("appStore repo groups", () => {
  beforeEach(() => {
    useAppStore.setState({ repos: [], repo: null, groups: [], groupOf: {} });
  });

  it("creates a group and assigns a repo to it", () => {
    const s = useAppStore.getState();
    s.setRepo(repo("/a"));
    const id = useAppStore.getState().addGroup("Trabalho");
    useAppStore.getState().setRepoGroup("/a", id);

    const st = useAppStore.getState();
    expect(st.groups).toHaveLength(1);
    expect(st.groups[0].name).toBe("Trabalho");
    expect(st.groupOf["/a"]).toBe(id);
  });

  it("clears membership when the group is removed", () => {
    const s = useAppStore.getState();
    s.setRepo(repo("/a"));
    const id = useAppStore.getState().addGroup("Trabalho");
    useAppStore.getState().setRepoGroup("/a", id);
    useAppStore.getState().removeGroup(id);

    const st = useAppStore.getState();
    expect(st.groups).toHaveLength(0);
    expect(st.groupOf["/a"]).toBeUndefined();
  });

  it("drops the grouping entry when a repo is closed", () => {
    const s = useAppStore.getState();
    s.setRepo(repo("/a"));
    useAppStore.getState().setRepo(repo("/b"));
    const id = useAppStore.getState().addGroup("Trabalho");
    useAppStore.getState().setRepoGroup("/a", id);
    useAppStore.getState().closeRepo("/a");

    expect(useAppStore.getState().groupOf["/a"]).toBeUndefined();
    expect(useAppStore.getState().repos).toHaveLength(1);
  });

  it("closing the last open repository clears it and falls back to the picker", () => {
    useAppStore.getState().setRepo(repo("/only"));
    useAppStore.getState().closeRepo("/only");

    const st = useAppStore.getState();
    expect(st.repos).toHaveLength(0);
    expect(st.repo).toBeNull();
  });

  it("closing a non-last repo activates the next open repo", () => {
    useAppStore.getState().setRepo(repo("/a"));
    useAppStore.getState().setRepo(repo("/b"));
    useAppStore.getState().setRepo(repo("/c"));
    // /c is active; close it and /b (the new last of the remaining repos)
    // should take over.
    useAppStore.getState().closeRepo("/c");

    const st = useAppStore.getState();
    expect(st.repos.map((r) => r.path)).toEqual(["/a", "/b"]);
    expect(st.repo?.path).toBe("/b");
  });

  it("closing a non-active repo leaves the active repo untouched", () => {
    useAppStore.getState().setRepo(repo("/a"));
    useAppStore.getState().setRepo(repo("/b"));
    useAppStore.getState().switchRepo("/a");
    useAppStore.getState().closeRepo("/b");

    const st = useAppStore.getState();
    expect(st.repos.map((r) => r.path)).toEqual(["/a"]);
    expect(st.repo?.path).toBe("/a");
  });
});

describe("appStore close-repo confirmation (op in progress)", () => {
  beforeEach(() => {
    useAppStore.setState({ repos: [], repo: null, groups: [], groupOf: {}, busyRepos: {}, pendingClose: null });
  });

  it("requestCloseRepo closes immediately when no Git operation is in progress", () => {
    useAppStore.getState().setRepo(repo("/a"));
    useAppStore.getState().setRepo(repo("/b"));
    useAppStore.getState().requestCloseRepo("/b");

    const st = useAppStore.getState();
    expect(st.repos.map((r) => r.path)).toEqual(["/a"]);
    expect(st.pendingClose).toBeNull();
  });

  it("requestCloseRepo does not close and sets pendingClose when the repo is busy", () => {
    useAppStore.getState().setRepo(repo("/a"));
    useAppStore.getState().setRepo(repo("/b"));
    useAppStore.getState().setRepoBusy("/b", true);
    useAppStore.getState().requestCloseRepo("/b");

    const st = useAppStore.getState();
    expect(st.repos.map((r) => r.path)).toEqual(["/a", "/b"]);
    expect(st.pendingClose).toBe("/b");
  });

  it("confirmCloseRepo closes the pending repo and clears pendingClose", () => {
    useAppStore.getState().setRepo(repo("/a"));
    useAppStore.getState().setRepo(repo("/b"));
    useAppStore.getState().setRepoBusy("/b", true);
    useAppStore.getState().requestCloseRepo("/b");
    useAppStore.getState().confirmCloseRepo();

    const st = useAppStore.getState();
    expect(st.repos.map((r) => r.path)).toEqual(["/a"]);
    expect(st.pendingClose).toBeNull();
  });

  it("cancelCloseRepo clears pendingClose without closing the repo", () => {
    useAppStore.getState().setRepo(repo("/a"));
    useAppStore.getState().setRepo(repo("/b"));
    useAppStore.getState().setRepoBusy("/b", true);
    useAppStore.getState().requestCloseRepo("/b");
    useAppStore.getState().cancelCloseRepo();

    const st = useAppStore.getState();
    expect(st.repos.map((r) => r.path)).toEqual(["/a", "/b"]);
    expect(st.pendingClose).toBeNull();
  });

  it("requestCloseRepo on the last busy repo still asks for confirmation before falling back to the picker", () => {
    useAppStore.getState().setRepo(repo("/only"));
    useAppStore.getState().setRepoBusy("/only", true);
    useAppStore.getState().requestCloseRepo("/only");
    expect(useAppStore.getState().repo?.path).toBe("/only");

    useAppStore.getState().confirmCloseRepo();
    const st = useAppStore.getState();
    expect(st.repos).toHaveLength(0);
    expect(st.repo).toBeNull();
  });
});
