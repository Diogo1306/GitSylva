import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import type { RepoInfo } from "../../lib/types";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { GroupEditModal } from "./GroupEditModal";
import { groupColor } from "../../lib/groupColors";

const mono = "'JetBrains Mono', monospace";

// VS Code-style left rail listing open repositories, optionally grouped (name +
// colour). Right-click a repo to move it between groups; right-click a group to
// rename or delete it.
export function RepoRail() {
  const repos = useAppStore((s) => s.repos);
  const repo = useAppStore((s) => s.repo);
  const groups = useAppStore((s) => s.groups);
  const groupOf = useAppStore((s) => s.groupOf);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const closeRepo = useAppStore((s) => s.closeRepo);
  const setView = useAppStore((s) => s.setView);
  const addGroup = useAppStore((s) => s.addGroup);
  const removeGroup = useAppStore((s) => s.removeGroup);
  const toggleGroupCollapsed = useAppStore((s) => s.toggleGroupCollapsed);
  const setRepoGroup = useAppStore((s) => s.setRepoGroup);

  const [menu, setMenu] = useState<{ x: number; y: number; kind: "repo" | "group"; id: string } | null>(null);
  const [editGroup, setEditGroup] = useState<string | null>(null);

  const ungrouped = repos.filter((r) => !groupOf[r.path] || !groups.some((g) => g.id === groupOf[r.path]));

  const repoRow = (r: RepoInfo, i: number) => {
    const active = r.path === repo?.path;
    const name = r.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? r.path;
    return (
      <div
        key={r.path}
        onClick={() => switchRepo(r.path)}
        onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, kind: "repo", id: r.path }); }}
        className="gs-row"
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, cursor: "pointer", background: active ? "var(--sel)" : undefined }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--l${i % 3})`, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active ? repo?.current_branch : r.current_branch}</div>
        </div>
        <span onClick={(e) => { e.stopPropagation(); closeRepo(r.path); }} title="Fechar" className="gs-row" style={{ width: 15, height: 15, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 9, flexShrink: 0 }}>✕</span>
      </div>
    );
  };

  return (
    <div style={{ width: 176, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--panel2)", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", boxSizing: "border-box", animation: "fadeUp 0.25s ease both" }}>
      {groups.map((g) => {
        const members = repos.filter((r) => groupOf[r.path] === g.id);
        const gc = groupColor(g.color);
        return (
          <div key={g.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              onClick={() => toggleGroupCollapsed(g.id)}
              onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, kind: "group", id: g.id }); }}
              className="gs-row"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", borderRadius: 7, cursor: "pointer" }}
            >
              <span style={{ fontSize: 9, color: gc.fg, transform: `rotate(${g.collapsed ? 0 : 90}deg)`, transition: "transform 0.15s", display: "inline-block" }}>▶</span>
              <span style={{ flex: 1, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.6px", color: gc.fg, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{members.length}</span>
            </div>
            {!g.collapsed && <div style={{ paddingLeft: 6 }}>{members.map((r) => repoRow(r, repos.indexOf(r)))}</div>}
          </div>
        );
      })}

      {ungrouped.length > 0 && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: "var(--muted)", padding: "6px 8px 4px" }}>PROJETOS</div>}
      {ungrouped.map((r) => repoRow(r, repos.indexOf(r)))}

      <div onClick={() => setView("picker")} className="gs-row" style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1.5px dashed var(--btnB)", color: "var(--muted)", fontSize: 12, textAlign: "center", cursor: "pointer" }}>
        + Abrir repositório
      </div>

      {menu &&
        (() => {
          if (menu.kind === "group") {
            const items: MenuItem[] = [
              { label: "Editar nome e cor…", onClick: () => setEditGroup(menu.id) },
              { label: "Apagar grupo", danger: true, onClick: () => removeGroup(menu.id) },
            ];
            return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
          }
          const path = menu.id;
          const items: MenuItem[] = [
            { label: "Novo grupo com este repo", onClick: () => { const id = addGroup("Grupo"); setRepoGroup(path, id); } },
            ...groups.map((g) => ({ label: `Mover para “${g.name}”`, onClick: () => setRepoGroup(path, g.id) })),
          ];
          if (groupOf[path]) items.push({ label: "Remover do grupo", onClick: () => setRepoGroup(path, undefined) });
          return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
        })()}

      {editGroup && <GroupEditModal groupId={editGroup} onClose={() => setEditGroup(null)} />}
    </div>
  );
}
