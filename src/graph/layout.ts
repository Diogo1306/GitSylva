import type { Commit } from "../lib/types";

// Per-row layout for the design's graph renderer: the lane each commit
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
    // Every lane waiting for this commit: a branch point has one lane per
    // child still drawing its line down to this row (see the fork rule
    // below). The node sits on the lowest of them; all are released here.
    const waiting: number[] = [];
    lanes.forEach((h, idx) => {
      if (h === commit.hash) waiting.push(idx);
    });
    const lane = waiting.length > 0 ? waiting[0] : claim(commit.hash);
    for (const idx of waiting) lanes[idx] = null;
    if (waiting.length === 0) lanes[lane] = null;

    const merge = commit.parents.length > 1;
    commit.parents.forEach((parent, k) => {
      const existing = lanes.indexOf(parent);
      if (k === 0) {
        // First parent continues in this lane. On a fork (parent already has
        // a lane elsewhere) THIS lane stays reserved down to the fork row —
        // the renderer draws that line, so nothing new may land on it. The
        // R4-era version freed it immediately and a later branch tip could
        // claim the lane and sit on top of the drawn line. A merge whose
        // first parent already has a lane curves away at once instead.
        if (existing === -1 || !merge) lanes[lane] = parent;
      } else if (existing === -1) {
        claim(parent);
      }
    });

    const parentRows = commit.parents
      .map((p) => indexOf.get(p))
      .filter((i): i is number => i !== undefined);
    out.push({ commit, lane, parentRows, merge });
  }
  return out;
}

