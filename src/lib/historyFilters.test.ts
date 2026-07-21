import { describe, it, expect } from "vitest";
import { matchesFilters, hasActiveFilters, EMPTY_HISTORY_FILTERS, type HistoryFilters } from "./historyFilters";
import type { Commit } from "./types";

// Task 11: filters compose over each other with AND semantics. Branch/path
// membership is resolved asynchronously by the caller (backend hash sets);
// the predicate stays pure by taking already-resolved Sets. When a Set is
// not yet available (`undefined`/`null`) the predicate does NOT exclude the
// commit — the component is responsible for not showing results while that
// membership is still loading (see History.tsx `resolving`).

function commit(overrides: Partial<Commit> = {}): Commit {
  return {
    hash: "abc1234def",
    parents: ["parent1"],
    author: "Ana Sousa",
    email: "ana@x.com",
    date: "2024-06-15T12:00:00.000Z",
    subject: "Corrige bug de layout",
    refs: "",
    ...overrides,
  };
}

describe("matchesFilters: empty filters", () => {
  it("matches any commit when no filter is active", () => {
    expect(matchesFilters(commit(), EMPTY_HISTORY_FILTERS)).toBe(true);
  });
});

describe("matchesFilters: free text (accent-tolerant)", () => {
  it("matches the subject regardless of accents/case", () => {
    const c = commit({ subject: "Histórico atualizado" });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, text: "historico" })).toBe(true);
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, text: "HISTÓRICO" })).toBe(true);
  });

  it("matches the hash and the author too", () => {
    const c = commit({ hash: "deadbeef01", author: "Bruno Ferreira" });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, text: "deadbeef" })).toBe(true);
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, text: "ferreira" })).toBe(true);
  });

  it("excludes commits that match none of subject/hash/author", () => {
    const c = commit({ subject: "Corrige bug", hash: "abc123", author: "Ana" });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, text: "nada-a-ver" })).toBe(false);
  });
});

describe("matchesFilters: author (accent-tolerant)", () => {
  it("narrows to a substring match on the author, ignoring accents/case", () => {
    const c = commit({ author: "João Tradução" });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, author: "joao" })).toBe(true);
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, author: "TRADUCAO" })).toBe(true);
  });

  it("excludes commits from a different author", () => {
    const c = commit({ author: "Ana Sousa" });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, author: "Bruno" })).toBe(false);
  });
});

describe("matchesFilters: branch membership", () => {
  it("keeps commits present in the resolved branch hash set", () => {
    const c = commit({ hash: "in-branch" });
    const filters: HistoryFilters = { ...EMPTY_HISTORY_FILTERS, branch: "feature/x" };
    expect(matchesFilters(c, filters, { branchHashes: new Set(["in-branch", "other"]) })).toBe(true);
  });

  it("excludes commits absent from the resolved branch hash set", () => {
    const c = commit({ hash: "not-in-branch" });
    const filters: HistoryFilters = { ...EMPTY_HISTORY_FILTERS, branch: "feature/x" };
    expect(matchesFilters(c, filters, { branchHashes: new Set(["other"]) })).toBe(false);
  });

  it("does not exclude while the branch membership is still resolving (undefined set)", () => {
    const c = commit({ hash: "whatever" });
    const filters: HistoryFilters = { ...EMPTY_HISTORY_FILTERS, branch: "feature/x" };
    expect(matchesFilters(c, filters, {})).toBe(true);
  });
});

describe("matchesFilters: date range", () => {
  it("includes a commit exactly at the start of dateFrom (inclusive lower bound)", () => {
    const from = "2024-06-15";
    const c = commit({ date: new Date(`${from}T00:00:00`).toISOString() });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, dateFrom: from })).toBe(true);
  });

  it("excludes a commit one millisecond before dateFrom", () => {
    const from = "2024-06-15";
    const c = commit({ date: new Date(new Date(`${from}T00:00:00`).getTime() - 1).toISOString() });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, dateFrom: from })).toBe(false);
  });

  it("includes a commit exactly at the end of dateTo (inclusive upper bound)", () => {
    const to = "2024-06-15";
    const c = commit({ date: new Date(`${to}T23:59:59.999`).toISOString() });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, dateTo: to })).toBe(true);
  });

  it("excludes a commit one millisecond after dateTo", () => {
    const to = "2024-06-15";
    const c = commit({ date: new Date(new Date(`${to}T23:59:59.999`).getTime() + 1).toISOString() });
    expect(matchesFilters(c, { ...EMPTY_HISTORY_FILTERS, dateTo: to })).toBe(false);
  });

  it("combines dateFrom and dateTo as a closed range", () => {
    const range = { dateFrom: "2024-06-10", dateTo: "2024-06-20" };
    const inside = commit({ date: "2024-06-15T00:00:00.000Z" });
    const before = commit({ date: "2024-06-01T00:00:00.000Z" });
    const after = commit({ date: "2024-07-01T00:00:00.000Z" });
    expect(matchesFilters(inside, { ...EMPTY_HISTORY_FILTERS, ...range })).toBe(true);
    expect(matchesFilters(before, { ...EMPTY_HISTORY_FILTERS, ...range })).toBe(false);
    expect(matchesFilters(after, { ...EMPTY_HISTORY_FILTERS, ...range })).toBe(false);
  });
});

