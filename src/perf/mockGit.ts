// PERF HARNESS ONLY — never active in real builds.
//
// Loaded exclusively when the bundle is built with VITE_PERF_MOCK=1
// (first import in main.tsx, so localStorage is seeded BEFORE the zustand
// stores rehydrate). Installs a fake `window.__TAURI_INTERNALS__.invoke` with
// deterministic large datasets (2 000 commits, 200 changed files, a ~3 000
// line diff) and seeds localStorage so the app boots straight into History.
// This lets the PRODUCTION bundle be profiled in a plain browser.

type Args = Record<string, unknown>;

const REPO = "C:/perf/mock-repo";
const N_COMMITS = 2000;
const N_FILES = 200;

function hash(i: number): string {
  return (i + 1).toString(16).padStart(7, "a").repeat(6).slice(0, 40);
}

const authors = ["Ana Souza", "Marco Duarte", "Lia Ferraz"];

function commits(limit: number, skip: number) {
  const out = [];
  for (let i = skip; i < Math.min(skip + limit, N_COMMITS); i++) {
    const merge = i % 13 === 0 && i + 2 < N_COMMITS;
    out.push({
      hash: hash(i),
      parents: merge ? [hash(i + 1), hash(i + 2)] : i + 1 < N_COMMITS ? [hash(i + 1)] : [],
      author: authors[i % 3],
      email: "perf@mock",
      date: new Date(Date.now() - i * 3600_000).toISOString(),
      subject: `Commit ${i} — ajusta o módulo ${i % 40} e melhora o parser`,
      refs: i === 0 ? "HEAD -> main, origin/main" : i === 7 ? "tag: v1.2.0" : "",
    });
  }
  return out;
}

function bigDiff(lines: number): string {
  let out = "diff --git a/src/big.ts b/src/big.ts\nindex aaa..bbb 100644\n--- a/src/big.ts\n+++ b/src/big.ts\n";
  for (let h = 0; h < lines / 100; h++) {
    out += `@@ -${h * 100 + 1},100 +${h * 100 + 1},100 @@\n`;
    for (let l = 0; l < 100; l++) {
      const k = l % 5 === 0 ? "+" : l % 7 === 0 ? "-" : " ";
      out += `${k}const value_${h}_${l} = compute(${l}) + "texto de exemplo ${l}";\n`;
    }
  }
  return out;
}

const files = Array.from({ length: N_FILES }, (_, i) => ({
  path: `src/módulo-${i % 20}/ficheiro-${i}.ts`,
  index_status: i % 3 === 0 ? "M" : ".",
  worktree_status: i % 3 === 0 ? "." : i % 5 === 0 ? "?" : "M",
  orig_path: null,
}));

const DIFF = bigDiff(3000);

const handlers: Record<string, (a: Args) => unknown> = {
  open_repo: () => ({ path: REPO, current_branch: "main", head: hash(0), is_empty: false }),
  get_status: () => files,
  get_log: (a) => commits((a.limit as number) ?? 200, (a.skip as number) ?? 0),
  commit_detail: () => ({
    message: "Commit grande\n\ncorpo da mensagem para o perf harness",
    additions: 600,
    deletions: 300,
    files: files.slice(0, 60).map((f, i) => ({ path: f.path, status: i % 4 === 0 ? "A" : "M", additions: 10, deletions: 5 })),
    diff: DIFF,
  }),
  get_diff: () => DIFF,
  list_branches: () =>
    Array.from({ length: 30 }, (_, i) => ({
      name: i === 0 ? "main" : `feature/coisa-${i}`,
      is_current: i === 0,
      is_remote: i > 20,
      upstream: i === 0 ? "origin/main" : null,
    })),
  list_stashes: () => [{ index: 0, message: "WIP perf", relative_date: "há 2 dias" }],
  stash_files: () => ["src/a.ts", "src/b.ts"],
  list_tags: () => [{ name: "v1.2.0", target: hash(7), subject: "release" }],
  sync_status: () => ({ ahead: 1, behind: 2, upstream: "origin/main" }),
  conflict_state: () => ({ in_merge: false, in_rebase: false, in_cherry_pick: false, in_revert: false, files: [] }),
  get_identity: () => ({ name: "Perf", email: "perf@mock" }),
  head_message: () => "Commit 0 — mensagem",
  blame: () => [],
  incoming: () => [],
  outgoing: () => [],
};

function installPerfMock() {
  // Boot straight into the app with one repo open.
  localStorage.setItem("gitsylva-onboard", JSON.stringify({ state: { onboarded: true }, version: 0 }));
  localStorage.setItem(
    "gitsylva-open-repos",
    JSON.stringify({
      state: {
        repos: [{ path: REPO, current_branch: "main", head: hash(0), is_empty: false }],
        repo: { path: REPO, current_branch: "main", head: hash(0), is_empty: false },
        groups: [],
        groupOf: {},
      },
      version: 0,
    }),
  );

  (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__ = {
    invoke: (cmd: string, args: Args) => {
      const fn = handlers[cmd];
      if (fn) return Promise.resolve(fn(args ?? {}));
      return Promise.resolve(undefined); // mutations & the rest: instant ok
    },
    metadata: { currentWindow: { label: "main" }, currentWebview: { label: "main" } },
  };
  console.log("[perf] mock git installed — 2000 commits / 200 files / big diff");
}

if (import.meta.env.VITE_PERF_MOCK === "1") {
  installPerfMock();
}
