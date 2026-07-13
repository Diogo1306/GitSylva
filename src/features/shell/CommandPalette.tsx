import { useMemo, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useLog, useBranches, useBranchActions, useStatus } from "../../state/queries";
import { toast } from "../../state/toastStore";
import type { View } from "../../state/appStore";

const mono = "'JetBrains Mono', monospace";

type Item = { label: string; sub: string; dot: string; dotR: string; run: () => void };
type Group = { title: string; items: Item[] };

// Bold the matched portion of a result label.
function markMatch(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span style={{ color: "var(--accent)", fontWeight: 700 }}>{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const setView = useAppStore((s) => s.setView);
  const setFocusCommit = useAppStore((s) => s.setFocusCommit);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const repo = useAppStore((s) => s.repo);
  const repos = useAppStore((s) => s.repos);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const { data: commits } = useLog(repo?.path ?? "");
  const { data: branches } = useBranches(repo?.path ?? "");
  const { data: files } = useStatus(repo?.path ?? "");
  const { checkout } = useBranchActions(repo?.path ?? "");

  const groups = useMemo<Group[]>(() => {
    if (!open) return [];
    const query = q.trim().toLowerCase();
    const match = (s: string) => !query || s.toLowerCase().includes(query);

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

    const br: Item[] = (branches ?? [])
      .filter((b) => !b.is_remote && !b.is_current)
      .filter((b) => match(b.name))
      .slice(0, 6)
      .map((b) => ({
        label: b.name,
        sub: "checkout",
        dot: "var(--leaf)",
        dotR: "2px",
        run: () => {
          checkout.mutate(b.name, {
            onSuccess: () => toast(`Em ${b.name}`),
            onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível fazer checkout", "error"),
          });
          setOpen(false);
        },
      }));
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

    const gs: Group[] = [];
    if (rp.length) gs.push({ title: "REPOSITÓRIOS", items: rp });
    if (br.length) gs.push({ title: "BRANCHES", items: br });
    if (fl.length) gs.push({ title: "FICHEIROS", items: fl });
    if (cm.length) gs.push({ title: "COMMITS", items: cm });
    if (nav.length) gs.push({ title: "IR PARA", items: nav });
    return gs;
  }, [open, q, commits, branches, files, repos, repo, switchRepo, checkout, setView, setOpen, setFocusCommit, setSelectedFile]);

  if (!open) return null;

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
        animation: "fadeIn 0.15s ease both",
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
          animation: "popIn 0.2s cubic-bezier(0.2, 0.9, 0.3, 1) both",
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
                    <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{it.sub}</span>
                  </div>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Sem resultados para "{q}"</div>
          )}
        </div>
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 14, fontSize: 11, color: "var(--muted)" }}>
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>esc fechar</span>
          <span>⌘K / Ctrl+K em qualquer ecrã</span>
        </div>
      </div>
    </div>
  );
}
