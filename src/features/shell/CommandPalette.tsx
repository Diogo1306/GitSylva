import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useLog, useBranches, useBranchActions, useStatus, useSyncActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { notify } from "../../state/notificationStore";
import { fetchFailureNotice } from "../../lib/errors";
import { useRecentBranchesStore } from "../../state/recentBranchesStore";
import { spawnLeaf } from "../../lib/leaf";
import { fold, foldChars } from "../../lib/fold";
import { comboHint } from "../../lib/platform";
import { useShortcutsStore } from "../../state/shortcutsStore";
import type { View } from "../../state/appStore";

const mono = "'JetBrains Mono', monospace";

type Item = { label: string; sub: string; badge?: string; dot: string; dotR: string; run: () => void };
type Group = { title: string; items: Item[] };

// Bold the matched portion of a result label.
function markMatch(text: string, q: string) {
  if (!q) return text;
  const chars = Array.from(text);
  const i = foldChars(text).indexOf(fold(q));
  if (i < 0) return text;
  const end = i + Array.from(q).length;
  return (
    <>
      {chars.slice(0, i).join("")}
      <span style={{ color: "var(--accent)", fontWeight: 700 }}>{chars.slice(i, end).join("")}</span>
      {chars.slice(end).join("")}
    </>
  );
}

