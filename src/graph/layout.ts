import type { Commit } from "../lib/types";

export type GraphRow = {
  commit: Commit;
  lane: number;
  edges: { fromLane: number; toLane: number }[];
};

// Richer per-row layout for the design's graph renderer: the lane each commit
// sits in, the row indices of its parents (resolved within the loaded window),
// and whether it is a merge. Newest first, matching git log order.
export type GraphCommit = {
  commit: Commit;
  lane: number;
  parentRows: number[];
  merge: boolean;
};

export function graphRows(commits: Commit[]): GraphCommit[] {
  const indexOf = new Map<string, number>();
  commits.forEach((c, i) => indexOf.set(c.hash, i));

  const lanes: (string | null)[] = [];
  const claim = (hash: string): number => {
    const free = lanes.indexOf(null);
    if (free !== -1) {
      lanes[free] = hash;
      return free;
    }
    lanes.push(hash);
    return lanes.length - 1;
  };

  const out: GraphCommit[] = [];
  for (const commit of commits) {
    let lane = lanes.indexOf(commit.hash);
    if (lane === -1) lane = claim(commit.hash);
    // Free this lane, then let the first parent reuse it and others claim lanes.
    lanes[lane] = null;
    commit.parents.forEach((parent, k) => {
      let target = lanes.indexOf(parent);
      if (target === -1) {
        target = k === 0 ? lane : claim(parent);
        lanes[target] = parent;
      }
    });
    const parentRows = commit.parents
      .map((p) => indexOf.get(p))
      .filter((i): i is number => i !== undefined);
    out.push({ commit, lane, parentRows, merge: commit.parents.length > 1 });
  }
  return out;
}

// Simple lane assignment walking newest to oldest.
// `lanes[i]` holds the hash the lane i is currently waiting to place.
export function layoutGraph(commits: Commit[]): GraphRow[] {
  const lanes: (string | null)[] = [];
  const rows: GraphRow[] = [];

  const claim = (hash: string): number => {
    const free = lanes.indexOf(null);
    if (free !== -1) {
      lanes[free] = hash;
      return free;
    }
    lanes.push(hash);
    return lanes.length - 1;
  };

  for (const commit of commits) {
    let lane = lanes.indexOf(commit.hash);
    if (lane === -1) lane = claim(commit.hash);

    const edges: { fromLane: number; toLane: number }[] = [];
    // The current lane is freed, then reused by the first parent.
    lanes[lane] = null;
    commit.parents.forEach((parent, i) => {
      let target = lanes.indexOf(parent);
      if (target === -1) {
        target = i === 0 ? lane : claim(parent);
        lanes[target] = parent;
      }
      edges.push({ fromLane: lane, toLane: target });
    });

    rows.push({ commit, lane, edges });
  }
  return rows;
}
