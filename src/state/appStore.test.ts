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
    const id = useAppStore.getState().addGroup("Trabalho");
    useAppStore.getState().setRepoGroup("/a", id);
    useAppStore.getState().closeRepo("/a");

    expect(useAppStore.getState().groupOf["/a"]).toBeUndefined();
    expect(useAppStore.getState().repos).toHaveLength(0);
  });
});
