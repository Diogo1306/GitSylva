import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useLog, useCommitDetail, useRewriteActions } from "../../state/queries";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth } from "../../lib/usePanelWidth";
import { toast } from "../../state/toastStore";
import { useThemeStore } from "../../state/themeStore";
import { graphRows } from "../../graph/layout";
import { CommitGraphSvg } from "../../components/CommitGraphSvg";
import { DiffView } from "../../components/DiffView";
import { statusStyle, statusTitle } from "../../lib/status";
import { FileIcon } from "../../components/FileIcon";
import { errMsg } from "../../lib/errors";
import {
  relativeTime,
  fullDate,
  initials,
  avatarColor,
  parseRefs,
  chipStyle,
} from "../../lib/format";
import type { Commit } from "../../lib/types";

const ROW_H = 52;
const mono = "'JetBrains Mono', monospace";

// Above this many rows the list renders in a window (uniform row height →
// simple math). Measured: 2000 commits fully rendered = 2000 divs + 11.6k SVG
// elements (~1.6MB of markup) living in one 104k-px-tall layer — scroll and
// selection paid for all of it. Below the threshold everything renders (and
// the entrance animation, capped at 120, still plays).
const VIRTUAL_MIN = 300;
const OVERSCAN = 10;

function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  const { bg, color } = avatarColor(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontSize: size < 26 ? 9.5 : 12,
        fontWeight: 700,
        background: bg,
        color,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

function Chips({ refs }: { refs: string }) {
  const chips = parseRefs(refs);
  if (chips.length === 0) return null;
  return (
    <>
      {chips.map((ch, i) => {
        const st = chipStyle(ch.kind);
        return (
          <span
            key={i}
            style={{
              fontFamily: mono,
              fontSize: 10.5,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              background: st.bg,
              color: st.color,
              border: `1px solid ${st.border}`,
            }}
          >
            {ch.label}
          </span>
        );
      })}
    </>
  );
}

function DetailPanel({ repoPath, commit }: { repoPath: string; commit: Commit }) {
  // "Carregar diff completo" opt-in, reset when another commit is selected.
  const [full, setFull] = useState(false);
  const [prevHash, setPrevHash] = useState(commit.hash);
  if (commit.hash !== prevHash) {
    setPrevHash(commit.hash);
    setFull(false);
  }
  const { data, isLoading, error: detailError } = useCommitDetail(repoPath, commit.hash, full);
  // %B = subject + blank line + body; everything after the first line is the body.
  const body = (data?.message ?? "").split("\n").slice(1).join("\n").trim();
  const diffRef = useRef<HTMLDivElement>(null);

  // Clicking a changed file focuses its section of the diff (spec §History).
  // Rows are ~20.1px (11.5px × 1.75 line-height); +34px for the view toggle.
  function scrollToFile(path: string) {
    const el = diffRef.current;
    const patch = data?.diff;
    if (!el || !patch) return;
    const lines = patch.replace(/\n$/, "").split("\n");
    const idx = lines.findIndex((l) => l.startsWith("diff --git ") && l.includes(` b/${path}`));
    if (idx < 0) return;
    el.scrollTo({ top: Math.max(0, idx * 20.1 + 34 - 6), behavior: "smooth" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={commit.author} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{commit.author}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fullDate(commit.date)}</div>
          </div>
          <div
            style={{
              fontFamily: mono,
              fontSize: 12,
              color: "var(--l0)",
              background: "var(--l0bg)",
              border: "1px solid var(--l0bd)",
              padding: "3px 9px",
              borderRadius: 7,
            }}
          >
            {commit.hash.slice(0, 7)}
          </div>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--text)" }}>{commit.subject}</div>
        {body && (
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--text2)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 110, overflowY: "auto" }}>
            {body}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, fontFamily: mono, fontSize: 12 }}>
          <span style={{ color: "var(--daT)" }}>+{data?.additions ?? 0}</span>
          <span style={{ color: "var(--ddT)" }}>−{data?.deletions ?? 0}</span>
          <span style={{ color: "var(--muted)" }}>{data?.files.length ?? 0} arquivos</span>
        </div>
      </div>

      <div style={{ padding: "12px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>
        ARQUIVOS ALTERADOS
      </div>
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 1, maxHeight: "28%", overflowY: "auto" }}>
        {(data?.files ?? []).map((f) => {
          const st = statusStyle(f.status);
          return (
            <div key={f.path} onClick={() => scrollToFile(f.path)} title="Ver o diff deste ficheiro" className="gs-row" style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 7, cursor: "pointer" }}>
              <FileIcon path={f.path} />
              <span
                style={{
                  flex: 1,
                  fontFamily: mono,
                  fontSize: 12,
                  color: "var(--text2)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  direction: "rtl",
                  textAlign: "left",
                }}
              >
                {f.path}
              </span>
              <span
                title={statusTitle(f.status)}
                style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: st.color, width: 12, textAlign: "center", flexShrink: 0 }}
              >
                {f.status}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "14px 20px 8px", fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)" }}>DIFF</div>
      <div ref={diffRef} style={{ flex: 1, overflow: "auto", margin: "0 12px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--panel2)", padding: "8px 0" }}>
        {isLoading ? (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>A carregar diff…</div>
        ) : detailError ? (
          <div style={{ padding: 12, color: "var(--ddT)", fontSize: 12 }}>{errMsg(detailError, "não foi possível ler o commit")}</div>
        ) : data && data.diff.trim() ? (
          <DiffView patch={data.diff} onLoadFull={() => setFull(true)} />
        ) : (
          <div style={{ padding: 12, color: "var(--muted)", fontSize: 12 }}>Sem alterações textuais.</div>
        )}
      </div>
    </div>
  );
}

