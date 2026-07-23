import { useEffect, useId, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";
import { pickFolder, initRepo, cloneRepo, scanLocalRepos } from "../../lib/api";
import { notify } from "../../state/notificationStore";
import { initials } from "../../lib/format";
import { fold } from "../../lib/fold";
import { useOpenRepo } from "./useOpenRepo";
import { FormField } from "../../components/ui/FormField";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { activateOnKeyDown } from "../../components/ui/keys";
import { useT } from "../../i18n";
import type { LocalRepoEntry } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";
// Illustrative clone URL shown as the input placeholder. A neutral example
// (host + user/repo), intentionally the same in every language.
const CLONE_URL_EXAMPLE = "https://github.com/user/repo.git";
type Tab = "local" | "clone" | "create";

// One tile in the Local grid: a recent (has a branch, can be removed) and/or a
// folder found by scanLocalRepos() under ~/dev (may not be a repo yet).
type GridEntry = { path: string; name: string; branch?: string; isRepo: boolean; isRecent: boolean };
type GridState = "open" | "abrir" | "init";

export function RepoPicker() {
  const t = useT();
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);
  // Standalone at startup (no repo open yet): there is nothing to close into.
  const hasRepo = useAppStore((s) => !!s.repo);
  const openRepos = useAppStore((s) => s.repos);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const recents = useRecentsStore((s) => s.recents);
  const removeRecent = useRecentsStore((s) => s.remove);
  const { open, run, busy, error } = useOpenRepo();

  const [tab, setTab] = useState<Tab>("local");
  const [q, setQ] = useState("");
  const [scanned, setScanned] = useState<LocalRepoEntry[]>([]);
  const [createParent, setCreateParent] = useState("");
  const [createName, setCreateName] = useState("");
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneParent, setCloneParent] = useState("");

  // Composite fields (text input + adjacent "Escolher…" button) can't go
  // through FormField's single-child cloneElement, so they get an explicit
  // id and a real <label htmlFor> instead.
  const createParentId = useId();
  const cloneParentId = useId();

  // One-level-deep scan of ~/dev for the Local grid (checklist §8). Best
  // effort: a missing/unreadable base folder must not block the picker, so a
  // failed scan just leaves the grid at "recents only".
  useEffect(() => {
    let cancelled = false;
    scanLocalRepos()
      .then((entries) => {
        if (!cancelled) setScanned(entries);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => setView(prevView === "picker" ? "history" : prevView);
  // Entering a repo via the picker (open/switch/init/clone/create) always lands
  // in its History (checklist §8), regardless of which view the picker was
  // opened from.
  const enterRepo = () => setView("history");
  // Default the clone folder name from the URL (…/name.git -> name).
  const cloneName = (cloneUrl.trim().split("/").pop() ?? "").replace(/\.git$/, "");

  async function browseAndOpen() {
    const path = await pickFolder();
    if (!path) return;
    if (await open(path)) enterRepo();
  }

  async function browseInto(setter: (p: string) => void) {
    const path = await pickFolder();
    if (path) setter(path);
  }

  async function openPath(path: string) {
    if (await open(path)) enterRepo();
  }

  // Recents ∪ scanned folders, de-duplicated by path (a recent inside ~/dev
  // wins: it carries the branch the scan doesn't bother reading).
  const recentPaths = new Set(recents.map((r) => r.path));
  const combined: GridEntry[] = [
    ...recents.map((r) => ({ path: r.path, name: r.name, branch: r.branch, isRepo: true, isRecent: true })),
    ...scanned.filter((e) => !recentPaths.has(e.path)).map((e) => ({ path: e.path, name: e.name, isRepo: e.is_repo, isRecent: false })),
  ];
  const filtered = combined.filter((e) => fold(e.name + " " + e.path).includes(fold(q.trim())));

  const openPaths = new Set(openRepos.map((r) => r.path));
  function stateOf(e: GridEntry): GridState {
    if (openPaths.has(e.path)) return "open";
    return e.isRepo ? "abrir" : "init";
  }

  async function activate(e: GridEntry) {
    const state = stateOf(e);
    if (state === "open") {
      switchRepo(e.path);
      enterRepo();
    } else if (state === "abrir") {
      await openPath(e.path);
    } else {
      // One-level-deep scan: the parent is `path` minus the trailing "/name".
      const parent = e.path.slice(0, e.path.length - e.name.length - 1);
      if (await run(() => initRepo(parent, e.name))) enterRepo();
    }
  }

  const tabs: [Tab, string][] = [
    ["local", t("repo.tab.local")],
    ["clone", t("repo.tab.clone")],
    ["create", t("common.create")],
  ];

  const bigTitle = { fontSize: 24, fontWeight: 700, letterSpacing: "-0.3px" } as const;
  const fieldLabelStyle = { fontSize: 12.5, fontWeight: 600, color: "var(--text2)" } as const;
  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--btnB)",
    borderRadius: 9,
    padding: "10px 13px",
    fontSize: 13,
    color: "var(--text)",
    fontFamily: mono,
    boxSizing: "border-box" as const,
    minWidth: 0,
  };
  const browseBtn = {
    padding: "10px 15px",
    borderRadius: 9,
    background: "var(--btn)",
    border: "1px solid var(--btnB)",
    color: "var(--btnT)",
    fontSize: 12.5,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
  };
  const primaryBtn = {
    alignSelf: "flex-start" as const,
    padding: "11px 20px",
    borderRadius: 10,
    background: "var(--accent)",
    color: "var(--accentT)",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    fontFamily: "inherit",
  };
  const badgeBase = { fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" as const, flexShrink: 0 };
  const badgeStyle: Record<GridState, React.CSSProperties> = {
    open: { ...badgeBase, background: "var(--l0bg)", color: "var(--l0)", border: "1px solid var(--l0bd)" },
    abrir: { ...badgeBase, background: "var(--btn)", color: "var(--btnT)", border: "1px solid var(--btnB)" },
    init: { ...badgeBase, background: "var(--stMB)", color: "var(--stMT)" },
  };
  const badgeLabel: Record<GridState, string> = {
    open: t("repo.local.badgeOpen"),
    abrir: t("common.open"),
    init: t("repo.local.badgeInit"),
  };

  return (
    <div data-screen-label={t("repo.screenLabel")} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, animation: "fadeUp 0.25s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
        {tabs.map(([key, name]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            onKeyDown={activateOnKeyDown}
            className="gs-row"
            style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: tab === key ? "var(--text)" : "var(--muted)", background: tab === key ? "var(--sel)" : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {name}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {hasRepo && (
          <button
            type="button"
            onClick={close}
            onKeyDown={activateOnKeyDown}
            className="gs-lift"
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--btnB)", background: "var(--btn)", color: "var(--btnT)", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            ✕ {t("common.close")}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "30px 28px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ color: "var(--ddT)", fontSize: 13 }}>{error}</div>}

          {tab === "local" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>{t("repo.local.title")}</div>
              <FormField label={t("repo.local.searchLabel")} hideLabel>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.searchEllipsis")} style={{ ...inputStyle, fontFamily: "var(--font)" }} />
              </FormField>

              {filtered.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                  {filtered.map((e) => {
                    const state = stateOf(e);
                    return (
                      <SelectableRow
                        key={e.path}
                        onSelect={() => activate(e)}
                        disabled={busy}
                        style={{ gap: 12, padding: "11px 14px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--panel)" }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--l0bg)", color: "var(--l0)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{initials(e.name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
                            <span style={badgeStyle[state]}>{badgeLabel[state]}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, minWidth: 0 }}>
                            {e.branch && (
                              <span style={{ fontFamily: mono, fontSize: 10.5, padding: "1px 7px", borderRadius: 999, background: "var(--l1bg)", color: "var(--l1)", border: "1px solid var(--l1bd)", whiteSpace: "nowrap" }}>{e.branch}</span>
                            )}
                            <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.path}</span>
                          </div>
                        </div>
                        {e.isRecent && (
                          <button
                            type="button"
                            onClick={(ev) => { ev.stopPropagation(); removeRecent(e.path); }}
                            onKeyDown={(ev) => {
                              // Stop the row's own Enter/Space activation (SelectableRow's
                              // onKeyDown) from also firing via bubbling.
                              ev.stopPropagation();
                              activateOnKeyDown(ev);
                            }}
                            title={t("repo.local.removeTitle")}
                            aria-label={t("repo.local.removeAria", { name: e.name })}
                            style={{ color: "var(--muted)", fontSize: 12, padding: 4, borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                          >
                            ✕
                          </button>
                        )}
                      </SelectableRow>
                    );
                  })}
                </div>
              )}

              {filtered.length === 0 && (
                <div style={{ padding: 18, border: "1px dashed var(--btnB)", borderRadius: 11, textAlign: "center", color: "var(--muted)", fontSize: 13, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  {combined.length === 0 ? (
                    t("repo.local.empty")
                  ) : (
                    <>
                      <div>{t("repo.local.noMatch")}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {q.trim() && (
                          <button type="button" onClick={() => openPath(q.trim())} onKeyDown={activateOnKeyDown} disabled={busy} style={browseBtn} className="gs-lift">
                            {t("repo.local.openPath", { path: q.trim() })}
                          </button>
                        )}
                        <button type="button" onClick={() => setTab("clone")} onKeyDown={activateOnKeyDown} style={browseBtn} className="gs-lift">
                          {t("repo.local.cloneEllipsis")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={browseAndOpen}
                onKeyDown={activateOnKeyDown}
                disabled={busy}
                style={{ ...browseBtn, alignSelf: "flex-start" }}
                className="gs-lift"
              >
                + {t("repo.local.browseFolder")}
              </button>
            </div>
          )}

          {tab === "create" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>{t("repo.create.title")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 8 }}>
                <FormField label={<span style={fieldLabelStyle}>{t("repo.create.nameLabel")}</span>}>
                  <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder={t("repo.create.namePlaceholder")} style={inputStyle} />
                </FormField>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor={createParentId} style={fieldLabelStyle}>{t("repo.create.parentLabel")}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input id={createParentId} value={createParent} onChange={(e) => setCreateParent(e.target.value)} placeholder="C:/dev" style={{ ...inputStyle, flex: 1 }} />
                    <button type="button" onClick={() => browseInto(setCreateParent)} onKeyDown={activateOnKeyDown} style={browseBtn} className="gs-lift">{t("repo.choose")}</button>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {t("repo.create.runs")} <span style={{ fontFamily: mono }}>git init</span> {t("repo.create.runsIn", { path: `${createParent || "…"}/${createName || t("repo.create.defaultName")}` })}
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (await run(() => initRepo(createParent.trim(), createName.trim()))) enterRepo();
                }}
                onKeyDown={activateOnKeyDown}
                disabled={!createName.trim() || !createParent.trim() || busy}
                style={{ ...primaryBtn, opacity: createName.trim() && createParent.trim() ? 1 : 0.5 }}
                className="gs-press"
              >
                {busy ? t("repo.create.creating") : t("repo.create.submit")}
              </button>
            </div>
          )}

          {tab === "clone" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>{t("repo.clone.title")}</div>
              <FormField label={<span style={fieldLabelStyle}>{t("repo.clone.urlLabel")}</span>}>
                <input value={cloneUrl} onChange={(e) => setCloneUrl(e.target.value)} placeholder={CLONE_URL_EXAMPLE} style={inputStyle} />
              </FormField>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor={cloneParentId} style={fieldLabelStyle}>{t("repo.clone.destLabel")}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id={cloneParentId} value={cloneParent} onChange={(e) => setCloneParent(e.target.value)} placeholder="C:/dev" style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={() => browseInto(setCloneParent)} onKeyDown={activateOnKeyDown} style={browseBtn} className="gs-lift">{t("repo.choose")}</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("repo.clone.into", { path: `${cloneParent || "…"}/${cloneName || "repo"}` })}</div>
              <button
                type="button"
                onClick={async () => {
                  if (await run(() => cloneRepo(cloneParent.trim(), cloneUrl.trim(), cloneName))) {
                    notify(t("repo.clone.doneTitle"), `${cloneName} → ${cloneParent.trim()}/${cloneName}`);
                    enterRepo();
                  }
                }}
                onKeyDown={activateOnKeyDown}
                disabled={!cloneUrl.trim() || !cloneParent.trim() || !cloneName || busy}
                style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 8, opacity: cloneUrl.trim() && cloneParent.trim() && cloneName ? 1 : 0.5 }}
                className="gs-press"
              >
                {busy && <span style={{ animation: "spin 0.8s linear infinite" }}>⟳</span>}
                {busy ? t("repo.clone.cloning") : t("repo.tab.clone")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
