import { useState, type Dispatch, type SetStateAction } from "react";
import { activateOnKeyDown } from "../../components/ui/keys";
import { groupBranches } from "../../lib/branchFolders";
import type { BranchInfo } from "../../lib/types";
import { useT } from "../../i18n";
import { SectionLabel } from "./SectionLabel";
import { RemoteRow } from "./RemoteRow";

const mono = "'JetBrains Mono', monospace";

type ContextMenuRequest = { x: number; y: number; name: string; remote?: { full: string; short: string; tip: string } };

export function RemoteSection({
  remotes,
  visibleRemotes,
  visibleRemoteBranches,
  filtering,
  selectedBranch,
  checkoutPending,
  openFolders,
  setOpenFolders,
  onFocusBranch,
  onRequestSwitch,
  onContextMenu,
  onRemoteMenuOpen,
}: {
  remotes: string[];
  visibleRemotes: string[];
  visibleRemoteBranches: BranchInfo[];
  filtering: boolean;
  selectedBranch: string | null;
  checkoutPending: boolean;
  openFolders: Record<string, boolean>;
  setOpenFolders: Dispatch<SetStateAction<Record<string, boolean>>>;
  onFocusBranch: (name: string, tip: string) => void;
  onRequestSwitch: (name: string) => void;
  onContextMenu: (menu: ContextMenuRequest) => void;
  onRemoteMenuOpen: (x: number, y: number, remote: string) => void;
}) {
  const t = useT();
  // Remotes collapse by default (Task 10) — unlike local folders there's no
  // "holds the current branch" signal to auto-open one, so every remote
  // starts closed until the user (or a search match) opens it.
  const [openRemotes, setOpenRemotes] = useState<Record<string, boolean>>({});
  const remoteOpen = (remote: string) => filtering || (openRemotes[remote] ?? false);

  const row = (remote: string, shortName: string, display: string, padLeft: number, tip: string) => {
    const id = `${remote}/${shortName}`;
    return (
      <RemoteRow
        key={id}
        remote={remote}
        shortName={shortName}
        display={display}
        padLeft={padLeft}
        selected={selectedBranch === id}
        checkoutPending={checkoutPending}
        onSelect={() => onFocusBranch(id, tip)}
        onRequestSwitch={() => onRequestSwitch(shortName)}
        onContextMenuOpen={(x, y) => onContextMenu({ x, y, name: shortName, remote: { full: id, short: shortName, tip } })}
      />
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SectionLabel>{t("shell.sidebar.remotes")}</SectionLabel>
      {remotes.length === 0 ? (
        <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>{t("shell.remote.none")}</div>
      ) : visibleRemotes.length === 0 ? (
        <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>{t("shell.remote.noMatches")}</div>
      ) : (
        visibleRemotes.map((remote) => {
          const isOpen = remoteOpen(remote);
          return (
            <div key={remote} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {/* Real collapse toggle (Task 10) — remotes default closed
                    (openRemotes[remote] ?? false) since, unlike local
                    folders, there's no "holds the current branch" signal to
                    auto-open one. A separate control from the quick-menu
                    button below so both stay independently reachable. */}
                <button
                  type="button"
                  // No-op while filtering (same reasoning as the local
                  // folder toggle): remoteOpen force-returns true, so a
                  // click would write an explicit `false` that only
                  // surfaces once the query clears.
                  onClick={() => { if (filtering) return; setOpenRemotes((s) => ({ ...s, [remote]: !isOpen })); }}
                  onKeyDown={activateOnKeyDown}
                  className="gs-row"
                  title={t("shell.folder.toggleTitle", { action: isOpen ? t("shell.collapse") : t("shell.expand"), name: remote })}
                  aria-label={t("shell.folder.toggleTitle", { action: isOpen ? t("shell.collapse") : t("shell.expand"), name: remote })}
                  aria-expanded={isOpen}
                  style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0, minHeight: 32, padding: "6px 4px 6px 10px", borderRadius: 8, fontSize: 13, fontFamily: mono, color: "var(--text2)", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", boxSizing: "border-box" }}
                >
                  <span style={{ fontSize: 9, color: "var(--muted)", transform: `rotate(${isOpen ? 90 : 0}deg)`, transition: "transform 0.15s", display: "inline-block", width: 6, flexShrink: 0 }}>▶</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{remote}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    onRemoteMenuOpen(rect.left, rect.bottom, remote);
                  }}
                  onKeyDown={activateOnKeyDown}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onRemoteMenuOpen(e.clientX, e.clientY, remote);
                  }}
                  className="gs-row"
                  title={`${remote} · fetch/pull/push`}
                  aria-label={t("shell.remote.optionsAria", { remote })}
                  style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 12, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginRight: 2 }}
                >
                  ⋯
                </button>
              </div>
              {isOpen &&
                groupBranches(
                  visibleRemoteBranches
                    .filter((b) => b.name.startsWith(remote + "/"))
                    .map((b) => ({ ...b, name: b.name.slice(remote.length + 1) })),
                ).map((g) =>
                  g.kind === "branch" ? (
                    row(remote, g.branch.name, g.branch.name, 20, g.branch.tip)
                  ) : (
                    <div key={`pasta-${remote}:${g.name}`} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <button
                        type="button"
                        // No-op while filtering (see the local folder and
                        // remote toggles above): the forced-open override
                        // would otherwise be inverted into a stale `false`.
                        onClick={() => { if (filtering) return; setOpenFolders((s) => ({ ...s, [`${remote}:${g.name}`]: !(s[`${remote}:${g.name}`] ?? false) })); }}
                        onKeyDown={activateOnKeyDown}
                        className="gs-row"
                        title={t("shell.folder.toggleTitle", { action: filtering || (openFolders[`${remote}:${g.name}`] ?? false) ? t("shell.collapse") : t("shell.expand"), name: g.name })}
                        aria-expanded={filtering || (openFolders[`${remote}:${g.name}`] ?? false)}
                        style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 10px 5px 20px", borderRadius: 8, fontSize: 12.5, fontFamily: mono, color: "var(--muted)", cursor: "pointer", background: "transparent", border: "none", width: "100%", textAlign: "left" }}
                      >
                        <span style={{ fontSize: 8, transform: `rotate(${filtering || (openFolders[`${remote}:${g.name}`] ?? false) ? 90 : 0}deg)`, transition: "transform 0.15s", display: "inline-block", width: 5, flexShrink: 0 }}>▶</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                      </button>
                      {(filtering || (openFolders[`${remote}:${g.name}`] ?? false)) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, animation: "fadeIn 0.15s ease both" }}>
                          {g.members.map((m) => row(remote, m.name, m.name.slice(g.name.length + 1), 34, m.tip))}
                        </div>
                      )}
                    </div>
                  ),
                )}
            </div>
          );
        })
      )}
    </div>
  );
}
