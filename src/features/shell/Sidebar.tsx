import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useBranches, useBranchActions, useStashes, useTags, useTagActions, useRewriteActions, useSyncActions } from "../../state/queries";
import { notify } from "../../state/notificationStore";
import { toast } from "../../state/toastStore";
import { fetchFailureNotice } from "../../lib/errors";
import { useRecentBranchesStore } from "../../state/recentBranchesStore";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth } from "../../lib/usePanelWidth";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { activateOnKeyDown } from "../../components/ui/keys";
import { groupBranches } from "../../lib/branchFolders";
import { fold } from "../../lib/fold";
import { useBreakpoint } from "../../lib/useBreakpoint";
import { useT } from "../../i18n";
import type { BranchInfo } from "../../lib/types";
import { NavSection } from "./NavSection";
import { BranchList } from "./BranchList";
import { RemoteSection } from "./RemoteSection";
import { TagsSection } from "./TagsSection";

// A stable reference for "no recents yet" — a fresh `[]` on every selector
// call would make useSyncExternalStore see a "changed" snapshot every render
// and loop forever.
const NO_RECENTS: string[] = [];

export function Sidebar() {
  const t = useT();
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
  // Task 8: which branch row is SELECTED (single click), independent of
  // is_current (the checked-out branch, shown via the dot/halo). Local
  // branches key on their name; remote-tracking rows key on "<remote>/<name>"
  // so the two id spaces never collide. Transient UI state — not persisted.
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  // Design: sidebar resizable 180–340, persisted.
  const sidebarW = usePanelWidth("gitsylva-w-sidebar", 232, 180, 340, "right");
  // Task 6: below ~1024px wide the sidebar defaults to a collapsed icon
  // strip (a width-driven default); an explicit toggle always wins over that
  // default in either direction, so the user can pin it open on a narrow
  // window or collapse it on a wide one. null = "use the width default".
  const bp = useBreakpoint();
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const collapsed = collapsedOverride ?? bp.sidebarCollapsed;
  // Branch folders (feature/, fix/, …): collapsed by default so big lists stay
  // short; the folder holding the CURRENT branch starts open, and the user's
  // explicit toggles win for the rest of the session.
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  // Task 10: an accent-tolerant branch search (reuses lib/fold, same helper
  // the command palette and settings search use). While a query is active,
  // folders/remotes force themselves open to reveal matches — the underlying
  // openFolders/openRemotes state is never written by filtering, so clearing
  // the query snaps straight back to whatever was explicitly toggled (or the
  // defaults) without any extra bookkeeping.
  const [branchQuery, setBranchQuery] = useState("");
  const filtering = branchQuery.trim().length > 0;
  const branchMatches = (name: string) => !filtering || fold(name).includes(fold(branchQuery.trim()));

  // Show a branch's tip commit in the history (single click, user request
  // R5.1) and mark that branch SELECTED (Task 8) — a persistent background +
  // accent bar that survives until another branch is selected. Double click
  // still checks the branch out (unaffected by selection).
  function focusBranch(name: string, tip: string) {
    if (!tip) return;
    setSelectedBranch(name);
    setFocusCommit(tip);
    if (view !== "history") setView("history");
  }

  // Committing an in-progress branch rename (Enter in the row's inline
  // input, see BranchRow) — same mutate/toast flow regardless of which row
  // triggered it.
  function commitRename(oldName: string, newName: string) {
    rename.mutate(
      { old: oldName, name: newName },
      { onSuccess: () => { toast(t("shell.toast.renamedTo", { name: newName })); setRenaming(null); }, onError: (err: unknown) => toast((err as { message?: string })?.message ?? t("shell.error.rename"), "error") },
    );
  }

  // Delete asks first; if git refuses because the branch isn't merged, a second
  // dialog offers the forced (-D) path with a clear data-loss warning.
  function deleteBranch(name: string, force: boolean) {
    remove.mutate(
      { name, force },
      {
        onSuccess: () => toast(t("shell.toast.branchDeleted", { name })),
        onError: (e: unknown) => {
          const msg = (e as { message?: string })?.message ?? "";
          if (!force && msg.includes("not fully merged")) setConfirmDelete({ name, force: true });
          else toast(msg || t("shell.error.delete"), "error");
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
  // Task 10: branches surviving the search filter (identity when no query),
  // grouped the same way as the unfiltered list so matches still fold into
  // their folders/remotes (force-opened above via filtering).
  const localGroups = groupBranches(localBranches.filter((b) => branchMatches(b.name)));
  const visibleRemoteBranches = remoteBranches.filter((b) => branchMatches(b.name));
  const visibleRemotes = filtering ? remotes.filter((r) => visibleRemoteBranches.some((b) => b.name.startsWith(r + "/"))) : remotes;
  // Task 10: recently checked-out branches for THIS repo, most-recent first,
  // dropping any name that no longer exists (deleted/renamed since). Hidden
  // while filtering — the filtered list already surfaces what's relevant.
  const recentNames = useRecentBranchesStore((s) => s.byRepo[repo.path] ?? NO_RECENTS);
  const recentBranches = recentNames
    .map((n) => localBranches.find((b) => b.name === n))
    .filter((b): b is BranchInfo => !!b);

  // Collapsed: a slim icon-only strip that keeps the sidebar's width
  // footprint tiny at narrow windows while never losing access to nav or
  // branches — the expand button is the way back, always keyboard-reachable.
  if (collapsed) {
    return (
      <div
        style={{
          width: 44,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--panel)",
          padding: "var(--sp-6) var(--sp-2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={() => setCollapsedOverride(false)}
          onKeyDown={activateOnKeyDown}
          title={t("shell.sidebar.expand")}
          aria-label={t("shell.sidebar.expand")}
          aria-expanded={false}
          className="gs-lift"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--r-btn)",
            display: "grid",
            placeItems: "center",
            background: "var(--btn)",
            border: "1px solid var(--btnB)",
            color: "var(--btnT)",
            cursor: "pointer",
            padding: 0,
            fontSize: "var(--fs-sm)",
            fontFamily: "inherit",
          }}
        >
          »
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: sidebarW.width,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--panel)",
        padding: "var(--sp-6) var(--sp-4)",
        overflowY: "auto",
        // Long branch names ellipsize — a horizontal scrollbar at the bottom
        // of the panel was pure noise (R5.1).
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-8)",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <PanelHandle edge="right" handleProps={sidebarW.handleProps} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setCollapsedOverride(true)}
          onKeyDown={activateOnKeyDown}
          title={t("shell.sidebar.collapse")}
          aria-label={t("shell.sidebar.collapse")}
          aria-expanded={true}
          className="gs-lift"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--r-btn)",
            display: "grid",
            placeItems: "center",
            background: "transparent",
            border: "1px solid transparent",
            color: "var(--muted)",
            cursor: "pointer",
            padding: 0,
            fontSize: "var(--fs-sm)",
            fontFamily: "inherit",
          }}
        >
          «
        </button>
      </div>
      <NavSection view={view} setView={setView} wcCount={wcCount} stashCount={stashCount} />

      <BranchList
        localBranches={localBranches}
        localGroups={localGroups}
        recentBranches={recentBranches}
        filtering={filtering}
        branchQuery={branchQuery}
        setBranchQuery={setBranchQuery}
        selectedBranch={selectedBranch}
        renaming={renaming}
        renameVal={renameVal}
        setRenameVal={setRenameVal}
        openFolders={openFolders}
        setOpenFolders={setOpenFolders}
        checkoutPending={checkout.isPending}
        currentBranchName={repo.current_branch}
        onCreateBranch={() => setModal("branch")}
        onFocusBranch={focusBranch}
        onRequestSwitch={setConfirmSwitch}
        onContextMenu={setMenu}
        onDeleteRequest={(name) => setConfirmDelete({ name, force: false })}
        onRenameCommit={commitRename}
        onRenameCancel={() => setRenaming(null)}
      />

      <RemoteSection
        remotes={remotes}
        visibleRemotes={visibleRemotes}
        visibleRemoteBranches={visibleRemoteBranches}
        filtering={filtering}
        selectedBranch={selectedBranch}
        checkoutPending={checkout.isPending}
        openFolders={openFolders}
        setOpenFolders={setOpenFolders}
        onFocusBranch={focusBranch}
        onRequestSwitch={setConfirmSwitch}
        onContextMenu={setMenu}
        onRemoteMenuOpen={(x, y, remote) => setRemoteMenu({ x, y, remote })}
      />

      <TagsSection
        tags={tags}
        onCreateTag={() => setModal("tag")}
        onTagContextMenu={(x, y, name) => setTagMenu({ x, y, name })}
      />

      <div style={{ flex: 1 }} />

      {menu &&
        (() => {
          if (menu.remote) {
            // Remote-tracking branch, organized like SourceTree (R5.16):
            // checkout → integrar → derivar → utilitários.
            const r = menu.remote;
            const items: MenuItem[] = [
              { label: t("shell.branch.checkoutLocal", { name: r.short }), onClick: () => setConfirmSwitch(r.short) },
              { label: t("shell.branch.mergeInto", { name: r.full }), onClick: () => setConfirmMerge(r.full) },
              { label: t("shell.branch.rebaseOnto", { name: r.full }), onClick: () => setConfirmRebase(r.full) },
              { label: "", onClick: () => {}, divider: true },
              { label: t("shell.branch.viewInHistory"), onClick: () => focusBranch(r.full, r.tip) },
              { label: t("shell.branch.createFromHere"), onClick: () => { setCreateName(""); setCreateFrom({ label: r.full, tip: r.tip }); } },
              { label: "", onClick: () => {}, divider: true },
              { label: t("shell.copyName"), onClick: () => void navigator.clipboard?.writeText(r.full).then(() => toast(t("shell.toast.nameCopied"))) },
            ];
            return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
          }
          const name = menu.name;
          const local = localBranches.find((b) => b.name === name);
          const isCurrent = local?.is_current;
          const items: MenuItem[] = [];
          if (!isCurrent) {
            items.push({ label: t("shell.branch.switchTo", { name }), onClick: () => setConfirmSwitch(name) });
            items.push({ label: t("shell.branch.mergeInto", { name }), onClick: () => setConfirmMerge(name) });
            items.push({ label: t("shell.branch.rebaseOnto", { name }), onClick: () => setConfirmRebase(name) });
            items.push({ label: "", onClick: () => {}, divider: true });
          }
          items.push({ label: t("shell.branch.viewInHistory"), onClick: () => focusBranch(name, local?.tip ?? "") });
          items.push({ label: t("shell.branch.createFromHere"), onClick: () => { setCreateName(""); setCreateFrom({ label: name, tip: local?.tip ?? "" }); } });
          items.push({ label: "", onClick: () => {}, divider: true });
          items.push({ label: t("shell.branch.renameLabel", { name }), onClick: () => { setRenaming(name); setRenameVal(name); } });
          items.push({ label: t("shell.copyName"), onClick: () => void navigator.clipboard?.writeText(name).then(() => toast(t("shell.toast.nameCopied"))) });
          if (!isCurrent) {
            items.push({ label: t("shell.branch.deleteLabel", { name }), danger: true, onClick: () => setConfirmDelete({ name, force: false }) });
          }
          return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
        })()}

      {remoteMenu && (
        <ContextMenu
          x={remoteMenu.x}
          y={remoteMenu.y}
          items={[
            {
              label: t("shell.remote.fetch", { remote: remoteMenu.remote }),
              onClick: () => {
                if (sync.fetch.isPending) return;
                sync.fetch.mutate(undefined, {
                  onSuccess: () => notify(t("shell.fetch.doneTitle"), remoteMenu.remote, "success", "fetch"),
                  onError: (e: unknown) => {
                    const n = fetchFailureNotice(e);
                    notify(n.title, n.sub, "error", "fetch");
                  },
                });
              },
            },
            { label: t("shell.remote.pull", { remote: remoteMenu.remote }), onClick: () => setModal("pull") },
            { label: t("shell.remote.push", { remote: remoteMenu.remote }), onClick: () => setModal("push") },
          ]}
          onClose={() => setRemoteMenu(null)}
        />
      )}

      {createFrom && (
        <Modal title={t("shell.branch.createFromTitle", { name: createFrom.label })} onClose={() => setCreateFrom(null)} width={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              autoFocus
              mono
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={t("shell.branch.newPlaceholder")}
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
                        onSuccess: () => toast(doCheckout ? t("shell.toast.nowOn", { name }) : t("shell.toast.branchCreated", { name })),
                        onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("shell.error.createBranch"), "error"),
                      },
                    );
                  }}
                >
                  {doCheckout ? t("shell.branch.createAndSwitch") : t("common.create")}
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
              ? t("shell.branch.deleteForceMsg", { name: confirmDelete.name })
              : t("shell.branch.deleteMsg", { name: confirmDelete.name })
          }
          confirmLabel={confirmDelete.force ? t("shell.branch.forceDelete") : t("common.delete")}
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
            { label: t("shell.copyName"), onClick: () => void navigator.clipboard?.writeText(tagMenu.name).then(() => toast(t("shell.toast.nameCopied"))) },
            { label: t("shell.tag.deleteLabel"), danger: true, onClick: () => setConfirmDeleteTag(tagMenu.name) },
          ]}
          onClose={() => setTagMenu(null)}
        />
      )}

      {confirmDeleteTag && (
        <ConfirmDialog
          message={t("shell.tag.deleteMsg", { name: confirmDeleteTag })}
          confirmLabel={t("shell.tag.deleteConfirm")}
          onCancel={() => setConfirmDeleteTag(null)}
          onConfirm={() => {
            const name = confirmDeleteTag;
            setConfirmDeleteTag(null);
            tagActions.remove.mutate(name, {
              onSuccess: () => toast(t("shell.toast.tagDeleted", { name })),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("shell.error.deleteTag"), "error"),
            });
          }}
        />
      )}

      {confirmSwitch && (
        <ConfirmDialog
          message={t("shell.branch.switchMsg", { name: confirmSwitch })}
          confirmLabel={t("shell.branch.switchConfirm")}
          onCancel={() => setConfirmSwitch(null)}
          onConfirm={() => {
            const name = confirmSwitch;
            setConfirmSwitch(null);
            if (checkout.isPending) return;
            checkout.mutate(name, {
              onSuccess: () => {
                // Task 10: track the checkout so it surfaces under "Recentes".
                useRecentBranchesStore.getState().record(repo.path, name);
                toast(t("shell.toast.nowOn", { name }));
              },
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("shell.error.switchBranch"), "error"),
            });
          }}
        />
      )}

      {confirmMerge && (
        <ConfirmDialog
          message={t("shell.branch.mergeMsg", { name: confirmMerge, current: repo.current_branch })}
          confirmLabel="Merge"
          onCancel={() => setConfirmMerge(null)}
          onConfirm={() => {
            const name = confirmMerge;
            setConfirmMerge(null);
            merge.mutate(name, {
              onSuccess: () => toast(t("shell.toast.mergeDone", { name })),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("shell.error.mergeConflictWC"), "error"),
            });
          }}
        />
      )}

      {confirmRebase && (
        <ConfirmDialog
          message={t("shell.branch.rebaseMsg", { current: repo.current_branch, onto: confirmRebase })}
          confirmLabel="Rebase"
          onCancel={() => setConfirmRebase(null)}
          onConfirm={() => {
            const onto = confirmRebase;
            setConfirmRebase(null);
            rebase.mutate(onto, {
              onSuccess: () => toast(t("shell.toast.rebaseDone")),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("shell.error.rebaseConflictWC"), "error"),
            });
          }}
        />
      )}
    </div>
  );
}
