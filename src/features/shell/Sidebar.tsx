import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useBranches, useBranchActions, useStashes, useTags, useTagActions, useRewriteActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth } from "../../lib/usePanelWidth";
import { Input } from "../../components/ui/Input";
import { groupBranches, type BranchGroup } from "../../lib/branchFolders";
import type { BranchInfo } from "../../lib/types";
import type { View } from "../../state/appStore";

const mono = "'JetBrains Mono', monospace";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", padding: "0 10px 6px" }}>
      {children}
    </div>
  );
}

export function Sidebar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const setModal = useAppStore((s) => s.setModal);
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useStatus(repo.path);
  const wcCount = (data ?? []).length;
  const { data: branchData } = useBranches(repo.path);
  const { checkout, remove, rename } = useBranchActions(repo.path);
  const { rebase } = useRewriteActions(repo.path);
  const tagActions = useTagActions(repo.path);
  const [menu, setMenu] = useState<{ x: number; y: number; name: string } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ name: string; force: boolean } | null>(null);
  const [confirmRebase, setConfirmRebase] = useState<string | null>(null);
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

  // One remote-branch row (checkout by tracking name); shared by flat entries
  // and folder members, which indent deeper and drop the prefix.
  function remoteRow(remote: string, shortName: string, display: string, padLeft: number) {
    return (
      <div
        key={`${remote}/${shortName}`}
        onClick={() =>
          !checkout.isPending &&
          checkout.mutate(shortName, {
            onSuccess: () => toast(`Em ${shortName}`),
            onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível fazer checkout", "error"),
          })
        }
        className="gs-row"
        title={`Checkout local de ${remote}/${shortName}`}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: `5px 10px 5px ${padLeft}px`, borderRadius: 8, fontSize: 12.5, fontFamily: mono, color: "var(--muted)", cursor: "pointer" }}
      >
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted)", flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{display}</span>
      </div>
    );
  }

  // One row per branch, shared by flat entries and folder members (members
  // show the name without the folder prefix and indent under the caret).
  function branchRow(b: BranchInfo, display: string, indent: boolean) {
    return (
      <div
        key={b.name}
        onClick={() => {
          // One checkout at a time: clicking two branches quickly must not
          // queue a second switch behind the first.
          if (b.is_current || renaming === b.name || checkout.isPending) return;
          checkout.mutate(b.name, {
            onSuccess: () => toast(`Em ${b.name}`),
            onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível mudar de branch", "error"),
          });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY, name: b.name });
        }}
        className="gs-row"
        title={b.is_current ? "Branch atual" : `Mudar para ${b.name} · botão direito para opções`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: indent ? "6px 10px 6px 25px" : "6px 10px",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: mono,
          color: b.is_current ? "var(--l0)" : "var(--text2)",
          fontWeight: b.is_current ? 600 : 400,
          cursor: b.is_current ? "default" : "pointer",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: b.is_current ? "var(--l0bg)" : "transparent",
            border: `1.5px solid ${b.is_current ? "var(--l0)" : "var(--muted)"}`,
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        />
        {renaming === b.name ? (
          <Input
            autoFocus
            mono
            value={renameVal}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => {
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
        {!b.is_current && renaming !== b.name && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete({ name: b.name, force: false });
            }}
            title={`Apagar ${b.name}`}
            style={{ color: "var(--muted)", fontSize: 10, padding: "1px 4px", borderRadius: 5, flexShrink: 0 }}
          >
            ✕
          </span>
        )}
      </div>
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
    <div
      onClick={() => setView(key)}
      className="gs-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 10px",
        borderRadius: 8,
        fontSize: 13.5,
        color: "var(--text)",
        cursor: "pointer",
        background: view === key ? "var(--sel)" : "transparent",
      }}
    >
      {dot}
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "1px 7px" }}>
          {badge}
        </span>
      )}
    </div>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px 6px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>BRANCHES</div>
          <span
            onClick={() => setModal("branch")}
            className="gs-row"
            title="Nova branch"
            style={{ width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14, cursor: "pointer" }}
          >
            +
          </span>
        </div>
        {groupBranches(localBranches).map((g) =>
          g.kind === "branch" ? (
            branchRow(g.branch, g.branch.name, false)
          ) : (
            <div key={`pasta-${g.name}`} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <div
                onClick={() => setOpenFolders((s) => ({ ...s, [g.name]: !folderOpen(g) }))}
                className="gs-row"
                title={`${folderOpen(g) ? "Colapsar" : "Expandir"} ${g.name}/`}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", borderRadius: 8, fontSize: 13, fontFamily: mono, color: "var(--text2)", cursor: "pointer" }}
              >
                <span style={{ fontSize: 9, color: "var(--muted)", transform: `rotate(${folderOpen(g) ? 90 : 0}deg)`, transition: "transform 0.15s", display: "inline-block", width: 6, flexShrink: 0 }}>▶</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}/</span>
                {/* A closed folder still shows where you are. */}
                {!folderOpen(g) && g.members.some((m) => m.is_current) && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--l0bg)", border: "1.5px solid var(--l0)", boxSizing: "border-box", flexShrink: 0 }} />
                )}
                <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 10.5, fontWeight: 600, padding: "0 6px", flexShrink: 0 }}>
                  {g.members.length}
                </span>
              </div>
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
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px", fontSize: 13, fontFamily: mono, color: "var(--text2)" }}>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>▾</span>
                <span style={{ flex: 1 }}>{remote}</span>
              </div>
              {groupBranches(
                remoteBranches
                  .filter((b) => b.name.startsWith(remote + "/"))
                  .map((b) => ({ ...b, name: b.name.slice(remote.length + 1) })),
              ).map((g) =>
                g.kind === "branch" ? (
                  remoteRow(remote, g.branch.name, g.branch.name, 20)
                ) : (
                  <div key={`pasta-${remote}:${g.name}`} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <div
                      onClick={() => setOpenFolders((s) => ({ ...s, [`${remote}:${g.name}`]: !(s[`${remote}:${g.name}`] ?? false) }))}
                      className="gs-row"
                      title={`${openFolders[`${remote}:${g.name}`] ? "Colapsar" : "Expandir"} ${g.name}/`}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 10px 5px 20px", borderRadius: 8, fontSize: 12.5, fontFamily: mono, color: "var(--muted)", cursor: "pointer" }}
                    >
                      <span style={{ fontSize: 8, transform: `rotate(${openFolders[`${remote}:${g.name}`] ? 90 : 0}deg)`, transition: "transform 0.15s", display: "inline-block", width: 5, flexShrink: 0 }}>▶</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}/</span>
                      <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 10, fontWeight: 600, padding: "0 6px", flexShrink: 0 }}>
                        {g.members.length}
                      </span>
                    </div>
                    {openFolders[`${remote}:${g.name}`] && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, animation: "fadeIn 0.15s ease both" }}>
                        {g.members.map((m) => remoteRow(remote, m.name, m.name.slice(g.name.length + 1), 34))}
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
            <span onClick={() => setModal("tag")} className="gs-row" title="Nova tag" style={{ width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14, cursor: "pointer" }}>+</span>
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
      <div
        onClick={() => setView("settings")}
        className="gs-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "7px 10px",
          borderRadius: 8,
          fontSize: 13.5,
          color: "var(--text2)",
          cursor: "pointer",
          background: view === "settings" ? "var(--sel)" : "transparent",
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", border: "2px solid var(--muted)", boxSizing: "border-box", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Definições</span>
      </div>

      {menu &&
        (() => {
          const name = menu.name;
          const isCurrent = localBranches.find((b) => b.name === name)?.is_current;
          const items: MenuItem[] = [
            { label: "Renomear", onClick: () => { setRenaming(name); setRenameVal(name); } },
          ];
          if (!isCurrent) {
            items.push({ label: `Rebase da atual sobre ${name}…`, onClick: () => setConfirmRebase(name) });
            items.push({ label: "Apagar branch…", danger: true, onClick: () => setConfirmDelete({ name, force: false }) });
          }
          return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
        })()}

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
