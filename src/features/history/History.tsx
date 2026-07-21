import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAppStore } from "../../state/appStore";
import {
  useLog,
  useCommitDetail,
  useRewriteActions,
  useBranchActions,
  useTagActions,
  useBranches,
  useBranchCommits,
  usePathCommits,
} from "../../state/queries";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { FormField } from "../../components/ui/FormField";
import { Tabs } from "../../components/ui/Tabs";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth, usePanelHeight } from "../../lib/usePanelWidth";
import { toast } from "../../state/toastStore";
import { useThemeStore } from "../../state/themeStore";
import { graphRows } from "../../graph/layout";
import { CommitGraphSvg } from "../../components/CommitGraphSvg";
import { DiffView } from "../../components/DiffView";
import { statusStyle, statusTitle } from "../../lib/status";
import { useBreakpoint } from "../../lib/useBreakpoint";
import { openRepo as openRepoInfo } from "../../lib/api";
import { FileIcon } from "../../components/FileIcon";
import { errMsg } from "../../lib/errors";
import {
  relativeTime,
  fullDate,
  initials,
  avatarColor,
  parseRefs,
  chipStyle,
} from "../../lib/format";
import type { Commit } from "../../lib/types";
import { matchesFilters, hasActiveFilters, EMPTY_HISTORY_FILTERS, type HistoryFilters, type MergeFilter } from "../../lib/historyFilters";
import { useT } from "../../i18n";

const ROW_H = 52;
const mono = "'JetBrains Mono', monospace";

// Compact filter-bar controls (Task 11) share the same input skin, sized
// individually so the bar wraps sanely at narrower widths.
function filterInputStyle(width: number): CSSProperties {
  return {
    width,
    background: "var(--input)",
    border: "1px solid var(--btnB)",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12.5,
    color: "var(--text)",
    fontFamily: "var(--font)",
    boxSizing: "border-box",
  };
}

// Above this many rows the list renders in a window (uniform row height →
// simple math). Measured: 2000 commits fully rendered = 2000 divs + 11.6k SVG
// elements (~1.6MB of markup) living in one 104k-px-tall layer — scroll and
// selection paid for all of it. Below the threshold everything renders (and
// the entrance animation, capped at 120, still plays).
const VIRTUAL_MIN = 300;
const OVERSCAN = 10;

function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  const { bg, color } = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontSize: size < 26 ? 9.5 : 12,
        fontWeight: 700,
        background: bg,
        color,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

function Chips({ refs }: { refs: string }) {
  const chips = parseRefs(refs);
  if (chips.length === 0) return null;
  return (
    // The wrapper may shrink and clip: long ref names (origin/fix/…) used to
    // paint straight over the avatar and hash columns.
    <span style={{ display: "flex", gap: 6, minWidth: 0, overflow: "hidden", flexShrink: 1 }}>
      {chips.map((ch, i) => {
        const st = chipStyle(ch.kind);
        return (
          <span
            key={i}
            title={ch.label}
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              // Per-chip cap so one long ref name can't starve the others —
              // but the HEAD chip (where you ARE) never gives up its space.
              maxWidth: 150,
              flexShrink: ch.kind === "head" ? 0 : 1,
              boxSizing: "border-box",
              background: st.bg,
              color: st.color,
              border: `1px solid ${st.border}`,
            }}
          >
            {ch.label}
          </span>
        );
      })}
    </span>
  );
}

