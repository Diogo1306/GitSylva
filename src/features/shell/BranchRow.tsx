import { Input } from "../../components/ui/Input";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { Badge } from "../../components/ui/misc";
import { activateOnKeyDown } from "../../components/ui/keys";
import { useT } from "../../i18n";
import type { BranchInfo } from "../../lib/types";

const mono = "var(--font-mono)";

// Rows in the branches section (branch rows and folder-toggle headers) carry
// this marker class so ArrowDown/ArrowUp can walk between whatever is
// CURRENTLY visible (folder members collapse in and out) without hardcoding
// the list. A class (not a data-* prop) because SelectableRow's typed props
// don't declare arbitrary data attributes, while className always does.
export const BRANCH_ROW_CLASS = "gs-branch-row";

// One row per local branch, shared by flat entries and folder members (members
// show the name without the folder prefix and indent under the caret).
// Single click focuses the tip commit in the history; DOUBLE click switches
// branch (R5.1 — switching was too easy to trigger by accident).
export function BranchRow({
  branch: b,
  display,
  indent,
  selected,
  isRenaming,
  renameVal,
  onRenameValChange,
  onRenameCommit,
  onRenameCancel,
  checkoutPending,
  onSelect,
  onRequestSwitch,
  onContextMenuOpen,
  onDeleteClick,
}: {
  branch: BranchInfo;
  display: string;
  indent: boolean;
  selected: boolean;
  isRenaming: boolean;
  renameVal: string;
  onRenameValChange: (v: string) => void;
  onRenameCommit: (value: string) => void;
  onRenameCancel: () => void;
  checkoutPending: boolean;
  onSelect: () => void;
  onRequestSwitch: () => void;
  onContextMenuOpen: (x: number, y: number) => void;
  onDeleteClick: () => void;
}) {
  const t = useT();
  return (
    <SelectableRow
      className={BRANCH_ROW_CLASS}
      selected={selected}
      // Task 8: aria-pressed (valid on role="button") conveys a toggled
      // selection WITHOUT aria-current's "current location" meaning — in a
      // git client "current branch" means the CHECKED-OUT branch
      // (is_current), so a single-clicked non-current branch must not be
      // announced as "current".
      aria-pressed={selected}
      onSelect={() => {
        if (isRenaming) return;
        onSelect();
      }}
      onDoubleClick={() => {
        // One checkout at a time: double-clicking two branches quickly must
        // not queue a second switch behind the first.
        if (b.is_current || isRenaming || checkoutPending) return;
        onRequestSwitch();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenuOpen(e.clientX, e.clientY);
      }}
      title={
        b.is_current
          ? t("shell.branch.currentRowTitle")
          : t("shell.branch.rowTitle", { name: b.name })
      }
      // Explicit label (not name-from-content): without it, the nested
      // delete button's own "Apagar X" label bleeds into this row's
      // computed accessible name too.
      aria-label={display}
      style={{
        gap: 9,
        padding: indent ? "6px 10px 6px 25px" : "6px 10px",
        fontSize: "var(--fs-sm)",
        fontFamily: mono,
        color: b.is_current ? "var(--text)" : "var(--text2)",
        fontWeight: b.is_current ? "var(--fw-semibold)" : "var(--fw-regular)",
        // Selection accent (Task 8): a lateral bar distinct from the
        // is_current dot/halo below — a branch can be selected without
        // being the checked-out branch, and vice versa.
        boxShadow: selected ? "inset 3px 0 0 var(--accent)" : undefined,
      }}
    >
      {/* Active branch: filled dot with a halo ring, unmissable at a glance. */}
      <span
        style={
          b.is_current
            ? { width: 8, height: 8, borderRadius: "50%", background: "var(--l0)", boxShadow: "0 0 0 3px var(--l0bg)", flexShrink: 0 }
            : { width: 6, height: 6, borderRadius: "50%", border: "1.5px solid var(--muted)", boxSizing: "border-box", flexShrink: 0 }
        }
      />
      {isRenaming ? (
        <Input
          autoFocus
          mono
          value={renameVal}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onRenameValChange(e.target.value)}
          onKeyDown={(e) => {
            // The row itself is now a real keyboard control (Enter/Space
            // activate it) — without this, typing Enter/Space here would
            // also bubble up and re-trigger the row's onSelect/onKeyDown.
            e.stopPropagation();
            if (e.key === "Escape") onRenameCancel();
            if (e.key === "Enter" && renameVal.trim()) onRenameCommit(renameVal.trim());
          }}
          onBlur={onRenameCancel}
          style={{ flex: 1, minWidth: 0, padding: "3px 7px", fontSize: "var(--fs-btn)" }}
        />
      ) : (
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</span>
      )}
      {/* Ahead/behind the upstream (R5.8): work to push shows ↑n, work to
          pull shows ↓n — visible per branch, not only for the current one. */}
      {!isRenaming && b.ahead > 0 && (
        <span title={t("shell.branch.aheadTitle", { count: b.ahead })} style={{ flexShrink: 0 }}>
          <Badge accent>↑{b.ahead}</Badge>
        </span>
      )}
      {!isRenaming && b.behind > 0 && (
        <span title={t("shell.branch.behindTitle", { count: b.behind })} style={{ flexShrink: 0 }}>
          <Badge>↓{b.behind}</Badge>
        </span>
      )}
      {!b.is_current && !isRenaming && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          onKeyDown={(e) => {
            // Stop the row's own Enter/Space activation (SelectableRow's
            // onKeyDown) from also firing via bubbling; activate this
            // button itself the same explicit way every other migrated
            // control here does.
            e.stopPropagation();
            activateOnKeyDown(e);
          }}
          title={t("shell.branch.deleteAria", { name: b.name })}
          aria-label={t("shell.branch.deleteAria", { name: b.name })}
          style={{ color: "var(--muted)", fontSize: 10, padding: "1px 4px", borderRadius: "var(--r-xs)", flexShrink: 0, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          ✕
        </button>
      )}
    </SelectableRow>
  );
}
