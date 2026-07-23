import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../../state/appStore";
import {
  useLog,
  useStatus,
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
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PanelHandle } from "../../components/ui/PanelResize";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { usePanelWidth, usePanelHeight } from "../../lib/usePanelWidth";
import { toast } from "../../state/toastStore";
import { useThemeStore } from "../../state/themeStore";
import { graphRows } from "../../graph/layout";
import { CommitGraphSvg } from "../../components/CommitGraphSvg";
import { useBreakpoint } from "../../lib/useBreakpoint";
import { openRepo as openRepoInfo } from "../../lib/api";
import { errMsg } from "../../lib/errors";
import { matchesFilters, hasActiveFilters, EMPTY_HISTORY_FILTERS, type HistoryFilters } from "../../lib/historyFilters";
import { useT } from "../../i18n";
import { CommitRow } from "./CommitRow";
import { DetailPanel } from "./DetailPanel";
import { FilterBar } from "./FilterBar";

// Denser rows (user: "cada barra menor, mais apertado, mais info, mais ágil").
const ROW_H = 44;

const mono = "'JetBrains Mono', monospace";

// "Alterações por commitar" node at the top of the history list (spec §4 /
// master 299-306). Its own dashed graph node + dashed avatar mark it as the
// not-yet-committed working state; clicking opens the Working Copy.
function WcRow({ gutter, rowH, count, hideSecondary, onOpen }: { gutter: number; rowH: number; count: number; hideSecondary: boolean; onOpen: () => void }) {
  const t = useT();
  return (
    <SelectableRow
      onSelect={onOpen}
      title={t("history.wcRow.title")}
      style={{ position: "relative", height: rowH, gap: 12, padding: `0 16px 0 ${gutter}px`, borderRadius: 0, boxSizing: "border-box", borderBottom: "1px solid var(--bsoft)" }}
    >
      <span style={{ position: "absolute", left: 19, top: "50%", transform: "translateY(-50%)", width: 9, height: 9, border: "1.6px dashed var(--l2)", borderRadius: "50%", boxSizing: "border-box" }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13.5, color: "var(--text)", fontWeight: 600, fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t("history.wcRow.label")}</span>
        <span style={{ fontFamily: mono, fontSize: 10.5, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", background: "var(--stMB)", color: "var(--stMT)", border: "1px solid var(--l2bd)" }}>
          {t("history.detail.filesCount", { count })}
        </span>
      </div>
      {!hideSecondary && <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1.6px dashed var(--btnB)", boxSizing: "border-box", flexShrink: 0 }} />}
      <div style={{ width: 66, fontFamily: mono, fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>—</div>
      <div className="gs-resp-time" style={{ width: 96, fontSize: 12, color: "var(--muted)", textAlign: "right", flexShrink: 0 }}>{t("time.now")}</div>
    </SelectableRow>
  );
}

// Above this many rows the list windows (uniform row height, simple math).
// Measured: 2000 commits fully rendered = 2000 divs + 11.6k SVG elements
// (~1.6MB) in one 104k-px layer — costly. Below the cutoff everything renders.
const VIRTUAL_MIN = 300;
const OVERSCAN = 10;

export function History() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const focusCommit = useAppStore((s) => s.focusCommit);
  const [limit, setLimit] = useState(200);
  const { data, isLoading, error, isFetching } = useLog(repo.path, limit);
  const rewrite = useRewriteActions(repo.path);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  // Filters compose over the free-text search (`filters.text`).
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_HISTORY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const branches = useBranches(repo.path);
  // Drives the "Alterações por commitar" node at the top of the list.
  const wcStatus = useStatus(repo.path);
  // advancedOnly = opened from the detail "…" (Branch/Tag/Revert are buttons there).
  const [menu, setMenu] = useState<{ x: number; y: number; hash: string; advancedOnly?: boolean } | null>(null);
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
  // Settings → Aparência → Densidade. Tighter than before per user feedback:
  // comfortable 44, compact 32.
  const density = useThemeStore((s) => s.density);
  const rowH = density === "compacta" ? 32 : ROW_H;
  // Persisted (R5.10): the diff panel's open/closed choice survives remounts.
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
  // Resizable 300–560, persisted; dragging well past the minimum minimizes it
  // (R5.13), same as the header button.
  const detailW = usePanelWidth("gitsylva-w-detail", 372, 300, 560, "left", collapseDetail);
  // R5.9: the panel sits beside the list (default) or below it (SourceTree
  // style); the drag handle sits above the bottom panel so drag-down shrinks
  // into a collapse.
  const storedBelow = useThemeStore((s) => s.historyLayout) === "baixo";
  // At the window minimum there's no room beside the list, so width forces
  // "below" too — a responsive override layered on the stored preference,
  // never written back (survives resizing back up).
  const bp = useBreakpoint();
  const below = storedBelow || bp.historyStacked;
  const detailH = usePanelHeight("gitsylva-h-history-detail", 340, 160, 720, "top", collapseDetail);

  // A focused commit deeper than the loaded window grows the window instead
  // of silently selecting row 0 (derive-on-change); capped so an unreachable
  // hash can't grow the log forever.
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

  // Proactively load the rest of the history (up to the 2000 cap) right after
  // the first page, without waiting for scroll: every lane stays connected to
  // its parent before it scrolls into view, so the continuation fade is only
  // ever seen at the true end. Render-phase derive-on-change, same pattern as
  // the focus-commit growth above.
  {
    const loaded = data ?? [];
    if (!isFetching && !hasActiveFilters(filters) && loaded.length >= limit && limit < 2000) {
      setLimit(Math.min(2000, limit + 800));
    }
  }

  // Selecting a commit locally also clears any pending palette focus request,
  // and (re)opens the detail panel — the ✕ close (R5/E) is only temporary.
  // All setters here are stable, so this callback keeps a stable identity and
  // the memoized rows don't re-render on selection.
  const selectHash = useCallback((hash: string) => {
    setSelectedHash(hash);
    const st = useAppStore.getState();
    if (st.focusCommit) st.setFocusCommit(null);
    localStorage.setItem("gitsylva-history-detail", "on");
    setDetailClosing(false);
    setDetailOpenState(true);
  }, []);

  // Stable handler so memo() around CommitRow holds — else every row re-renders on select.
  const onContext = useCallback((hash: string, x: number, y: number) => setMenu({ hash, x, y }), []);
  // WC row / detail: navigate to the Working Copy (staging + message + Commit).
  const openWorking = useCallback(() => useAppStore.getState().setView("working"), []);

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
  // The text gutter follows the widest lane: busy repos need more than a fixed 96px.
  const gutter = useMemo(() => {
    const maxLane = rows.reduce((m, r) => Math.max(m, r.lane), 0);
    return Math.min(96 + Math.max(0, maxLane - 3) * 18, 96 + 9 * 18);
  }, [rows]);

  // Branch/path filters need data the window doesn't carry (reachability,
  // changed files) — resolved as hash sets via a dedicated backend query
  // (historyFilters.ts, get_branch_commits/get_path_commits); disabled when inactive.
  const branchCommits = useBranchCommits(repo.path, filters.branch, limit);
  const pathCommits = usePathCommits(repo.path, filters.path.trim(), limit);
  // undefined = still resolving; an error resolves to an empty set rather
  // than silently showing every commit.
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
  // True while an active branch/path filter's membership hasn't resolved yet
  // — a loading row stands in instead of rendering silently unfiltered.
  const resolving = (filters.branch !== "" && !branchHashes) || (filters.path.trim() !== "" && !pathHashes);
  // A resolution error must surface as an error, not blend into "zero results".
  const filterError = filters.branch !== "" && branchCommits.isError ? "branch" : filters.path.trim() !== "" && pathCommits.isError ? "path" : null;

  const filtering = hasActiveFilters(filters);
  const filtered = filtering ? commits.filter((c) => matchesFilters(c, filters, { branchHashes, pathHashes })) : commits;

  // "Alterações por commitar" node (spec §4 / master 299-306): only when the
  // working copy is dirty and no filter is active. The graph + commit rows sit
  // below it, so windowing/scroll math run in the block's own space and shift
  // down by exactly one row while the WC row is shown.
  const wcCount = (wcStatus.data ?? []).length;
  const showWcRow = !filtering && wcCount > 0;
  const wcOffset = showWcRow ? rowH : 0;

  // A palette pick (focusCommit) wins until the user selects something else.
  const selected = commits.find((c) => c.hash === (focusCommit ?? selectedHash)) ?? commits[0];

  // Refs must not be written during render; sync the key-nav snapshot after it.
  useEffect(() => {
    navRef.current = { hashes: filtered.map((c) => c.hash), selected: selected?.hash ?? null };
  });

  // ── List windowing ────────────────────────────────────────────────────────
  // Callback-ref: the scroll container only appears after loading, so a plain
  // useRef + [] effect would observe nothing.
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
  // The block starts wcOffset px into the scroll area, so windowing works off
  // the position within the block, not the raw container scrollTop.
  const blockTop = Math.max(0, scrollTop - wcOffset);
  const startIdx = virtual ? Math.max(0, Math.floor(blockTop / rowH) - OVERSCAN) : 0;
  const endIdx = virtual ? Math.min(filtered.length - 1, Math.ceil((blockTop + viewH) / rowH) + OVERSCAN) : filtered.length - 1;
  const visibleCommits = virtual ? filtered.slice(startIdx, endIdx + 1) : filtered;

  // Keep the selected row visible on selection change (keyboard nav, palette
  // jump) — a plain scrollIntoView ref would re-fire on every remount in
  // windowed mode and hijack the user's scroll.
  const lastScrolledTo = useRef<string | null>(null);
  useEffect(() => {
    if (!scrollEl || !selected) return;
    if (lastScrolledTo.current === selected.hash) return;
    const first = lastScrolledTo.current === null;
    lastScrolledTo.current = selected.hash;
    if (first) return; // initial selection: don't move a freshly opened list
    const idx = filtered.findIndex((c) => c.hash === selected.hash);
    if (idx < 0) return;
    const top = wcOffset + idx * rowH;
    if (top < scrollEl.scrollTop) scrollEl.scrollTo({ top });
    else if (top + rowH > scrollEl.scrollTop + scrollEl.clientHeight)
      scrollEl.scrollTo({ top: top + rowH - scrollEl.clientHeight });
  });

  // Only the TRUE first load (no data yet) may replace the view: on "load
  // more" react-query reports isLoading=true again during the placeholder
  // phase even though the previous page is still showing — gating on that
  // alone blanked the whole list ("everything disappears" bug).
  if (isLoading && commits.length === 0) return <div style={{ padding: 16, color: "var(--muted)" }}>{t("history.loading")}</div>;
  if (error) return <div style={{ padding: 16, color: "var(--ddT)" }}>{errMsg(error, t("history.readError"))}</div>;
  if (commits.length === 0) return <div style={{ padding: 16, color: "var(--muted)" }}>{t("history.noCommits")}</div>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: below ? "column" : "row", minWidth: 0, minHeight: 0, animation: "fadeUp 0.25s ease both" }}>
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", borderRight: below ? "none" : "1px solid var(--border)" }}>
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          detailOpen={detailOpen}
          setDetailOpen={setDetailOpen}
          branches={branches.data}
          resolving={resolving}
          filteredCount={filtered.length}
        />

        <div
          ref={setScrollEl}
          // Track scrollTop always, not only in virtual mode: the list can
          // cross VIRTUAL_MIN mid-session, and windowing must compute from
          // the real (possibly already-scrolled) position, not a stale 0.
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
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
            // A branch/path filter's hash set hasn't resolved yet — a loading row stands in.
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
              {/* Working-copy node above the graph block (its own dashed node);
                  the block below stays in graph coordinates so lanes align. */}
              {showWcRow && <WcRow gutter={gutter} rowH={rowH} count={wcCount} hideSecondary={bp.hideSecondary} onOpen={openWorking} />}
              {/* Windowed mode: the spacer keeps the real scroll height, rows
                  are absolutely positioned inside it, and the graph overlay
                  stays full-height but only emits the visible range. */}
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

      {/* The header "Diff" button is the single show/hide control (R5.11); entrance/exit are short slides. */}
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
            <DetailPanel
              repoPath={repo.path}
              commit={selected}
              onClose={() => setDetailOpen(false)}
              onBranch={(h) => { setBranchName(""); setBranchFrom(h); }}
              onTag={(h) => { setTagName(""); setTagAt(h); }}
              onRevert={(h) => setConfirmRevert(h)}
              onMore={(h, x, y) => setMenu({ hash: h, x, y, advancedOnly: true })}
            />
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
          const divider: MenuItem = { label: "", onClick: () => {}, divider: true };
          // From the detail "…", Branch/Tag/Revert are already visible buttons —
          // the menu carries only the advanced (and destructive) actions.
          const primary: MenuItem[] = menu.advancedOnly
            ? []
            : [
                { label: t("history.menu.branchFromHere"), onClick: () => { setBranchName(""); setBranchFrom(h); } },
                { label: t("history.menu.tagAtCommit"), onClick: () => { setTagName(""); setTagAt(h); } },
                { label: t("history.menu.revertCommit"), onClick: () => setConfirmRevert(h) },
              ];
          const items: MenuItem[] = [
            { label: t("history.menu.gotoCommit"), onClick: () => setConfirmGoto(h) },
            ...primary,
            divider,
            { label: t("history.menu.cherryPick"), onClick: () => rewrite.cherryPick.mutate(h, { onSuccess: () => toast(t("history.menu.cherryPickDone")), onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("history.menu.cherryPickConflict"), "error") }) },
            { label: t("history.menu.rebaseOnto"), onClick: () => setConfirmRebase(h) },
            divider,
            { label: t("history.menu.resetSoft", { short }), onClick: reset("soft") },
            { label: t("history.menu.resetMixed", { short }), onClick: reset("mixed") },
            { label: t("history.menu.resetHard", { short }), onClick: () => setConfirmHardReset(h), danger: true },
            divider,
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
