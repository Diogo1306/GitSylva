import { describe, it, expect, beforeEach } from "vitest";
import { useRecentBranchesStore } from "./recentBranchesStore";

beforeEach(() => {
  useRecentBranchesStore.setState({ byRepo: {} });
});

describe("recentBranchesStore.record", () => {
  it("records a checked-out branch, most-recent first", () => {
    useRecentBranchesStore.getState().record("/repo", "main");
    useRecentBranchesStore.getState().record("/repo", "feature/login");
    expect(useRecentBranchesStore.getState().byRepo["/repo"]).toEqual(["feature/login", "main"]);
  });

  it("de-duplicates: re-checking out a branch moves it to the front instead of repeating", () => {
    useRecentBranchesStore.getState().record("/repo", "main");
    useRecentBranchesStore.getState().record("/repo", "dev");
    useRecentBranchesStore.getState().record("/repo", "main");
    expect(useRecentBranchesStore.getState().byRepo["/repo"]).toEqual(["main", "dev"]);
  });

  it("caps the list at the max size", () => {
    for (let i = 0; i < 10; i++) useRecentBranchesStore.getState().record("/repo", `b${i}`);
    expect(useRecentBranchesStore.getState().byRepo["/repo"].length).toBeLessThanOrEqual(5);
    // Most recent (b9) survives the cap; oldest (b0) is evicted.
    expect(useRecentBranchesStore.getState().byRepo["/repo"][0]).toBe("b9");
    expect(useRecentBranchesStore.getState().byRepo["/repo"]).not.toContain("b0");
  });

  it("keeps separate lists per repo path", () => {
    useRecentBranchesStore.getState().record("/repo-a", "main");
    useRecentBranchesStore.getState().record("/repo-b", "dev");
    expect(useRecentBranchesStore.getState().byRepo["/repo-a"]).toEqual(["main"]);
    expect(useRecentBranchesStore.getState().byRepo["/repo-b"]).toEqual(["dev"]);
  });
});

describe("recentBranchesStore.clear", () => {
  it("empties only the given repo's list", () => {
    useRecentBranchesStore.getState().record("/repo-a", "main");
    useRecentBranchesStore.getState().record("/repo-b", "dev");
    useRecentBranchesStore.getState().clear("/repo-a");
    expect(useRecentBranchesStore.getState().byRepo["/repo-a"]).toEqual([]);
    expect(useRecentBranchesStore.getState().byRepo["/repo-b"]).toEqual(["dev"]);
  });
});
