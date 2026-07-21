import { useState, type KeyboardEvent } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useBranches, useBranchActions, useStashes, useTags, useTagActions, useRewriteActions, useSyncActions } from "../../state/queries";
import { notify } from "../../state/notificationStore";
import { toast } from "../../state/toastStore";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth } from "../../lib/usePanelWidth";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { activateOnKeyDown } from "../../components/ui/keys";
import { groupBranches, type BranchGroup } from "../../lib/branchFolders";
import type { BranchInfo } from "../../lib/types";
import type { View } from "../../state/appStore";

const mono = "'JetBrains Mono', monospace";

// Rows in the branches section (branch rows and folder-toggle headers) carry
// this marker class so ArrowDown/ArrowUp can walk between whatever is
// CURRENTLY visible (folder members collapse in and out) without hardcoding
// the list. A class (not a data-* prop) because SelectableRow's typed props
// don't declare arbitrary data attributes, while className always does.
const BRANCH_ROW_CLASS = "gs-branch-row";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", padding: "0 10px 6px" }}>
      {children}
    </div>
  );
}

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

export function Sidebar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const setModal = useAppStore((s) => s.setModal);
  const setFocusCommit = useAppStore((s) => s.setFocusCommit);
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useStatus(repo.path);
  const wcCount = (data ?? []).length;
  const { data: branchData } = useBranches(repo.path);
  const { checkout, remove, rename, merge, create } = useBranchActions(repo.path);
  const sync = useSyncActions(repo.path);
  const { rebase } = useRewriteActions(repo.path);
  const tagActions = useTagActions(repo.path);
  // `remote` menus act on "origin/x" names (checkout uses the short name).
  const [menu, setMenu] = useState<{ x: number; y: number; name: string; remote?: { full: string; short: string; tip: string } } | null>(null);
  // "Criar branch a partir daqui…" (R5.16): name prompt + the source tip.
  const [createFrom, setCreateFrom] = useState<{ label: string; tip: string } | null>(null);
  const [createName, setCreateName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ name: string; force: boolean } | null>(null);
  const [confirmRebase, setConfirmRebase] = useState<string | null>(null);
  // Switching branches asks first (R5.8) — a double-click is easy to land on
  // the wrong row and the working tree changes underneath you.
  const [confirmSwitch, setConfirmSwitch] = useState<string | null>(null);
  const [confirmMerge, setConfirmMerge] = useState<string | null>(null);
  const [remoteMenu, setRemoteMenu] = useState<{ x: number; y: number; remote: string } | null>(null);
  const [tagMenu, setTagMenu] = useState<{ x: number; y: number; name: string } | null>(null);
  const [confirmDeleteTag, setConfirmDeleteTag] = useState<string | null>(null);
  // Design: sidebar resizable 180–340, persisted.
  const sidebarW = usePanelWidth("gitsylva-w-sidebar", 232, 180, 340, "right");
  // Branch folders (feature/, fix/, …): collapsed by default so big lists stay
  // short; the folder holding the CURRENT branch starts open, and the user's
  // explicit toggles win for the rest of the session.
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const folderOpen = (g: Extract<BranchGroup, { kind: "folder" }>) =>
    openFolders[g.name] ?? g.members.some((m) => m.is_current);

  // Show a branch's tip commit in the history (single click, user request
  // R5.1). Double click still checks the branch out.
  function focusBranch(tip: string) {
    if (!tip) return;
    setFocusCommit(tip);
    if (view !== "history") setView("history");
  }

  // One remote-branch row (single click shows the tip, double click checks out
  // a local tracking branch); shared by flat entries and folder members, which
  // indent deeper and drop the prefix.
  function remoteRow(remote: string, shortName: string, display: string, padLeft: number, tip: string) {
    return (
      <SelectableRow
        key={`${remote}/${shortName}`}
        onSelect={() => focusBranch(tip)}
        onDoubleClick={() => !checkout.isPending && setConfirmSwitch(shortName)}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, name: shortName, remote: { full: `${remote}/${shortName}`, short: shortName, tip } });
        }}
        title={`1 clique: ver no histórico · 2 cliques: checkout local de ${remote}/${shortName} · botão direito para opções`}
        style={{ gap: 9, padding: `5px 10px 5px ${padLeft}px`, fontSize: 12.5, fontFamily: mono, color: "var(--muted)" }}
      >
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted)", flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</span>
      </SelectableRow>
    );
  }

  // One row per branch, shared by flat entries and folder members (members
  // show the name without the folder prefix and indent under the caret).
  // Single click focuses the tip commit in the history; DOUBLE click switches
  // branch (R5.1 — switching was too easy to trigger by accident).
  function branchRow(b: BranchInfo, display: string, indent: boolean) {
    return (
      <SelectableRow
        key={b.name}
        className={BRANCH_ROW_CLASS}
        onSelect={() => {
          if (renaming === b.name) return;
          focusBranch(b.tip);
        }}
        onDoubleClick={() => {
          // One checkout at a time: double-clicking two branches quickly must
          // not queue a second switch behind the first.
          if (b.is_current || renaming === b.name || checkout.isPending) return;
          setConfirmSwitch(b.name);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, name: b.name });
        }}
        title={
          b.is_current
            ? "Branch atual · 1 clique: ver no histórico"
            : `1 clique: ver no histórico · 2 cliques: mudar para ${b.name} · botão direito para opções`
        }
        // Explicit label (not name-from-content): without it, the nested
        // delete button's own "Apagar X" label bleeds into this row's
        // computed accessible name too.
        aria-label={display}
        style={{
          gap: 9,
          padding: indent ? "6px 10px 6px 25px" : "6px 10px",
          fontSize: 13,
          fontFamily: mono,
          color: b.is_current ? "var(--l0)" : "var(--text2)",
          fontWeight: b.is_current ? 600 : 400,
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
        {renaming === b.name ? (
          <Input
            autoFocus
            mono
            value={renameVal}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => {
              // The row itself is now a real keyboard control (Enter/Space
              // activate it) — without this, typing Enter/Space here would
              // also bubble up and re-trigger the row's onSelect/onKeyDown.
              e.stopPropagation();
              if (e.key === "Escape") setRenaming(null);
              if (e.key === "Enter" && renameVal.trim()) {
                rename.mutate(
                  { old: b.name, name: renameVal.trim() },
                  { onSuccess: () => { toast(`Renomeada para ${renameVal.trim()}`); setRenaming(null); }, onError: (err: unknown) => toast((err as { message?: string })?.message ?? "não foi possível renomear", "error") },
                );
              }
            }}
            onBlur={() => setRenaming(null)}
            style={{ flex: 1, minWidth: 0, padding: "3px 7px", fontSize: 12.5 }}
          />
        ) : (
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</span>
        )}
        {/* Ahead/behind the upstream (R5.8): work to push shows ↑n, work to
            pull shows ↓n — visible per branch, not only for the current one. */}
        {renaming !== b.name && b.ahead > 0 && (
          <span title={`${b.ahead} commit(s) por enviar (push)`} style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, background: "var(--accent)", color: "var(--accentT)", borderRadius: 999, padding: "0 6px", flexShrink: 0 }}>
            ↑{b.ahead}
          </span>
        )}
        {renaming !== b.name && b.behind > 0 && (
          <span title={`${b.behind} commit(s) por integrar (pull)`} style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, padding: "0 6px", flexShrink: 0 }}>
            ↓{b.behind}
          </span>
        )}
        {!b.is_current && renaming !== b.name && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ name: b.name, force: false });
            }}
            onKeyDown={(e) => {
              // Stop the row's own Enter/Space activation (SelectableRow's
              // onKeyDown) from also firing via bubbling; activate this
              // button itself the same explicit way every other migrated
              // control here does.
              e.stopPropagation();
              activateOnKeyDown(e);
            }}
            title={`Apagar ${b.name}`}
            aria-label={`Apagar ${b.name}`}
            style={{ color: "var(--muted)", fontSize: 10, padding: "1px 4px", borderRadius: 5, flexShrink: 0, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            ✕
          </button>
        )}
      </SelectableRow>
    );
  }

  // Delete asks first; if git refuses because the branch isn't merged, a second
  // dialog offers the forced (-D) path with a clear data-loss warning.
  function deleteBranch(name: string, force: boolean) {
    remove.mutate(
      { name, force },
      {
        onSuccess: () => toast(`Branch ${name} apagada`),
        onError: (e: unknown) => {
          const msg = (e as { message?: string })?.message ?? "";
          if (!force && msg.includes("not fully merged")) setConfirmDelete({ name, force: true });
          else toast(msg || "não foi possível apagar", "error");
        },
      },
    );
  }
  const { data: stashData } = useStashes(repo.path);
  const { data: tagData } = useTags(repo.path);
  // Local branches only in the sidebar list.
  const localBranches = (branchData ?? []).filter((b) => !b.is_remote);
  const remoteBranches = (branchData ?? []).filter((b) => b.is_remote);
  const stashCount = (stashData ?? []).length;
  const tags = (tagData ?? []).slice(0, 8);
  // Remote names derived from "<remote>/<branch>" refs.
  const remotes = Array.from(new Set(remoteBranches.map((b) => b.name.split("/")[0])));

  const navRow = (
    key: View,
    label: string,
    dot: React.ReactNode,
    badge?: number | null,
  ) => (
    <SelectableRow
      key={key}
      onSelect={() => setView(key)}
      style={{
        gap: 9,
        padding: "7px 10px",
        fontSize: 13.5,
        color: "var(--text)",
        // undefined (not "transparent") so .gs-row:hover still paints.
        background: view === key ? "var(--sel)" : undefined,
      }}
    >
      {dot}
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "1px 7px" }}>
          {badge}
        </span>
      )}
    </SelectableRow>
  );

  return (
    <div
      style={{
        width: sidebarW.width,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--panel)",
        padding: "14px 10px",
        overflowY: "auto",
        // Long branch names ellipsize — a horizontal scrollbar at the bottom
        // of the panel was pure noise (R5.1).
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <PanelHandle edge="right" handleProps={sidebarW.handleProps} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>ESPAÇO DE TRABALHO</SectionLabel>
        {navRow(
          "working",
          "Cópia de trabalho",
          <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--l2)", flexShrink: 0 }} />,
          wcCount,
        )}
        {navRow(
          "history",
          "Histórico",
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--l0)", flexShrink: 0 }} />,
        )}
        {navRow(
          "stashes",
          "Stashes",
          <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--l1)", transform: "rotate(45deg)", flexShrink: 0 }} />,
          stashCount,
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }} onKeyDown={onBranchListKeyDown}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px 6px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>BRANCHES</div>
          <button
            type="button"
            onClick={() => setModal("branch")}
            onKeyDown={activateOnKeyDown}
            title="Nova branch"
            aria-label="Nova branch"
            className="gs-row"
            style={{ width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
          >
            +
          </button>
        </div>
        {groupBranches(localBranches).map((g) =>
          g.kind === "branch" ? (
            branchRow(g.branch, g.branch.name, false)
          ) : (
            <div key={`pasta-${g.name}`} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <button
                type="button"
                onClick={() => setOpenFolders((s) => ({ ...s, [g.name]: !folderOpen(g) }))}
                onKeyDown={activateOnKeyDown}
                className={`gs-row ${BRANCH_ROW_CLASS}`}
                title={`${folderOpen(g) ? "Colapsar" : "Expandir"} ${g.name}`}
                aria-expanded={folderOpen(g)}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontFamily: mono, color: "var(--text2)", cursor: "pointer", background: "transparent", border: "none", width: "100%", textAlign: "left" }}
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
                        <span title={`${up} commit(s) por enviar nas branches desta pasta`} style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, background: "var(--accent)", color: "var(--accentT)", borderRadius: 999, padding: "0 6px", flexShrink: 0 }}>
                          ↑{up}
                        </span>
                      )}
                      {down > 0 && (
                        <span title={`${down} commit(s) por integrar nas branches desta pasta`} style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, padding: "0 6px", flexShrink: 0 }}>
                          ↓{down}
                        </span>
                      )}
                    </>
                  );
                })()}
              </button>
              {folderOpen(g) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 1, animation: "fadeIn 0.15s ease both" }}>
                  {g.members.map((m) => branchRow(m, m.name.slice(g.name.length + 1), true))}
                </div>
              )}
            </div>
          ),
        )}
        {localBranches.length === 0 && (
          <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)", fontFamily: mono }}>{repo.current_branch}</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>REMOTOS</SectionLabel>
        {remotes.length === 0 ? (
          <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>Sem remotos configurados</div>
        ) : (
          remotes.map((remote) => (
            <div key={remote} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <button
                type="button"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setRemoteMenu({ x: rect.left, y: rect.bottom, remote });
                }}
                onKeyDown={activateOnKeyDown}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setRemoteMenu({ x: e.clientX, y: e.clientY, remote });
                }}
                className="gs-row"
                title={`${remote} · fetch/pull/push`}
                aria-label={remote}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontFamily: mono, color: "var(--text2)", background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ color: "var(--muted)", fontSize: 11 }}>▾</span>
                <span style={{ flex: 1 }}>{remote}</span>
              </button>
              {groupBranches(
                remoteBranches
                  .filter((b) => b.name.startsWith(remote + "/"))
                  .map((b) => ({ ...b, name: b.name.slice(remote.length + 1) })),
              ).map((g) =>
                g.kind === "branch" ? (
                  remoteRow(remote, g.branch.name, g.branch.name, 20, g.branch.tip)
                ) : (
                  <div key={`pasta-${remote}:${g.name}`} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <button
                      type="button"
                      onClick={() => setOpenFolders((s) => ({ ...s, [`${remote}:${g.name}`]: !(s[`${remote}:${g.name}`] ?? false) }))}
                      onKeyDown={activateOnKeyDown}
                      className="gs-row"
                      title={`${openFolders[`${remote}:${g.name}`] ? "Colapsar" : "Expandir"} ${g.name}`}
                      aria-expanded={openFolders[`${remote}:${g.name}`] ?? false}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 10px 5px 20px", borderRadius: 8, fontSize: 12.5, fontFamily: mono, color: "var(--muted)", cursor: "pointer", background: "transparent", border: "none", width: "100%", textAlign: "left" }}
                    >
                      <span style={{ fontSize: 8, transform: `rotate(${openFolders[`${remote}:${g.name}`] ? 90 : 0}deg)`, transition: "transform 0.15s", display: "inline-block", width: 5, flexShrink: 0 }}>▶</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                    </button>
                    {openFolders[`${remote}:${g.name}`] && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, animation: "fadeIn 0.15s ease both" }}>
                        {g.members.map((m) => remoteRow(remote, m.name, m.name.slice(g.name.length + 1), 34, m.tip))}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          ))
        )}
      </div>

      {tags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px 6px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>TAGS</div>
            <button
              type="button"
              onClick={() => setModal("tag")}
              onKeyDown={activateOnKeyDown}
              title="Nova tag"
              aria-label="Nova tag"
              className="gs-row"
              style={{ width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
            >
              +
            </button>
          </div>
          {tags.map((t) => (
            <div
              key={t.name}
              title={`${t.subject || t.name} · botão direito para opções`}
              onContextMenu={(e) => {
                e.preventDefault();
                setTagMenu({ x: e.clientX, y: e.clientY, name: t.name });
              }}
              className="gs-row"
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontFamily: mono, color: "var(--text2)" }}
            >
              <span style={{ width: 6, height: 6, background: "var(--muted)", transform: "rotate(45deg)", flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {menu &&
        (() => {
          if (menu.remote) {
            // Remote-tracking branch, organized like SourceTree (R5.16):
            // checkout → integrar → derivar → utilitários.
            const r = menu.remote;
            const items: MenuItem[] = [
              { label: `Checkout local de ${r.short}…`, onClick: () => setConfirmSwitch(r.short) },
              { label: `Merge de ${r.full} na branch atual…`, onClick: () => setConfirmMerge(r.full) },
              { label: `Rebase da atual sobre ${r.full}…`, onClick: () => setConfirmRebase(r.full) },
              { label: "", onClick: () => {}, divider: true },
              { label: "Ver no histórico", onClick: () => focusBranch(r.tip) },
              { label: "Criar branch a partir daqui…", onClick: () => { setCreateName(""); setCreateFrom({ label: r.full, tip: r.tip }); } },
              { label: "", onClick: () => {}, divider: true },
              { label: "Copiar nome", onClick: () => void navigator.clipboard?.writeText(r.full).then(() => toast("Nome copiado")) },
            ];
            return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
          }
          const name = menu.name;
          const local = localBranches.find((b) => b.name === name);
          const isCurrent = local?.is_current;
          const items: MenuItem[] = [];
          if (!isCurrent) {
            items.push({ label: `Mudar para ${name}…`, onClick: () => setConfirmSwitch(name) });
            items.push({ label: `Merge de ${name} na branch atual…`, onClick: () => setConfirmMerge(name) });
            items.push({ label: `Rebase da atual sobre ${name}…`, onClick: () => setConfirmRebase(name) });
            items.push({ label: "", onClick: () => {}, divider: true });
          }
          items.push({ label: "Ver no histórico", onClick: () => focusBranch(local?.tip ?? "") });
          items.push({ label: "Criar branch a partir daqui…", onClick: () => { setCreateName(""); setCreateFrom({ label: name, tip: local?.tip ?? "" }); } });
          items.push({ label: "", onClick: () => {}, divider: true });
          items.push({ label: `Renomear ${name}…`, onClick: () => { setRenaming(name); setRenameVal(name); } });
          items.push({ label: "Copiar nome", onClick: () => void navigator.clipboard?.writeText(name).then(() => toast("Nome copiado")) });
          if (!isCurrent) {
            items.push({ label: `Apagar ${name}…`, danger: true, onClick: () => setConfirmDelete({ name, force: false }) });
          }
          return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
        })()}

      {remoteMenu && (
        <ContextMenu
          x={remoteMenu.x}
          y={remoteMenu.y}
          items={[
            {
              label: `Fetch de ${remoteMenu.remote}`,
              onClick: () => {
                if (sync.fetch.isPending) return;
                sync.fetch.mutate(undefined, {
                  onSuccess: () => notify("Fetch concluído", remoteMenu.remote, "success", "fetch"),
                  onError: (e: unknown) => notify("Fetch falhou", (e as { message?: string })?.message ?? "não foi possível fazer fetch", "error", "fetch"),
                });
              },
            },
            { label: `Pull de ${remoteMenu.remote}…`, onClick: () => setModal("pull") },
            { label: `Push para ${remoteMenu.remote}…`, onClick: () => setModal("push") },
          ]}
          onClose={() => setRemoteMenu(null)}
        />
      )}

      {createFrom && (
        <Modal title={`Criar branch a partir de ${createFrom.label}`} onClose={() => setCreateFrom(null)} width={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              autoFocus
              mono
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="feature/a-minha-branch"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {([false, true] as const).map((doCheckout) => (
                <Button
                  key={String(doCheckout)}
                  variant={doCheckout ? "primary" : "ghost"}
                  disabled={!createName.trim() || create.isPending}
                  onClick={() => {
                    const from = createFrom.tip;
                    const name = createName.trim();
                    setCreateFrom(null);
                    create.mutate(
                      { name, checkout: doCheckout, from },
                      {
                        onSuccess: () => toast(doCheckout ? `Em ${name}` : `Branch ${name} criada`),
                        onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível criar a branch", "error"),
                      },
                    );
                  }}
                >
                  {doCheckout ? "Criar e mudar" : "Criar"}
                </Button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={
            confirmDelete.force
              ? `A branch ${confirmDelete.name} tem commits que ainda não estão integrados noutra branch. Apagar mesmo assim? Esses commits perdem-se.`
              : `Apagar a branch ${confirmDelete.name}?`
          }
          confirmLabel={confirmDelete.force ? "Forçar eliminação" : "Apagar"}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            const { name, force } = confirmDelete;
            setConfirmDelete(null);
            deleteBranch(name, force);
          }}
        />
      )}

      {tagMenu && (
        <ContextMenu
          x={tagMenu.x}
          y={tagMenu.y}
          items={[
            { label: "Copiar nome", onClick: () => void navigator.clipboard?.writeText(tagMenu.name).then(() => toast("Nome copiado")) },
            { label: "Apagar tag…", danger: true, onClick: () => setConfirmDeleteTag(tagMenu.name) },
          ]}
          onClose={() => setTagMenu(null)}
        />
      )}

      {confirmDeleteTag && (
        <ConfirmDialog
          message={`Apagar a tag ${confirmDeleteTag}? (Só localmente — tags já enviadas continuam no remoto.)`}
          confirmLabel="Apagar tag"
          onCancel={() => setConfirmDeleteTag(null)}
          onConfirm={() => {
            const name = confirmDeleteTag;
            setConfirmDeleteTag(null);
            tagActions.remove.mutate(name, {
              onSuccess: () => toast(`Tag ${name} apagada`),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível apagar a tag", "error"),
            });
          }}
        />
      )}

      {confirmSwitch && (
        <ConfirmDialog
          message={`Mudar para a branch ${confirmSwitch}? A cópia de trabalho passa a refletir essa branch.`}
          confirmLabel="Mudar"
          onCancel={() => setConfirmSwitch(null)}
          onConfirm={() => {
            const name = confirmSwitch;
            setConfirmSwitch(null);
            if (checkout.isPending) return;
            checkout.mutate(name, {
              onSuccess: () => toast(`Em ${name}`),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível mudar de branch", "error"),
            });
          }}
        />
      )}

      {confirmMerge && (
        <ConfirmDialog
          message={`Merge de ${confirmMerge} na branch atual (${repo.current_branch})? Em caso de conflito, a Cópia de trabalho mostra os ficheiros por resolver.`}
          confirmLabel="Merge"
          onCancel={() => setConfirmMerge(null)}
          onConfirm={() => {
            const name = confirmMerge;
            setConfirmMerge(null);
            merge.mutate(name, {
              onSuccess: () => toast(`Merge de ${name} concluído`),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? "conflito no merge — vê a Cópia de trabalho", "error"),
            });
          }}
        />
      )}

      {confirmRebase && (
        <ConfirmDialog
          message={`Rebase de ${repo.current_branch} sobre ${confirmRebase}? Os commits locais da branch atual são reescritos.`}
          confirmLabel="Rebase"
          onCancel={() => setConfirmRebase(null)}
          onConfirm={() => {
            const onto = confirmRebase;
            setConfirmRebase(null);
            rebase.mutate(onto, {
              onSuccess: () => toast("Rebase concluído"),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? "conflito no rebase — vê a Cópia de trabalho", "error"),
            });
          }}
        />
      )}
    </div>
  );
}
