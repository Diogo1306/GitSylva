import type { Commit } from "../lib/types";

// Per-row layout for the design's graph renderer: the lane each commit
// sits in, the row indices of its parents (resolved within the loaded window),
// and whether it is a merge. Newest first, matching git log order.
export type GraphCommit = {
  commit: Commit;
  lane: number;
  parentRows: number[];
  merge: boolean;
  // Lanes whose parent line continues BEYOND the loaded window: a parent that
  // exists in git history but wasn't fetched into `commits`. The renderer
  // draws a fading continuation stub for each of these instead of letting
  // the line just stop with no indication (the root cause of "missing
  // lines" — a windowed parent silently dropped from parentRows).
  contLanes: number[];
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
    // Lanes whose parent falls outside the loaded window (additive; never
    // affects lane/merge computation, only which continuation stubs render).
    const contLanes: number[] = [];
    const pushCont = (l: number) => {
      if (!contLanes.includes(l)) contLanes.push(l);
    };
    commit.parents.forEach((parent, k) => {
      const existing = lanes.indexOf(parent);
      const inWindow = indexOf.has(parent);
      if (k === 0) {
        // First parent continues in this lane. On a fork (parent already has
        // a lane elsewhere) THIS lane stays reserved down to the fork row —
        // the renderer draws that line, so nothing new may land on it. The
        // R4-era version freed it immediately and a later branch tip could
        // claim the lane and sit on top of the drawn line. A merge whose
        // first parent already has a lane curves away at once instead.
        if (existing === -1 || !merge) lanes[lane] = parent;
        if (!inWindow) pushCont(lane);
      } else if (existing === -1) {
        const claimed = claim(parent);
        if (!inWindow) pushCont(claimed);
      } else if (!inWindow) {
        // Edge case: a later parent is already reserved in an out-of-window
        // lane (another branch is already heading toward the same missing
        // commit) — this merge's own line into it still needs a stub.
        pushCont(existing);
      }
    });

    const parentRows = commit.parents
      .map((p) => indexOf.get(p))
      .filter((i): i is number => i !== undefined);
    out.push({ commit, lane, parentRows, merge, contLanes });
  }
  return out;
}