export function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  // Lingering render: when the store closes the palette, keep it mounted for
  // 150ms to play the exit fade (spec: palette exit = fade). The lingering
  // flag flips during render (sanctioned adjust-state-on-prop-change pattern);
  // the timeout that ends it lives in an effect.
  const [prevOpen, setPrevOpen] = useState(open);
  const [lingering, setLingering] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setLingering(true);
  }
  useEffect(() => {
    if (!lingering || open) return;
    const t = window.setTimeout(() => setLingering(false), 150);
    return () => window.clearTimeout(t);
  }, [lingering, open]);
  const render = open || lingering;
  const closing = lingering && !open;
  const setView = useAppStore((s) => s.setView);
  const setFocusCommit = useAppStore((s) => s.setFocusCommit);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const repo = useAppStore((s) => s.repo);
  const repos = useAppStore((s) => s.repos);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const setModal = useAppStore((s) => s.setModal);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const { data: commits } = useLog(repo?.path ?? "");
  const { data: branches } = useBranches(repo?.path ?? "");
  const { data: files } = useStatus(repo?.path ?? "");
  const { checkout } = useBranchActions(repo?.path ?? "");
  const sync = useSyncActions(repo?.path ?? "");

  const groups = useMemo<Group[]>(() => {
    if (!render) return [];
    const query = fold(q.trim());
    const match = (s: string) => !query || fold(s).includes(query);

    const go = (view: View) => () => {
      setView(view);
      setOpen(false);
    };

    const rp: Item[] = repos
      .filter((r) => r.path !== repo?.path)
      .filter((r) => match(r.path))
      .map((r, i) => ({
        label: r.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? r.path,
        sub: r.current_branch,
        dot: `var(--l${i % 3})`,
        dotR: "50%",
        run: () => { switchRepo(r.path); setOpen(false); },
      }));

    // Task 12: remote branches used to be excluded outright. They now show up
    // too, labelled "remota" — but a remote whose short name already has a
    // local branch is skipped (the local row already reaches the same
    // branch, so listing both would just be a distinct-looking duplicate).
    const localNames = new Set((branches ?? []).filter((b) => !b.is_remote).map((b) => b.name));
    const remoteShortName = (name: string) => {
      const slash = name.indexOf("/");
      return slash >= 0 ? name.slice(slash + 1) : name;
    };

    const runCheckout = (checkoutName: string) => () => {
      checkout.mutate(checkoutName, {
        onSuccess: () => {
          // Task 10: track the checkout so it surfaces under "Recentes"
          // in the sidebar, same as a checkout triggered from there.
          if (repo) useRecentBranchesStore.getState().record(repo.path, checkoutName);
          toast(`Em ${checkoutName}`);
        },
        onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível fazer checkout", "error"),
      });
      setOpen(false);
    };

    const br: Item[] = (branches ?? [])
      .filter((b) => !b.is_current)
      .filter((b) => !b.is_remote || !localNames.has(remoteShortName(b.name)))
      .filter((b) => match(b.name))
      .slice(0, 6)
      .map((b) =>
        b.is_remote
          ? {
              label: b.name,
              sub: "criar branch local",
              badge: "remota",
              dot: "var(--muted)",
              dotR: "2px",
              // Remote rows check out the short name — same DWIM `git
              // checkout <name>` the Sidebar's remote rows use, which git
              // resolves into a new local branch tracking the remote one.
              run: runCheckout(remoteShortName(b.name)),
            }
          : {
              label: b.name,
              sub: "checkout",
              dot: "var(--leaf)",
              dotR: "2px",
              run: runCheckout(b.name),
            },
      );
    const navItems: [string, View][] = [
      ["Histórico", "history"],
      ["Cópia de trabalho", "working"],
      ["Stashes", "stashes"],
      ["Definições", "settings"],
    ];
    const nav: Item[] = navItems
      .filter(([n]) => match(n))
      .map(([n, v]) => ({ label: n, sub: "ir para", dot: "var(--muted)", dotR: "50%", run: go(v) }));

    const fl: Item[] = (files ?? [])
      .filter((f) => match(f.path))
      .slice(0, 6)
      .map((f) => ({
        label: f.path.split("/").pop() ?? f.path,
        sub: f.path,
        dot: "var(--l2)",
        dotR: "2px",
        run: () => {
          setSelectedFile(f.path);
          setView("working");
          setOpen(false);
        },
      }));

    const cm: Item[] = (commits ?? [])
      .filter((c) => match(c.subject + " " + c.hash + " " + c.author))
      .slice(0, 6)
      .map((c) => ({
        label: c.subject,
        sub: `${c.hash.slice(0, 7)} · ${c.author}`,
        dot: "var(--l0)",
        dotR: "50%",
        run: () => {
          setFocusCommit(c.hash);
          setView("history");
          setOpen(false);
        },
      }));

    // Git actions: each opens the same modal/flow as the toolbar buttons.
    const actionDefs: [string, string, () => void][] = [
      ["Fazer commit…", "cópia de trabalho", go("working")],
      ["Pull…", "integrar do remoto", () => { setModal("pull"); setOpen(false); }],
      ["Push…", "enviar para o remoto", () => { setModal("push"); setOpen(false); }],
      ["Fetch", "atualizar do remoto", () => {
        if (sync.fetch.isPending) { setOpen(false); return; }
        sync.fetch.mutate(undefined, {
          onSuccess: () => {
            spawnLeaf();
            notify("Fetch concluído", "origin", "success", "fetch");
          },
          onError: (e: unknown) => {
            const n = fetchFailureNotice(e);
            notify(n.title, n.sub, "error", "fetch");
          },
        });
        setOpen(false);
      }],
      ["Nova branch…", "criar branch", () => { setModal("branch"); setOpen(false); }],
      ["Merge…", "integrar branch", () => { setModal("merge"); setOpen(false); }],
      ["Guardar stash…", "guardar alterações", () => { setModal("stash"); setOpen(false); }],
      ["Nova tag…", "criar tag", () => { setModal("tag"); setOpen(false); }],
    ];
    const ac: Item[] = repo
      ? actionDefs
          .filter(([n]) => match(n))
          .map(([label, sub, run]) => ({ label, sub, dot: "var(--accent)", dotR: "50%", run }))
      : [];

    const gs: Group[] = [];
    if (rp.length) gs.push({ title: "REPOSITÓRIOS", items: rp });
    if (br.length) gs.push({ title: "BRANCHES", items: br });
    if (fl.length) gs.push({ title: "FICHEIROS", items: fl });
    if (cm.length) gs.push({ title: "COMMITS", items: cm });
    if (ac.length) gs.push({ title: "AÇÕES", items: ac });
    if (nav.length) gs.push({ title: "IR PARA", items: nav });
    return gs;
  }, [render, q, commits, branches, files, repos, repo, switchRepo, checkout, sync, setView, setOpen, setFocusCommit, setSelectedFile, setModal]);

  if (!render) return null;

  const flat = groups.flatMap((g) => g.items);
  const activeIdx = Math.min(active, Math.max(0, flat.length - 1));
  let flatIdx = -1;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 65,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 110,
        animation: closing ? "fadeOut 150ms var(--ease-standard) both" : "fadeIn 0.15s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 580,
          background: "var(--win)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          overflow: "hidden",
          animation: closing ? "fadeOut 150ms var(--ease-standard) both" : "popIn 0.2s var(--ease-pop) both",
          color: "var(--text)",
        }}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(flat.length - 1, a + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            else if (e.key === "Enter") flat[activeIdx]?.run();
          }}
          placeholder="Pesquisar commits, ficheiros, branches…"
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid var(--border)",
            padding: "15px 18px",
            fontSize: 15,
            color: "var(--text)",
            outline: "none",
            fontFamily: "var(--font)",
          }}
        />
        <div style={{ maxHeight: 380, overflowY: "auto", padding: 8 }}>
          {groups.map((g) => (
            <div key={g.title}>
              <div style={{ padding: "8px 10px 4px", fontSize: 10.5, fontWeight: 700, letterSpacing: "1.3px", color: "var(--muted)" }}>{g.title}</div>
              {g.items.map((it, i) => {
                flatIdx += 1;
                const isActive = flatIdx === activeIdx;
                return (
                  <div
                    key={i}
                    onClick={it.run}
                    onMouseEnter={() => setActive(flat.indexOf(it))}
                    className="gs-row"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: isActive ? "var(--sel)" : undefined }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: it.dotR, background: it.dot, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{markMatch(it.label, q.trim())}</span>
                    {it.badge && (
                      <span style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999, background: "var(--l1bg)", color: "var(--l1)", border: "1px solid var(--l1bd)", flexShrink: 0 }}>
                        {it.badge}
                      </span>
                    )}
                    <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{it.sub}</span>
                  </div>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
              {q.trim() ? (
                <>
                  <div>Sem resultados para "{q}"</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>Tenta outro termo ou verifica a ortografia.</div>
                  <button
                    type="button"
                    onClick={() => { setQ(""); setActive(0); }}
                    className="gs-lift"
                    style={{ marginTop: 10, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--btnB)", background: "var(--btn)", color: "var(--btnT)", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Limpar pesquisa
                  </button>
                </>
              ) : (
                "Escreve para pesquisar…"
              )}
            </div>
          )}
        </div>
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 14, fontSize: 11, color: "var(--muted)" }}>
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>esc fechar</span>
          <span>{comboHint(useShortcutsStore.getState().bindings.palette)} em qualquer ecrã</span>
        </div>
      </div>
    </div>
  );
}
