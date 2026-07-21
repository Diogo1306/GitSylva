import { describe, it, expect } from "vitest";
import { N_COMMITS, hash } from "./mockGit";

describe("mockGit", () => {
  it("generates unique commit hashes for all commits", () => {
    const hashes = new Set<string>();
    for (let i = 0; i < N_COMMITS; i++) {
      hashes.add(hash(i));
    }
    expect(hashes.size).toBe(N_COMMITS);
  });
});