function DetailPanel({ repoPath, commit }: { repoPath: string; commit: Commit }) {
  const t = useT();
  // "Carregar diff completo" opt-in, reset when another commit is selected.
  const [full, setFull] = useState(false);
  const [prevHash, setPrevHash] = useState(commit.hash);
  if (commit.hash !== prevHash) {
    setPrevHash(commit.hash);
    setFull(false);
  }
  const { data, isLoading, error: detailError } = useCommitDetail(repoPath, commit.hash, full);
  // %B = subject + blank line + body; everything after the first line is the body.
  const body = (data?.message ?? "").split("\n").slice(1).join("\n").trim();
  const diffRef = useRef<HTMLDivElement>(null);

  // Clicking a changed file focuses its section of the diff (spec §History).
  // Rows are ~20.1px (11.5px × 1.75 line-height); +34px for the view toggle.
  function scrollToFile(path: string) {
    const el = diffRef.current;
    const patch = data?.diff;
    if (!el || !patch) return;
    const lines = patch.replace(/\n$/, "").split("\n");
    const idx = lines.findIndex((l) => l.startsWith("diff --git ") && l.includes(` b/${path}`));
    if (idx < 0) return;
    el.scrollTo({ top: Math.max(0, idx * 20.1 + 34 - 6), behavior: "smooth" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={commit.author} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{commit.author}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fullDate(commit.date)}</div>
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: "var(--l0)",
              background: "var(--l0bg)",
              border: "1px solid var(--l0bd)",
              padding: "3px 9px",
              borderRadius: 7,
            }}
          >
            {commit.hash.slice(0, 7)}
          </div>
        </div>
        {/* Not selectable (user request): copying the message goes through the
            commit's right-click menu instead. */}
        <div style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--text)" }}>{commit.subject}</div>
        {body && (
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text2)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 110, overflowY: "auto" }}>
            {body}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, fontFamily: mono, fontSize: 12 }}>
          <span style={{ color: "var(--daT)" }}>+{data?.additions ?? 0}</span>
          <span style={{ color: "var(--ddT)" }}>−{data?.deletions ?? 0}</span>
          <span style={{ color: "var(--muted)" }}>{t("history.detail.filesCount", { count: data?.files.length ?? 0 })}</span>
        </div>
      </div>

      <div style={{ padding: "12px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>
        {t("history.detail.changedFiles")}
      </div>
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 1, maxHeight: "28%", overflowY: "auto" }}>
        {(data?.files ?? []).map((f) => {
          const st = statusStyle(f.status);
          return (
            <SelectableRow
              key={f.path}
              onSelect={() => scrollToFile(f.path)}
              title={t("history.detail.viewFileDiff")}
              style={{ gap: 9, padding: "6px 8px", borderRadius: 7 }}
            >
              <FileIcon path={f.path} />
              <span
                style={{
                  flex: 1,
                  fontFamily: mono,
                  fontSize: 12,
                  color: "var(--text2)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  direction: "rtl",
                  textAlign: "left",
                }}
              >
                {f.path}
              </span>
              <span
                title={statusTitle(f.status)}
                style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: st.color, width: 12, textAlign: "center", flexShrink: 0 }}
              >
                {f.status}
              </span>
            </SelectableRow>
          );
        })}
      </div>

      <div style={{ padding: "14px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>DIFF</div>
      <div ref={diffRef} style={{ flex: 1, overflow: "auto", margin: "0 12px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel2)", padding: "8px 0" }}>
        {isLoading ? (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>{t("history.detail.loadingDiff")}</div>
        ) : detailError ? (
          <div style={{ padding: 12, color: "var(--ddT)", fontSize: 12 }}>{errMsg(detailError, t("history.detail.readCommitError"))}</div>
        ) : data && data.diff.trim() ? (
          <DiffView patch={data.diff} onLoadFull={() => setFull(true)} />
        ) : (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>{t("history.detail.noTextChanges")}</div>
        )}
      </div>
    </div>
  );
}

