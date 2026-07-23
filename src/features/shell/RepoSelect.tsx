import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore, type RecentRepo } from "../../state/recentsStore";
import { usePinnedStore } from "../../state/pinnedStore";
import { openRepo, revealPath } from "../../lib/api";
import { toast } from "../../state/toastStore";
import { errMsg } from "../../lib/errors";
import { activateOnKeyDown } from "../../components/ui/keys";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { useT } from "../../i18n";

function repoName(path: string): string {
  return path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? path;
}

type Row = { path: string; name: string; branch: string };

const sectionLabel: React.CSSProperties = {
  padding: "8px 10px 4px",
  fontSize: "var(--fs-label)",
  fontWeight: "var(--fw-bold)",
  letterSpacing: "1.2px",
  color: "var(--muted)",
};

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" };

// V2 repo dropdown (replaces the old tab strip): a pill showing the active repo
// and branch, opening a menu with three sections — ABERTOS, FIXADOS, RECENTES.
// A repo shows in exactly one section: open (★ if also pinned) → ABERTOS;
// pinned-but-closed → FIXADOS; everything else recent → RECENTES. Each row's
// `…` menu offers pin/unpin, reveal, copy path, and (open repos only) close.
// `+` opens the picker.
export function RepoSelect() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const repos = useAppStore((s) => s.repos);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const setRepo = useAppStore((s) => s.setRepo);
  const requestCloseRepo = useAppStore((s) => s.requestCloseRepo);
  const setView = useAppStore((s) => s.setView);
  const recents = useRecentsStore((s) => s.recents);
  const pinned = usePinnedStore((s) => s.pinned);
  const pin = usePinnedStore((s) => s.pin);
  const unpin = usePinnedStore((s) => s.unpin);

  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; path: string; open: boolean } | null>(null);

  const openPaths = new Set(repos.map((r) => r.path));
  const pinnedSet = new Set(pinned);
  const recentsByPath = new Map(recents.map((r) => [r.path, r]));

  const openRows: Row[] = repos.map((r) => ({ path: r.path, name: repoName(r.path), branch: r.current_branch }));
  const pinnedRows: Row[] = pinned.filter((p) => !openPaths.has(p)).map((p) => recentsByPath.get(p)).filter((r): r is RecentRepo => !!r);
  const recentRows: Row[] = recents.filter((r) => !openPaths.has(r.path) && !pinnedSet.has(r.path)).slice(0, 6);

  async function openRecent(path: string) {
    setOpen(false);
    try {
      setRepo(await openRepo(path));
    } catch (e: unknown) {
      toast(errMsg(e), "error");
    }
  }

  function repoMenuItems(path: string, isOpen: boolean): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: pinnedSet.has(path) ? t("shell.repoSel.unpin") : t("shell.repoSel.pin"),
        onClick: () => (pinnedSet.has(path) ? unpin(path) : pin(path)),
      },
      {
        label: t("shell.repoSel.reveal"),
        onClick: () => void revealPath(path, "").catch((e: unknown) => toast(errMsg(e, t("shell.repoSel.revealError")), "error")),
      },
      {
        label: t("shell.repoSel.copyPath"),
        onClick: () => void navigator.clipboard?.writeText(path).then(() => toast(t("shell.repoSel.pathCopied"))),
      },
    ];
    // Closing only makes sense for an open repo, and never for the last one open.
    if (isOpen && repos.length > 1) {
      items.push({ label: "", onClick: () => {}, divider: true });
      items.push({ label: t("shell.repoSel.close"), danger: true, onClick: () => requestCloseRepo(path) });
    }
    return items;
  }

  function openRowMenu(e: React.MouseEvent | React.KeyboardEvent, path: string, isOpen: boolean) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ x: rect.right, y: rect.bottom, path, open: isOpen });
  }

  function renderRow(r: Row, opts: { active?: boolean; open: boolean }) {
    const isPinned = pinnedSet.has(r.path);
    return (
      <div
        key={r.path}
        role="menuitem"
        tabIndex={0}
        onClick={() => {
          if (opts.open) {
            switchRepo(r.path);
            setOpen(false);
          } else {
            void openRecent(r.path);
          }
        }}
        onKeyDown={activateOnKeyDown}
        aria-current={opts.active}
        className="gs-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          height: 36,
          padding: "0 4px 0 10px",
          borderRadius: "var(--r-md)",
          cursor: "pointer",
          background: opts.active ? "var(--sel)" : "transparent",
          boxSizing: "border-box",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: opts.active ? "var(--l0)" : opts.open ? "var(--l2)" : "var(--muted)", flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: opts.active ? "var(--fw-semibold)" : "var(--fw-medium)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.name}
        </span>
        {isPinned && (
          <span title={t("shell.repoSel.pinnedTitle")} style={{ color: "var(--l2)", fontSize: 11 }}>★</span>
        )}
        <span style={mono}>{r.branch}</span>
        <span
          role="button"
          tabIndex={0}
          aria-label={t("shell.repoSel.optionsAria")}
          title={t("shell.repoSel.optionsAria")}
          onClick={(e) => openRowMenu(e, r.path, opts.open)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openRowMenu(e, r.path, opts.open);
            }
          }}
          className="gs-row"
          style={{ width: 30, height: 30, borderRadius: "var(--r-sm)", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13, cursor: "pointer", flexShrink: 0 }}
        >
          …
        </span>
      </div>
    );
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
          width: 36,
          height: 36,
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
            {openRows.map((r) => renderRow(r, { active: r.path === repo.path, open: true }))}

            {pinnedRows.length > 0 && (
              <>
                <div style={sectionLabel}>{t("shell.repoSel.pinned")}</div>
                {pinnedRows.map((r) => renderRow(r, { open: false }))}
              </>
            )}

            {recentRows.length > 0 && (
              <>
                <div style={sectionLabel}>{t("shell.repoSel.recents")}</div>
                {recentRows.map((r) => renderRow(r, { open: false }))}
              </>
            )}
          </div>
        </>
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={repoMenuItems(menu.path, menu.open)} onClose={() => setMenu(null)} />}
    </div>
  );
}
