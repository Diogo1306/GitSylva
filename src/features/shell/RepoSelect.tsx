import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";
import { openRepo } from "../../lib/api";
import { toast } from "../../state/toastStore";
import { errMsg } from "../../lib/errors";
import { activateOnKeyDown } from "../../components/ui/keys";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { useT } from "../../i18n";

function repoName(path: string): string {
  return path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? path;
}

const sectionLabel: React.CSSProperties = {
  padding: "8px 10px 4px",
  fontSize: "var(--fs-label)",
  fontWeight: "var(--fw-bold)",
  letterSpacing: "1.2px",
  color: "var(--muted)",
};

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" };

// V2 repo dropdown (replaces the old tab strip): a pill showing the active repo
// and branch, opening a menu of open + recent repos; the `…` per row reuses the
// existing group/close actions. `+` opens the picker.
export function RepoSelect() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const repos = useAppStore((s) => s.repos);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const setRepo = useAppStore((s) => s.setRepo);
  const requestCloseRepo = useAppStore((s) => s.requestCloseRepo);
  const setView = useAppStore((s) => s.setView);
  const groups = useAppStore((s) => s.groups);
  const groupOf = useAppStore((s) => s.groupOf);
  const addGroup = useAppStore((s) => s.addGroup);
  const setRepoGroup = useAppStore((s) => s.setRepoGroup);
  const recents = useRecentsStore((s) => s.recents);

  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  const openPaths = new Set(repos.map((r) => r.path));
  const recentsNotOpen = recents.filter((r) => !openPaths.has(r.path)).slice(0, 6);

  async function openRecent(path: string) {
    setOpen(false);
    try {
      setRepo(await openRepo(path));
    } catch (e: unknown) {
      toast(errMsg(e), "error");
    }
  }

  function repoMenuItems(path: string): MenuItem[] {
    const items: MenuItem[] = [
      { label: t("shell.group.newWithRepo"), onClick: () => { const id = addGroup(t("shell.group.defaultName")); setRepoGroup(path, id); } },
      ...groups.map((g) => ({ label: t("shell.group.moveTo", { name: g.name }), onClick: () => setRepoGroup(path, g.id) })),
    ];
    if (groupOf[path]) items.push({ label: t("shell.group.removeFrom"), onClick: () => setRepoGroup(path, undefined) });
    items.push({ label: t("shell.tab.close", { name: repoName(path) }), danger: true, onClick: () => requestCloseRepo(path) });
    return items;
  }

  return (
    <div style={{ position: "relative", minWidth: 0, display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={activateOnKeyDown}
        title={t("shell.repoSel.tooltip")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="gs-lift"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          height: 32,
          padding: "0 11px",
          borderRadius: "var(--r-btn)",
          border: "1px solid var(--btnB)",
          background: "var(--btn)",
          cursor: "pointer",
          minWidth: 0,
          maxWidth: 340,
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--l0)", flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {repoName(repo.path)} <span style={{ color: "var(--muted)" }}>/</span> <b style={{ color: "var(--l0)" }}>{repo.current_branch}</b>
        </span>
        <span style={{ color: "var(--muted)", fontSize: 8, flexShrink: 0 }}>▾</span>
      </button>

      <button
        type="button"
        onClick={() => setView("picker")}
        onKeyDown={activateOnKeyDown}
        title={t("shell.repoSel.addRepo")}
        aria-label={t("shell.openRepo")}
        className="gs-lift gs-press-97"
        style={{
          width: 34,
          height: 32,
          borderRadius: "var(--r-btn)",
          display: "grid",
          placeItems: "center",
          border: "1px solid var(--btnB)",
          background: "var(--btn)",
          color: "var(--text2)",
          fontSize: 16,
          cursor: "pointer",
          flexShrink: 0,
          boxSizing: "border-box",
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        +
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 59 }} />
          <div
            role="menu"
            aria-label={t("shell.tabs.aria")}
            style={{
              position: "absolute",
              top: 40,
              left: 0,
              zIndex: 60,
              width: 272,
              background: "var(--win)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-card)",
              boxShadow: "var(--shadow-2)",
              padding: 6,
              display: "flex",
              flexDirection: "column",
              maxHeight: "70vh",
              overflowY: "auto",
              animation: "fadeUp 0.18s ease both",
            }}
          >
            <div style={sectionLabel}>{t("shell.repoSel.open")}</div>
            {repos.map((r) => {
              const active = r.path === repo.path;
              return (
                <div
                  key={r.path}
                  role="menuitem"
                  tabIndex={0}
                  onClick={() => { switchRepo(r.path); setOpen(false); }}
                  onKeyDown={activateOnKeyDown}
                  aria-current={active}
                  className="gs-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-2)",
                    height: 36,
                    padding: "0 4px 0 10px",
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                    background: active ? "var(--sel)" : "transparent",
                    boxSizing: "border-box",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "var(--l0)" : "var(--l2)", flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: active ? "var(--fw-semibold)" : "var(--fw-medium)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {repoName(r.path)}
                  </span>
                  <span style={mono}>{r.current_branch}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t("shell.repoSel.optionsAria")}
                    title={t("shell.repoSel.optionsAria")}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setMenu({ x: rect.right, y: rect.bottom, path: r.path });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setMenu({ x: rect.right, y: rect.bottom, path: r.path });
                      }
                    }}
                    className="gs-row"
                    style={{ width: 30, height: 30, borderRadius: "var(--r-sm)", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13, cursor: "pointer", flexShrink: 0 }}
                  >
                    …
                  </span>
                </div>
              );
            })}

            {recentsNotOpen.length > 0 && (
              <>
                <div style={sectionLabel}>{t("shell.repoSel.recents")}</div>
                {recentsNotOpen.map((r) => (
                  <div
                    key={r.path}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => void openRecent(r.path)}
                    onKeyDown={activateOnKeyDown}
                    className="gs-row"
                    style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", height: 36, padding: "0 10px", borderRadius: "var(--r-md)", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--muted)", flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                    <span style={mono}>{r.branch}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={repoMenuItems(menu.path)} onClose={() => setMenu(null)} />}
    </div>
  );
}
