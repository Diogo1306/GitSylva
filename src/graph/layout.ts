import type { Commit } from "../lib/types";

export type GraphRow = {
  commit: Commit;
  lane: number;
  edges: { fromLane: number; toLane: number }[];
};

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