// Memoized so selecting a commit only re-renders the two affected rows, not the
// whole (potentially hundreds long) list.
const CommitRow = memo(function CommitRow({
  commit,
  selected,
  filtering,
  rowH,
  onSelect,
  onContext,
}: {
  commit: Commit;
  selected: boolean;
  filtering: boolean;
  rowH: number;
  onSelect: (hash: string) => void;
  onContext: (hash: string, x: number, y: number) => void;
}) {
  return (
    <div
      onClick={() => onSelect(commit.hash)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext(commit.hash, e.clientX, e.clientY);
      }}
      className="gs-row"
      style={{
        height: rowH,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: filtering ? "0 16px" : "0 16px 0 96px",
        cursor: "pointer",
        boxSizing: "border-box",
        // undefined (not "transparent") so .gs-row:hover still paints.
        background: selected ? "var(--sel)" : undefined,
        borderBottom: "1px solid var(--bsoft)",
        // Skip painting rows scrolled out of view; the box keeps its height so
        // the graph overlay stays aligned.
        contentVisibility: "auto",
        containIntrinsicSize: `${rowH}px`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13.5, color: "var(--text)", fontWeight: selected ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {commit.subject}
        </span>
        <Chips refs={commit.refs} />
      </div>
      <Avatar name={commit.author} />
      <div style={{ width: 66, fontFamily: mono, fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>{commit.hash.slice(0, 7)}</div>
      <div className="gs-resp-time" style={{ width: 96, fontSize: 12, color: "var(--muted)", textAlign: "right", flexShrink: 0 }}>{relativeTime(commit.date)}</div>
    </div>
  );
});

export function History() {
  const repo = useAppStore((s) => s.repo)!;
  const focusCommit = useAppStore((s) => s.focusCommit);
  const [limit, setLimit] = useState(200);
  const { data, isLoading, error, isFetching } = useLog(repo.path, limit);
  const rewrite = useRewriteActions(repo.path);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number; hash: string } | null>(null);
  const [confirmHardReset, setConfirmHardReset] = useState<string | null>(null);
  const [confirmRebase, setConfirmRebase] = useState<string | null>(null);
  // Settings → Aparência → Densidade (handoff: conforto 52 / compacta 40).
  const density = useThemeStore((s) => s.density);
  const rowH = density === "compacta" ? 40 : ROW_H;
  // Design: detail panel resizable 300–560, persisted.
  const detailW = usePanelWidth("gitsylva-w-detail", 372, 300, 560, "left");

  // Selecting a commit locally also clears any pending palette focus request.
  const selectHash = useCallback((hash: string) => {
    setSelectedHash(hash);
    const st = useAppStore.getState();
    if (st.focusCommit) st.setFocusCommit(null);
  }, []);

  // Stable handler so the memo() around CommitRow actually holds: without it,
  // selecting a commit re-rendered every row in the list.
  const onContext = useCallback((hash: string, x: number, y: number) => setMenu({ hash, x, y }), []);

  // Arrow-key navigation between commits (kept in a ref so the listener binds once).
  const navRef = useRef<{ hashes: string[]; selected: string | null }>({ hashes: [], selected: null });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const st = useAppStore.getState();
      if (st.paletteOpen || st.modal) return;
      const { hashes, selected } = navRef.current;
      if (!hashes.length) return;
      const idx = Math.max(0, hashes.indexOf(selected ?? hashes[0]));
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectHash(hashes[Math.min(hashes.length - 1, idx + 1)]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectHash(hashes[Math.max(0, idx - 1)]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectHash]);

  const commits = useMemo(() => data ?? [], [data]);
  const rows = useMemo(() => graphRows(commits), [commits]);

  const q = query.trim().toLowerCase();
  const filtering = q.length > 0;
  const filtered = filtering
    ? commits.filter((c) => (c.subject + " " + c.hash + " " + c.author).toLowerCase().includes(q))
    : commits;

  // A palette pick (focusCommit) wins until the user selects something else.
  const selected = commits.find((c) => c.hash === (focusCommit ?? selectedHash)) ?? commits[0];

  // Refs must not be written during render; sync the key-nav snapshot after it.
  useEffect(() => {
    navRef.current = { hashes: filtered.map((c) => c.hash), selected: selected?.hash ?? null };
  });

  // ── List windowing ────────────────────────────────────────────────────────
  // Callback-ref state: the scroll container appears only after loading, so a
  // plain useRef + [] effect would observe nothing.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [viewH, setViewH] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => {
    if (!scrollEl) return;
    // ResizeObserver fires once on observe — no synchronous measure needed.
    const ro = new ResizeObserver(() => setViewH(scrollEl.clientHeight));
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [scrollEl]);

  const virtual = filtered.length > VIRTUAL_MIN;
  const startIdx = virtual ? Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN) : 0;
  const endIdx = virtual ? Math.min(filtered.length - 1, Math.ceil((scrollTop + viewH) / rowH) + OVERSCAN) : filtered.length - 1;
  const visibleCommits = virtual ? filtered.slice(startIdx, endIdx + 1) : filtered;

  // Keep the selected row visible when the SELECTION changes (keyboard nav,
  // palette jump). An element-level scrollIntoView ref would re-fire on every
  // remount in windowed mode and hijack the user's scroll.
  const lastScrolledTo = useRef<string | null>(null);
  useEffect(() => {
    if (!scrollEl || !selected) return;
    if (lastScrolledTo.current === selected.hash) return;
    const first = lastScrolledTo.current === null;
    lastScrolledTo.current = selected.hash;
    if (first) return; // initial selection: don't move a freshly opened list
    const idx = filtered.findIndex((c) => c.hash === selected.hash);
    if (idx < 0) return;
    const top = idx * rowH;
    if (top < scrollEl.scrollTop) scrollEl.scrollTo({ top });
    else if (top + rowH > scrollEl.scrollTop + scrollEl.clientHeight)
      scrollEl.scrollTo({ top: top + rowH - scrollEl.clientHeight });
  });

  if (isLoading) return <div style={{ padding: 16, color: "var(--muted)" }}>A carregar histórico…</div>;
  if (error) return <div style={{ padding: 16, color: "var(--ddT)" }}>{errMsg(error, "não foi possível ler o histórico")}</div>;
  if (commits.length === 0) return <div style={{ padding: 16, color: "var(--muted)" }}>Sem commits ainda.</div>;

  return (
    <div style={{ flex: 1, display: "flex", minWidth: 0, animation: "fadeUp 0.25s ease both" }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar histórico…"
            style={{
              flex: 1,
              background: "var(--input)",
              border: "1px solid var(--btnB)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--text)",
              outline: "none",
              fontFamily: "var(--font)",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: mono, whiteSpace: "nowrap" }}>
            {filtered.length} commits
          </div>
        </div>

        <div
          ref={setScrollEl}
          onScroll={virtual ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
          style={{ flex: 1, overflowY: "auto" }}
        >
          {/* In windowed mode the spacer keeps the real scroll height and the
              rows are absolutely positioned inside it; the graph overlay is
              full-height either way, emitting only the visible range. */}
          <div style={{ position: "relative", height: virtual ? filtered.length * rowH : undefined }}>
            {!filtering && (
              <div style={{ position: "absolute", left: 14, top: 0, pointerEvents: "none" }}>
                <CommitGraphSvg rows={rows} rowH={rowH} visibleRange={virtual ? { start: startIdx, end: endIdx } : undefined} />
              </div>
            )}
            <div style={virtual ? { position: "absolute", top: startIdx * rowH, left: 0, right: 0 } : undefined}>
              {visibleCommits.map((c) => (
                <CommitRow
                  key={c.hash}
                  commit={c}
                  selected={selected.hash === c.hash}
                  filtering={filtering}
                  rowH={rowH}
                  onSelect={selectHash}
                  onContext={onContext}
                />
              ))}
            </div>
          </div>
          {/* When the log filled the window, there are probably older commits. */}
          {!filtering && commits.length >= limit && (
            <div
              onClick={() => !isFetching && setLimit((l) => l + 200)}
              className="gs-row"
              style={{ padding: "12px 16px", textAlign: "center", fontSize: 12.5, color: "var(--l0)", cursor: "pointer", fontWeight: 600 }}
            >
              {isFetching ? "A carregar…" : "Carregar mais commits"}
            </div>
          )}
        </div>
      </div>

      <div style={{ width: detailW.width, flexShrink: 0, background: "var(--panel)", minHeight: 0, position: "relative" }}>
        <PanelHandle edge="left" handleProps={detailW.handleProps} />
        <DetailPanel repoPath={repo.path} commit={selected} />
      </div>

      {menu &&
        (() => {
          const h = menu.hash;
          const short = h.slice(0, 7);
          const reset = (mode: "soft" | "mixed" | "hard") => () =>
            rewrite.reset.mutate({ target: h, mode }, { onSuccess: () => toast(`Reset ${mode} para ${short}`), onError: (e: unknown) => toast((e as { message?: string })?.message ?? "erro no reset", "error") });
          const items: MenuItem[] = [
            { label: `Reset suave para ${short}`, onClick: reset("soft") },
            { label: `Reset misto para ${short}`, onClick: reset("mixed") },
            { label: `Reset forçado (hard) para ${short}…`, onClick: () => setConfirmHardReset(h), danger: true },
            { label: "", onClick: () => {}, divider: true },
            { label: "Cherry-pick para a branch atual", onClick: () => rewrite.cherryPick.mutate(h, { onSuccess: () => toast("Cherry-pick aplicado"), onError: (e: unknown) => toast((e as { message?: string })?.message ?? "conflito no cherry-pick", "error") }) },
            { label: "Rebase da atual sobre este commit…", onClick: () => setConfirmRebase(h) },
            { label: "Copiar hash", onClick: () => navigator.clipboard?.writeText(h).then(() => toast("Hash copiado")) },
          ];
          return <ContextMenu x={menu.x} y={menu.y} items={items} onClose={() => setMenu(null)} />;
        })()}

      {confirmRebase && (
        <ConfirmDialog
          message={`Rebase de ${repo.current_branch} sobre ${confirmRebase.slice(0, 7)}? Os commits locais da branch atual são reescritos.`}
          confirmLabel="Rebase"
          onCancel={() => setConfirmRebase(null)}
          onConfirm={() => {
            const onto = confirmRebase;
            setConfirmRebase(null);
            rewrite.rebase.mutate(onto, {
              onSuccess: () => toast("Rebase concluído"),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? "conflito no rebase — vê a Cópia de trabalho", "error"),
            });
          }}
        />
      )}

      {confirmHardReset && (
        <ConfirmDialog
          message={`Reset forçado (hard) para ${confirmHardReset.slice(0, 7)}? Descarta TODAS as alterações locais (preparadas e não preparadas) e os commits à frente deste. Esta ação não pode ser desfeita.`}
          confirmLabel="Reset forçado"
          onCancel={() => setConfirmHardReset(null)}
          onConfirm={() => {
            const target = confirmHardReset;
            setConfirmHardReset(null);
            rewrite.reset.mutate(
              { target, mode: "hard" },
              { onSuccess: () => toast(`Reset hard para ${target.slice(0, 7)}`), onError: (e: unknown) => toast((e as { message?: string })?.message ?? "erro no reset", "error") },
            );
          }}
        />
      )}
    </div>
  );
}
