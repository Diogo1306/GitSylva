import { useState, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";
import { activateOnKeyDown } from "../../components/ui/keys";
import { Badge } from "../../components/ui/misc";
import type { BranchGroup } from "../../lib/branchFolders";
import type { BranchInfo } from "../../lib/types";
import { useT } from "../../i18n";
import { SectionLabel } from "./SectionLabel";
import { BranchSearchBox } from "./BranchSearchBox";
import { BranchRow, BRANCH_ROW_CLASS } from "./BranchRow";

const mono = "var(--font-mono)";

// ArrowDown/ArrowUp move focus to the next/previous visible row within the
// branches section (local branch rows + folder-toggle headers) — a roving
// focus convenience layered on top of normal Tab order (every row keeps its
// own tabIndex=0, so Tab still reaches each one individually).
function onBranchListKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(`.${BRANCH_ROW_CLASS}`));
  const idx = rows.indexOf(document.activeElement as HTMLElement);
  if (idx === -1) return;
  e.preventDefault();
  const next = e.key === "ArrowDown" ? Math.min(rows.length - 1, idx + 1) : Math.max(0, idx - 1);
  rows[next]?.focus();
}

type ContextMenuRequest = { x: number; y: number; name: string; remote?: { full: string; short: string; tip: string } };

export function BranchList({
  localBranches,
  localGroups,
  recentBranches,
  filtering,
  branchQuery,
  setBranchQuery,
  selectedBranch,
  renaming,
  renameVal,
  setRenameVal,
  openFolders,
  setOpenFolders,
  checkoutPending,
  currentBranchName,
  onCreateBranch,
  onFocusBranch,
  onRequestSwitch,
  onMergeClick,
  onContextMenu,
  onDeleteRequest,
  onRenameCommit,
  onRenameCancel,
}: {
  localBranches: BranchInfo[];
  localGroups: BranchGroup[];
  recentBranches: BranchInfo[];
  filtering: boolean;
  branchQuery: string;
  setBranchQuery: (v: string) => void;
  selectedBranch: string | null;
  renaming: string | null;
  renameVal: string;
  setRenameVal: (v: string) => void;
  openFolders: Record<string, boolean>;
  setOpenFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
  checkoutPending: boolean;
  currentBranchName: string;
  onCreateBranch: () => void;
  onFocusBranch: (name: string, tip: string) => void;
  onRequestSwitch: (name: string) => void;
  onMergeClick: (name: string) => void;
  onContextMenu: (menu: ContextMenuRequest) => void;
  onDeleteRequest: (name: string) => void;
  onRenameCommit: (oldName: string, newName: string) => void;
  onRenameCancel: () => void;
}) {
  const t = useT();
  // V2: the branch filter input starts hidden behind a magnifier toggle in
  // the header (master lines 230-241) — except when a query already exists,
  // so the input never disappears out from under active text.
  const [searchOpen, setSearchOpen] = useState(() => branchQuery.trim().length > 0);
  // Branch folders (feature/, fix/, …): collapsed by default so big lists stay
  // short; the folder holding the CURRENT branch starts open, and the user's
  // explicit toggles win for the rest of the session.
  const folderOpen = (g: Extract<BranchGroup, { kind: "folder" }>) =>
    filtering || (openFolders[g.name] ?? g.members.some((m) => m.is_current));

  const row = (b: BranchInfo, display: string, indent: boolean) => (
    <BranchRow
      key={b.name}
      branch={b}
      display={display}
      indent={indent}
      selected={selectedBranch === b.name}
      isRenaming={renaming === b.name}
      renameVal={renameVal}
      onRenameValChange={setRenameVal}
      onRenameCommit={(value) => onRenameCommit(b.name, value)}
      onRenameCancel={onRenameCancel}
      checkoutPending={checkoutPending}
      onSelect={() => onFocusBranch(b.name, b.tip)}
      onRequestSwitch={() => onRequestSwitch(b.name)}
      onMergeClick={() => onMergeClick(b.name)}
      onContextMenuOpen={(x, y) => onContextMenu({ x, y, name: b.name })}
      onDeleteClick={() => onDeleteRequest(b.name)}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }} onKeyDown={onBranchListKeyDown}>
      <SectionLabel
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button
              type="button"
              onClick={onCreateBranch}
              onKeyDown={activateOnKeyDown}
              title={t("shell.branch.title")}
              aria-label={t("shell.branch.title")}
              className="gs-row"
              style={{ width: 32, height: 32, borderRadius: "var(--r-btn)", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
            >
              +
            </button>
            {/* V2: magnifier toggles the filter input below (master line 234). */}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              onKeyDown={activateOnKeyDown}
              title={t("shell.branch.searchToggle")}
              aria-label={t("shell.branch.searchToggle")}
              aria-expanded={searchOpen}
              className="gs-row"
              style={{ width: 24, height: 24, borderRadius: "var(--r-xs)", display: "grid", placeItems: "center", color: searchOpen ? "var(--text)" : "var(--muted)", background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="6" cy="6" r="4.2" />
                <path d="M9.4 9.4 L12.6 12.6" />
              </svg>
            </button>
          </div>
        }
      >
        {t("shell.sidebar.branches", { count: localBranches.length })}
      </SectionLabel>
      {searchOpen && <BranchSearchBox value={branchQuery} onChange={setBranchQuery} />}
      {/* Task 10: recently checked-out branches, most-recent first — a
          quick-access shortcut on top of the folder grouping below.
          Hidden while filtering, since the filtered list already surfaces
          what matters. */}
      {!filtering && recentBranches.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 6 }}>
          <SectionLabel>{t("shell.sidebar.recents")}</SectionLabel>
          {recentBranches.map((b) => row(b, b.name, false))}
        </div>
      )}
      {localGroups.map((g) =>
        g.kind === "branch" ? (
          row(g.branch, g.branch.name, false)
        ) : (
          <div key={`pasta-${g.name}`} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <button
              type="button"
              // While filtering, folders are force-open via the override in
              // folderOpen — a click here would compute !true and write an
              // explicit `false`, silently collapsing the folder once the
              // query clears (and defeating "current-branch folder open by
              // default"). No-op during filtering: the override already
              // shows the correct open state, so no affordance is lost.
              onClick={() => { if (filtering) return; setOpenFolders((s) => ({ ...s, [g.name]: !folderOpen(g) })); }}
              onKeyDown={activateOnKeyDown}
              className={`gs-row ${BRANCH_ROW_CLASS}`}
              title={t("shell.folder.toggleTitle", { action: folderOpen(g) ? t("shell.collapse") : t("shell.expand"), name: g.name })}
              aria-expanded={folderOpen(g)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: "var(--r-btn)", fontSize: "var(--fs-sm)", fontFamily: mono, color: "var(--text2)", cursor: "pointer", background: "transparent", border: "none", width: "100%", textAlign: "left" }}
            >
              <span style={{ fontSize: 9, color: "var(--muted)", transform: `rotate(${folderOpen(g) ? 90 : 0}deg)`, transition: "transform 0.15s", display: "inline-block", width: 6, flexShrink: 0 }}>▶</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
              {/* A closed folder still shows where you are. */}
              {!folderOpen(g) && g.members.some((m) => m.is_current) && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--l0bg)", border: "1.5px solid var(--l0)", boxSizing: "border-box", flexShrink: 0 }} />
              )}
              {/* Instead of a member count (noise), the folder aggregates the
                  members' pending push/pull (R5.11). */}
              {(() => {
                const up = g.members.reduce((s, m) => s + m.ahead, 0);
                const down = g.members.reduce((s, m) => s + m.behind, 0);
                return (
                  <>
                    {up > 0 && (
                      <span title={t("shell.folder.aheadTitle", { count: up })} style={{ flexShrink: 0 }}>
                        <Badge accent>↑{up}</Badge>
                      </span>
                    )}
                    {down > 0 && (
                      <span title={t("shell.folder.behindTitle", { count: down })} style={{ flexShrink: 0 }}>
                        <Badge>↓{down}</Badge>
                      </span>
                    )}
                  </>
                );
              })()}
            </button>
            {folderOpen(g) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 1, animation: "fadeIn 0.15s ease both" }}>
                {g.members.map((m) => row(m, m.name.slice(g.name.length + 1), true))}
              </div>
            )}
          </div>
        ),
      )}
      {filtering && localGroups.length === 0 && (
        <div style={{ padding: "6px 10px", fontSize: "var(--fs-xs)", color: "var(--muted)", fontFamily: mono }}>{t("shell.branch.noMatches")}</div>
      )}
      {!filtering && localBranches.length === 0 && (
        <div style={{ padding: "6px 10px", fontSize: "var(--fs-xs)", color: "var(--muted)", fontFamily: mono }}>{currentBranchName}</div>
      )}
    </div>
  );
}