// Memoized so selecting a commit only re-renders the two affected rows, not the
// whole (potentially hundreds long) list.
const CommitRow = memo(function CommitRow({
  commit,
  selected,
  filtering,
  rowH,
  gutter,
  hideSecondary,
  onSelect,
  onGoto,
  onContext,
}: {
  commit: Commit;
  selected: boolean;
  filtering: boolean;
  rowH: number;
  /** Left space for the graph — grows with the number of parallel lanes. */
  gutter: number;
  /** Task 6 progressive disclosure: hide the decorative avatar before the
   *  subject would ever need to truncate further to make room for it. */
  hideSecondary: boolean;
  onSelect: (hash: string) => void;
  /** Double click: confirm-and-checkout this commit (branch-row pattern). */
  onGoto: (hash: string) => void;
  onContext: (hash: string, x: number, y: number) => void;
}) {
  const t = useT();
  // Where HEAD is (the commit you're standing on) gets a left accent bar so
  // it's findable at a glance even with the chips scrolled out of view.
  const isHead = commit.refs.includes("HEAD");
  return (
    <SelectableRow
      role="option"
      selected={selected}
      onSelect={() => onSelect(commit.hash)}
      onDoubleClick={() => onGoto(commit.hash)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext(commit.hash, e.clientX, e.clientY);
      }}
      title={t("history.row.title")}
      style={{
        height: rowH,
        gap: 12,
        padding: filtering ? "0 16px" : `0 16px 0 ${gutter}px`,
        borderRadius: 0,
        boxSizing: "border-box",
        boxShadow: isHead ? "inset 3px 0 0 var(--l0)" : undefined,
        borderBottom: "1px solid var(--bsoft)",
        // Skip painting rows scrolled out of view; the box keeps its height so
        // the graph overlay stays aligned.
        contentVisibility: "auto",
        containIntrinsicSize: `${rowH}px`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13.5, color: "var(--text)", fontWeight: selected ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {commit.subject}
        </span>
        <Chips refs={commit.refs} />
      </div>
      {!hideSecondary && <Avatar name={commit.author} />}
      <div style={{ width: 66, fontFamily: mono, fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>{commit.hash.slice(0, 7)}</div>
      <div className="gs-resp-time" style={{ width: 96, fontSize: 12, color: "var(--muted)", textAlign: "right", flexShrink: 0 }}>{relativeTime(commit.date)}</div>
    </SelectableRow>
  );
});

export function History() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const focusCommit = useAppStore((s) => s.focusCommit);
  const [limit, setLimit] = useState(200);
  const { data, isLoading, error, isFetching } = useLog(repo.path, limit);
  const rewrite = useRewriteActions(repo.path);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  // Task 11: filters compose over the free-text search (`filters.text`).
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_HISTORY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const branches = useBranches(repo.path);
  const [menu, setMenu] = useState<{ x: number; y: number; hash: string } | null>(null);
  const [confirmHardReset, setConfirmHardReset] = useState<string | null>(null);
  const [confirmRebase, setConfirmRebase] = useState<string | null>(null);
  // R5.6 context-menu extras: revert, branch-from-here, tag-here.
  const [confirmRevert, setConfirmRevert] = useState<string | null>(null);
  // R5.12: double-click a commit = confirm-and-checkout (branch-row pattern).
  const [confirmGoto, setConfirmGoto] = useState<string | null>(null);
  const onGoto = useCallback((hash: string) => setConfirmGoto(hash), []);
  const [branchFrom, setBranchFrom] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [tagAt, setTagAt] = useState<string | null>(null);
  const [tagName, setTagName] = useState("");
  const branchActions = useBranchActions(repo.path);
  const tagActions = useTagActions(repo.path);
  // Settings → Aparência → Densidade (handoff: conforto 52 / compacta 40).
  const density = useThemeStore((s) => s.density);
  const rowH = density === "compacta" ? 40 : ROW_H;
  // Persisted (R5.10): closing the diff used to reset every time the screen
  // remounted; now the choice sticks, and the header button shows the state.
  const [detailOpen, setDetailOpenState] = useState(() => localStorage.getItem("gitsylva-history-detail") !== "off");
  // R5.16: hide plays a short exit animation before the panel unmounts.
  const [detailClosing, setDetailClosing] = useState(false);
  const anims = useThemeStore((s) => s.anims);
  const closeTimer = useRef<number | null>(null);
  const collapseDetail = useCallback(() => {
    localStorage.setItem("gitsylva-history-detail", "off");
    if (!useThemeStore.getState().anims) {
      setDetailOpenState(false);
      return;
    }
    setDetailClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setDetailClosing(false);
      setDetailOpenState(false);
    }, 190);
  }, []);
  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);
  const setDetailOpen = (v: boolean) => {
    if (!v) {
      collapseDetail();
      return;
    }
    localStorage.setItem("gitsylva-history-detail", "on");
    setDetailClosing(false);
    setDetailOpenState(true);
  };
  // Design: detail panel resizable 300–560, persisted; dragging well past the
  // minimum minimizes it (R5.13), same as the header button.
  const detailW = usePanelWidth("gitsylva-w-detail", 372, 300, 560, "left", collapseDetail);
  // R5.9: the detail/diff panel can sit beside the list (default) or below it
  // (SourceTree style); the handle sits ABOVE the bottom panel, so drag down
  // shrinks and keeps shrinking into a collapse.
  const storedBelow = useThemeStore((s) => s.historyLayout) === "baixo";
  // Task 6: at the window minimum there isn't room for the detail panel
  // beside the list, so width forces "below" too — a responsive OVERRIDE
  // layered on top of the stored preference, never a write to it (the user's
  // explicit choice survives resizing back up).
  const bp = useBreakpoint();
  const below = storedBelow || bp.historyStacked;
  const detailH = usePanelHeight("gitsylva-h-history-detail", 340, 160, 720, "top", collapseDetail);

  // A focused commit (palette pick or a branch click in the sidebar) deeper
  // than the loaded window grows the window instead of silently selecting the
  // first row (derive-on-change, render phase). Capped so an unreachable hash
  // can't grow the log forever.
  {
    const loaded = data ?? [];
    if (
      focusCommit &&
      !isFetching &&
      loaded.length >= limit &&
      limit < 2000 &&
      !loaded.some((c) => c.hash === focusCommit)
    ) {
      setLimit(limit + 400);
    }
  }

  // Selecting a commit locally also clears any pending palette focus request.
  const selectHash = useCallback((hash: string) => {
    setSelectedHash(hash);
    const st = useAppStore.getState();
    if (st.focusCommit) st.setFocusCommit(null);
  }, []);

  // Stable handler so the memo() around CommitRow actually holds: without it,
  // selecting a commit re-rendered every row in the list.
  const onContext = useCallback((hash: string, x: number, y: number) => setMenu({ hash, x, y }), []);

  // Arrow-key navigation between commits (kept in a ref so the listener binds once).
  const navRef = useRef<{ hashes: string[]; selected: string | null }>({ hashes: [], selected: null });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const st = useAppStore.getState();
      if (st.paletteOpen || st.modal) return;
      const { hashes, selected } = navRef.current;
      if (!hashes.length) return;
      const idx = Math.max(0, hashes.indexOf(selected ?? hashes[0]));
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectHash(hashes[Math.min(hashes.length - 1, idx + 1)]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectHash(hashes[Math.max(0, idx - 1)]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectHash]);

  const commits = useMemo(() => data ?? [], [data]);
  const rows = useMemo(() => graphRows(commits), [commits]);
  // The text gutter follows the widest lane (graph audit): with all branches
  // in the log, busy repos need more than the old fixed 96px.
  const gutter = useMemo(() => {
    const maxLane = rows.reduce((m, r) => Math.max(m, r.lane), 0);
    return Math.min(96 + Math.max(0, maxLane - 3) * 18, 96 + 9 * 18);
  }, [rows]);

  // Branch/path filters need data the loaded window doesn't carry (branch
  // reachability, per-commit changed files) — resolved as hash sets by a
  // small dedicated backend query (see historyFilters.ts's module doc and
  // get_branch_commits/get_path_commits in src-tauri/src/git/log.rs). Both
  // are disabled (no request) when their filter isn't active.
  const branchCommits = useBranchCommits(repo.path, filters.branch, limit);
  const pathCommits = usePathCommits(repo.path, filters.path.trim(), limit);
  // `undefined` = still resolving (matchesFilters treats that as "don't
  // exclude"); an error also resolves to an empty set rather than silently
  // showing every commit, so a broken branch/path filter never lies.
  const branchHashes = useMemo(() => {
    if (!filters.branch) return undefined;
    if (branchCommits.data) return new Set(branchCommits.data);
    return branchCommits.isError ? new Set<string>() : undefined;
  }, [filters.branch, branchCommits.data, branchCommits.isError]);
  const pathHashes = useMemo(() => {
    if (!filters.path.trim()) return undefined;
    if (pathCommits.data) return new Set(pathCommits.data);
    return pathCommits.isError ? new Set<string>() : undefined;
  }, [filters.path, pathCommits.data, pathCommits.isError]);
  // True while a branch/path filter is active but its membership hasn't
  // resolved yet — the list is hidden behind a loading row instead of
  // rendering with that dimension silently unfiltered.
  const resolving = (filters.branch !== "" && !branchHashes) || (filters.path.trim() !== "" && !pathHashes);
  // A backend error resolving branch/path membership must surface as an
  // error, not blend into "zero results" (that would read as "this branch
  // has no commits", which is a different — and wrong — claim).
  const filterError = filters.branch !== "" && branchCommits.isError ? "branch" : filters.path.trim() !== "" && pathCommits.isError ? "path" : null;

  const filtering = hasActiveFilters(filters);
  const filtered = filtering ? commits.filter((c) => matchesFilters(c, filters, { branchHashes, pathHashes })) : commits;

  // A palette pick (focusCommit) wins until the user selects something else.
  const selected = commits.find((c) => c.hash === (focusCommit ?? selectedHash)) ?? commits[0];

  // Refs must not be written during render; sync the key-nav snapshot after it.
  useEffect(() => {
    navRef.current = { hashes: filtered.map((c) => c.hash), selected: selected?.hash ?? null };
  });

  // ── List windowing ────────────────────────────────────────────────────────
  // Callback-ref state: the scroll container appears only after loading, so a
  // plain useRef + [] effect would observe nothing.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [viewH, setViewH] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    if (!scrollEl) return;
    // ResizeObserver fires once on observe — no synchronous measure needed.
    const ro = new ResizeObserver(() => setViewH(scrollEl.clientHeight));
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [scrollEl]);

  const virtual = filtered.length > VIRTUAL_MIN;
  const startIdx = virtual ? Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN) : 0;
  const endIdx = virtual ? Math.min(filtered.length - 1, Math.ceil((scrollTop + viewH) / rowH) + OVERSCAN) : filtered.length - 1;
  const visibleCommits = virtual ? filtered.slice(startIdx, endIdx + 1) : filtered;

  // Keep the selected row visible when the SELECTION changes (keyboard nav,
  // palette jump). An element-level scrollIntoView ref would re-fire on every
  // remount in windowed mode and hijack the user's scroll.
  const lastScrolledTo = useRef<string | null>(null);
  useEffect(() => {
    if (!scrollEl || !selected) return;
    if (lastScrolledTo.current === selected.hash) return;
    const first = lastScrolledTo.current === null;
    lastScrolledTo.current = selected.hash;
    if (first) return; // initial selection: don't move a freshly opened list
    const idx = filtered.findIndex((c) => c.hash === selected.hash);
    if (idx < 0) return;
    const top = idx * rowH;
    if (top < scrollEl.scrollTop) scrollEl.scrollTo({ top });
    else if (top + rowH > scrollEl.scrollTop + scrollEl.clientHeight)
      scrollEl.scrollTo({ top: top + rowH - scrollEl.clientHeight });
  });

  if (isLoading) return <div style={{ padding: 16, color: "var(--muted)" }}>{t("history.loading")}</div>;
  if (error) return <div style={{ padding: 16, color: "var(--ddT)" }}>{errMsg(error, t("history.readError"))}</div>;
  if (commits.length === 0) return <div style={{ padding: 16, color: "var(--muted)" }}>{t("history.noCommits")}</div>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: below ? "column" : "row", minWidth: 0, minHeight: 0, animation: "fadeUp 0.25s ease both" }}>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", borderRight: below ? "none" : "1px solid var(--border)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FormField label={t("history.filter.label")} hideLabel>
                <input
                  value={filters.text}
                  onChange={(e) => setFilters((f) => ({ ...f, text: e.target.value }))}
                  placeholder={t("history.filter.placeholder")}
                  style={{
                    width: "100%",
                    background: "var(--input)",
                    border: "1px solid var(--btnB)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "var(--text)",
                    fontFamily: "var(--font)",
                    boxSizing: "border-box",
                  }}
                />
              </FormField>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: mono, whiteSpace: "nowrap" }}>
              {resolving ? t("history.filter.applyingInline") : t("history.commitsCount", { count: filtered.length })}
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-pressed={filtersOpen}
              aria-expanded={filtersOpen}
              title={filtersOpen ? t("history.filter.hideAdvanced") : t("history.filter.showAdvanced")}
              className="gs-lift"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 32,
                padding: "5px 11px",
                borderRadius: 7,
                background: filtersOpen ? "var(--sel)" : "var(--btn)",
                border: "1px solid var(--btnB)",
                fontSize: 12,
                color: "var(--btnT)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            >
              {t("history.filter.filters")} {hasActiveFilters({ ...filters, text: "" }) ? "•" : ""}
            </button>
            <button
              type="button"
              onClick={() => setDetailOpen(!detailOpen)}
              aria-pressed={detailOpen}
              title={detailOpen ? t("history.detail.hidePanel") : t("history.detail.showPanel")}
              className="gs-lift"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 32,
                padding: "5px 11px",
                borderRadius: 7,
                background: detailOpen ? "var(--sel)" : "var(--btn)",
                border: "1px solid var(--btnB)",
                fontSize: 12,
                color: "var(--btnT)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            >
              Diff {detailOpen ? "✓" : ""}
            </button>
          </div>

          {filtersOpen && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 10 }}>
              <FormField label={t("history.filter.author")} hideLabel>
                <input
                  value={filters.author}
                  onChange={(e) => setFilters((f) => ({ ...f, author: e.target.value }))}
                  placeholder={t("history.filter.author")}
                  style={filterInputStyle(140)}
                />
              </FormField>

              <FormField label="Branch" hideLabel>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
                  style={filterInputStyle(180)}
                >
                  <option value="">{t("history.filter.allBranches")}</option>
                  {(branches.data ?? []).some((b) => !b.is_remote) && (
                    <optgroup label={t("history.filter.local")}>
                      {(branches.data ?? [])
                        .filter((b) => !b.is_remote)
                        .map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {(branches.data ?? []).some((b) => b.is_remote) && (
                    <optgroup label={t("history.filter.remote")}>
                      {(branches.data ?? [])
                        .filter((b) => b.is_remote)
                        .map((b) => (
                          <option key={b.name} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </FormField>

              <FormField label={t("history.filter.dateFrom")} hideLabel>
                <input
                  type="date"
                  value={filters.dateFrom}
                  max={filters.dateTo || undefined}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  style={filterInputStyle(140)}
                />
              </FormField>
              <FormField label={t("history.filter.dateTo")} hideLabel>
                <input
                  type="date"
                  value={filters.dateTo}
                  min={filters.dateFrom || undefined}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  style={filterInputStyle(140)}
                />
              </FormField>

              <Tabs
                ariaLabel={t("history.filter.commitTypeAria")}
                activeId={filters.merge}
                onChange={(id) => setFilters((f) => ({ ...f, merge: id as MergeFilter }))}
                items={[
                  { id: "all", label: t("history.filter.commitAll") },
                  { id: "normal", label: t("history.filter.commitNormal") },
                  { id: "merges", label: "Merges" },
                ]}
              />

              <FormField label={t("history.filter.path")} hideLabel>
                <input
                  value={filters.path}
                  onChange={(e) => setFilters((f) => ({ ...f, path: e.target.value }))}
                  placeholder={t("history.filter.pathPlaceholder")}
                  style={filterInputStyle(160)}
                />
              </FormField>

              <Button
                variant="ghost"
                size="sm"
                title={t("history.filter.resetAllTitle")}
                disabled={!hasActiveFilters(filters)}
                onClick={() => setFilters(EMPTY_HISTORY_FILTERS)}
              >
                {t("history.filter.reset")}
              </Button>
            </div>
          )}
        </div>

        <div
          ref={setScrollEl}
          onScroll={virtual ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
          style={{ flex: 1, overflowY: "auto" }}
        >
          {filterError ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "56px 24px" }}>
              <div style={{ fontSize: 13.5, color: "var(--ddT)", textAlign: "center" }}>
                {filterError === "branch" ? t("history.filter.applyErrorBranch") : t("history.filter.applyErrorPath")}
              </div>
              <Button variant="ghost" onClick={() => setFilters(EMPTY_HISTORY_FILTERS)}>
                {t("history.filter.clear")}
              </Button>
            </div>
          ) : resolving ? (
            // A branch/path filter is active but its backend-resolved hash
            // set hasn't arrived yet — showing the list now would mean that
            // dimension is silently unfiltered, so a loading row stands in.
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>{t("history.filter.applying")}</div>
          ) : filtering && filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "56px 24px" }}>
              <div style={{ fontSize: 13.5, color: "var(--text2)", textAlign: "center" }}>{t("history.filter.noResults")}</div>
              <Button variant="ghost" onClick={() => setFilters(EMPTY_HISTORY_FILTERS)}>
                {t("history.filter.clear")}
              </Button>
            </div>
          ) : (
            <>
              {/* In windowed mode the spacer keeps the real scroll height and
                  the rows are absolutely positioned inside it; the graph
                  overlay is full-height either way, emitting only the
                  visible range. */}
              <div style={{ position: "relative", height: virtual ? filtered.length * rowH : undefined }}>
                {!filtering && (
                  <div style={{ position: "absolute", left: 14, top: 0, pointerEvents: "none" }}>
                    <CommitGraphSvg rows={rows} rowH={rowH} visibleRange={virtual ? { start: startIdx, end: endIdx } : undefined} />
                  </div>
                )}
                <div
                  role="listbox"
                  aria-label={t("history.listAriaLabel")}
                  style={virtual ? { position: "absolute", top: startIdx * rowH, left: 0, right: 0 } : undefined}
                >
                  {visibleCommits.map((c) => (
                    <CommitRow
                      key={c.hash}
                      commit={c}
                      selected={selected.hash === c.hash}
                      filtering={filtering}
                      rowH={rowH}
                      gutter={gutter}
                      hideSecondary={bp.hideSecondary}
                      onSelect={selectHash}
                      onGoto={onGoto}
                      onContext={onContext}
                    />
                  ))}
                </div>
              </div>
              {/* When the log filled the window, there are probably older commits. */}
              {!filtering && commits.length >= limit && (
                <button
                  type="button"
                  onClick={() => !isFetching && setLimit((l) => l + 200)}
                  className="gs-row"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 12.5,
                    color: "var(--l0)",
                    cursor: "pointer",
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    fontFamily: "inherit",
                  }}
                >
                  {isFetching ? t("common.loading") : t("history.loadMore")}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* The header "Diff" button is the single show/hide control (R5.11 —
          the old floating arrow sat on top of the commit-hash chip). Entrance
          and exit are short slides so the toggle never feels jarring. */}
      {(detailOpen || detailClosing) && (
        <>
          {below && (
            <div
              {...detailH.handleProps}
              className="gs-resize"
              title={t("history.dragPanel")}
              style={{ height: 7, flexShrink: 0, cursor: "ns-resize", borderTop: "1px solid var(--border)", touchAction: "none" }}
            />
          )}
          <div
            style={{
              ...(below
                ? { height: detailH.height, flexShrink: 0, background: "var(--panel)", minWidth: 0, position: "relative" as const, display: "flex", flexDirection: "column" as const }
                : { width: detailW.width, flexShrink: 0, background: "var(--panel)", minHeight: 0, position: "relative" as const }),
              animation: !anims
                ? undefined
                : detailClosing
                  ? `${below ? "panelOutY" : "panelOutX"} 0.18s var(--ease-standard) both`
                  : `${below ? "panelInY" : "panelInX"} 0.22s var(--ease-pop) both`,
            }}
          >
            {!below && <PanelHandle edge="left" handleProps={detailW.handleProps} />}
            <DetailPanel repoPath={repo.path} commit={selected} />
          </div>
        </>
      )}

      {menu &&
        (() => {
          const h = menu.hash;
          const short = h.slice(0, 7);
          const reset = (mode: "soft" | "mixed" | "hard") => () =>
            rewrite.reset.mutate({ target: h, mode }, { onSuccess: () => toast(t("history.menu.resetToast", { mode, short })), onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.menu.resetError"), "error") });
          const subject = commits.find((c) => c.hash === h)?.subject ?? "";
          const items: MenuItem[] = [
            { label: t("history.menu.gotoCommit"), onClick: () => setConfirmGoto(h) },
            { label: t("history.menu.branchFromHere"), onClick: () => { setBranchName(""); setBranchFrom(h); } },
            { label: t("history.menu.tagAtCommit"), onClick: () => { setTagName(""); setTagAt(h); } },
            { label: "", onClick: () => {}, divider: true },
            { label: t("history.menu.cherryPick"), onClick: () => rewrite.cherryPick.mutate(h, { onSuccess: () => toast(t("history.menu.cherryPickDone")), onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.menu.cherryPickConflict"), "error") }) },
            { label: t("history.menu.revertCommit"), onClick: () => setConfirmRevert(h) },
            { label: t("history.menu.rebaseOnto"), onClick: () => setConfirmRebase(h) },
            { label: "", onClick: () => {}, divider: true },
            { label: t("history.menu.resetSoft", { short }), onClick: reset("soft") },
            { label: t("history.menu.resetMixed", { short }), onClick: reset("mixed") },
            { label: t("history.menu.resetHard", { short }), onClick: () => setConfirmHardReset(h), danger: true },
            { label: "", onClick: () => {}, divider: true },
            { label: t("history.menu.copyHash"), onClick: () => navigator.clipboard?.writeText(h).then(() => toast(t("history.menu.hashCopied"))) },
            { label: t("history.menu.copyMessage"), onClick: () => navigator.clipboard?.writeText(subject).then(() => toast(t("history.menu.messageCopied"))) },
          ];
          return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
        })()}

      {confirmRebase && (
        <ConfirmDialog
          message={t("history.rebaseConfirm", { branch: repo.current_branch, short: confirmRebase.slice(0, 7) })}
          confirmLabel="Rebase"
          onCancel={() => setConfirmRebase(null)}
          onConfirm={() => {
            const onto = confirmRebase;
            setConfirmRebase(null);
            rewrite.rebase.mutate(onto, {
              onSuccess: () => toast(t("history.rebaseDone")),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.rebaseConflict"), "error"),
            });
          }}
        />
      )}

      {confirmHardReset && (
        <ConfirmDialog
          message={t("history.hardResetConfirm", { short: confirmHardReset.slice(0, 7) })}
          confirmLabel={t("history.hardResetConfirmLabel")}
          onCancel={() => setConfirmHardReset(null)}
          onConfirm={() => {
            const target = confirmHardReset;
            setConfirmHardReset(null);
            rewrite.reset.mutate(
              { target, mode: "hard" },
              { onSuccess: () => toast(t("history.hardResetToast", { short: target.slice(0, 7) })), onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.menu.resetError"), "error") },
            );
          }}
        />
      )}

      {confirmGoto && (
        <ConfirmDialog
          message={t("history.gotoConfirm", { short: confirmGoto.slice(0, 7) })}
          confirmLabel={t("history.gotoConfirmLabel")}
          onCancel={() => setConfirmGoto(null)}
          onConfirm={() => {
            const hash = confirmGoto;
            setConfirmGoto(null);
            if (branchActions.checkout.isPending) return;
            branchActions.checkout.mutate(hash, {
              onSuccess: () => {
                toast(t("history.gotoDone", { short: hash.slice(0, 7) }));
                // Refresh the repo info properly — a detached HEAD has no
                // branch name for setCurrent to guess.
                void openRepoInfo(repo.path).then((info) => useAppStore.getState().updateRepo(repo.path, info)).catch(() => {});
              },
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.gotoError"), "error"),
            });
          }}
        />
      )}

      {confirmRevert && (
        <ConfirmDialog
          message={t("history.revertConfirm", { short: confirmRevert.slice(0, 7) })}
          confirmLabel={t("history.revertConfirmLabel")}
          onCancel={() => setConfirmRevert(null)}
          onConfirm={() => {
            const h = confirmRevert;
            setConfirmRevert(null);
            rewrite.revert.mutate(h, {
              onSuccess: () => toast(t("history.revertDone", { short: h.slice(0, 7) })),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.revertConflict"), "error"),
            });
          }}
        />
      )}

      {branchFrom && (
        <Modal title={t("history.branchModal.title", { short: branchFrom.slice(0, 7) })} onClose={() => setBranchFrom(null)} width={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              autoFocus
              mono
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder={t("history.branchModal.placeholder")}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {([false, true] as const).map((doCheckout) => (
                <Button
                  key={String(doCheckout)}
                  variant={doCheckout ? "primary" : "ghost"}
                  disabled={!branchName.trim() || branchActions.create.isPending}
                  onClick={() => {
                    const from = branchFrom;
                    const name = branchName.trim();
                    setBranchFrom(null);
                    branchActions.create.mutate(
                      { name, checkout: doCheckout, from },
                      {
                        onSuccess: () => toast(doCheckout ? t("history.branchModal.checkedOut", { name }) : t("history.branchModal.created", { name, short: from.slice(0, 7) })),
                        onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.branchModal.createError"), "error"),
                      },
                    );
                  }}
                >
                  {doCheckout ? t("history.branchModal.createSwitch") : t("common.create")}
                </Button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {tagAt && (
        <Modal title={t("history.tagModal.title", { short: tagAt.slice(0, 7) })} onClose={() => setTagAt(null)} width={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input autoFocus mono value={tagName} onChange={(e) => setTagName(e.target.value)} placeholder="v1.2.3" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button
                variant="primary"
                disabled={!tagName.trim() || tagActions.create.isPending}
                onClick={() => {
                  const target = tagAt;
                  const name = tagName.trim();
                  setTagAt(null);
                  tagActions.create.mutate(
                    { name, message: "", target },
                    {
                      onSuccess: () => toast(t("history.tagModal.created", { name, short: target.slice(0, 7) })),
                      onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.tagModal.createError"), "error"),
                    },
                  );
                }}
              >
                {t("history.tagModal.create")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