describe("matchesFilters: merge vs normal", () => {
  const normal = commit({ parents: ["p1"] });
  const root = commit({ parents: [] });
  const merge = commit({ parents: ["p1", "p2"] });

  it("'all' shows both merges and normal commits", () => {
    expect(matchesFilters(normal, { ...EMPTY_HISTORY_FILTERS, merge: "all" })).toBe(true);
    expect(matchesFilters(merge, { ...EMPTY_HISTORY_FILTERS, merge: "all" })).toBe(true);
  });

  it("'merges' keeps only commits with more than one parent", () => {
    expect(matchesFilters(merge, { ...EMPTY_HISTORY_FILTERS, merge: "merges" })).toBe(true);
    expect(matchesFilters(normal, { ...EMPTY_HISTORY_FILTERS, merge: "merges" })).toBe(false);
    expect(matchesFilters(root, { ...EMPTY_HISTORY_FILTERS, merge: "merges" })).toBe(false);
  });

  it("'normal' keeps only commits with one or zero parents", () => {
    expect(matchesFilters(normal, { ...EMPTY_HISTORY_FILTERS, merge: "normal" })).toBe(true);
    expect(matchesFilters(root, { ...EMPTY_HISTORY_FILTERS, merge: "normal" })).toBe(true);
    expect(matchesFilters(merge, { ...EMPTY_HISTORY_FILTERS, merge: "normal" })).toBe(false);
  });
});

describe("matchesFilters: path membership", () => {
  it("keeps commits present in the resolved path hash set", () => {
    const c = commit({ hash: "touches-file" });
    const filters: HistoryFilters = { ...EMPTY_HISTORY_FILTERS, path: "*.rs" };
    expect(matchesFilters(c, filters, { pathHashes: new Set(["touches-file"]) })).toBe(true);
  });

  it("excludes commits absent from the resolved path hash set", () => {
    const c = commit({ hash: "no-touch" });
    const filters: HistoryFilters = { ...EMPTY_HISTORY_FILTERS, path: "*.rs" };
    expect(matchesFilters(c, filters, { pathHashes: new Set(["other"]) })).toBe(false);
  });

  it("does not exclude while the path membership is still resolving (undefined set)", () => {
    const c = commit({ hash: "whatever" });
    const filters: HistoryFilters = { ...EMPTY_HISTORY_FILTERS, path: "*.rs" };
    expect(matchesFilters(c, filters, {})).toBe(true);
  });
});

describe("matchesFilters: filters compose with AND semantics", () => {
  it("requires every active filter to pass", () => {
    const c = commit({ author: "Ana Sousa", subject: "Corrige bug", parents: ["p1"], date: "2024-06-15T12:00:00.000Z" });
    const filters: HistoryFilters = {
      ...EMPTY_HISTORY_FILTERS,
      author: "ana",
      text: "corrige",
      merge: "normal",
      dateFrom: "2024-06-01",
      dateTo: "2024-06-30",
    };
    expect(matchesFilters(c, filters)).toBe(true);
    // Flip just the merge filter to "merges": author/text/date still pass but merge now fails.
    expect(matchesFilters(c, { ...filters, merge: "merges" })).toBe(false);
  });
});

describe("hasActiveFilters", () => {
  it("is false for the default (empty) filters", () => {
    expect(hasActiveFilters(EMPTY_HISTORY_FILTERS)).toBe(false);
  });

  it("is false when text-like fields are only whitespace", () => {
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, text: "   ", author: "\t" })).toBe(false);
  });

  it("is true when any single filter is set", () => {
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, text: "x" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, author: "x" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, branch: "main" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, dateFrom: "2024-01-01" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, dateTo: "2024-01-01" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, merge: "merges" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_HISTORY_FILTERS, path: "*.rs" })).toBe(true);
  });
});
