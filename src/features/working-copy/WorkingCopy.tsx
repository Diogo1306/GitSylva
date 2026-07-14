import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useStageActions, useCommit, useDiff, useBlame, useHunkActions, useSyncStatus } from "../../state/queries";
import { useThemeStore } from "../../state/themeStore";
import { DiffView } from "../../components/DiffView";
import { BlameView } from "../../components/BlameView";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth } from "../../lib/usePanelWidth";
import { statusStyle, isConflict } from "../../lib/status";
import { errMsg } from "../../lib/errors";
import { headMessage, openPath, revealPath } from "../../lib/api";
import { spawnLeaf } from "../../lib/leaf";
import { toast } from "../../state/toastStore";
import type { FileChange } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";

let ghostSeq = 0;

type Sel = { path: string; staged: boolean } | null;

function splitPath(p: string): { name: string; dir: string } {
  const parts = p.split("/");
  const name = parts.pop() ?? p;
  return { name, dir: parts.join("/") };
}

function FileRow({
  file,
  letter,
  checked,
  selected,
  conflicted,
  onToggle,
  onSelect,
  onContext,
}: {
  file: FileChange;
  letter: string;
  checked: boolean;
  selected: boolean;
  conflicted?: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onContext?: (x: number, y: number) => void;
}) {
  const st = statusStyle(letter);
  const { name, dir } = splitPath(file.path);
  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext?.(e.clientX, e.clientY);
      }}
      className="gs-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 8px",
        borderRadius: 8,
        cursor: "pointer",
        background: selected ? "var(--sel)" : "transparent",
        animation: "fileIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1) both",
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!conflicted) onToggle();
        }}
        title={conflicted ? "Em conflito — resolve-o primeiro (painel acima)" : checked ? "Retirar da preparação" : "Preparar"}
        style={
          checked
            ? { width: 17, height: 17, borderRadius: 5, background: "var(--accent)", flexShrink: 0, display: "grid", placeItems: "center", color: "var(--accentT)", fontSize: 11, fontWeight: 800, cursor: "pointer" }
            : { width: 17, height: 17, borderRadius: 5, border: "1.5px solid var(--btnB)", boxSizing: "border-box", flexShrink: 0, cursor: "pointer" }
        }
      >
        {checked ? "✓" : ""}
      </div>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          fontFamily: mono,
          fontSize: 10,
          fontWeight: 700,
          background: st.bg,
          color: st.color,
          flexShrink: 0,
        }}
      >
        {letter}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        {dir && (
          <span style={{ fontFamily: mono, fontSize: 10.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</span>
        )}
      </div>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>{children}</div>
  );
}

export function WorkingCopy() {
  const repo = useAppStore((s) => s.repo)!;
  const { data, isLoading, error } = useStatus(repo.path);
  const actions = useStageActions(repo.path);
  const hunk = useHunkActions(repo.path);
  const commit = useCommit(repo.path);
  const syncQ = useSyncStatus(repo.path);
  const [sel, setSel] = useState<Sel>(null);
  const [msg, setMsg] = useState("");
  const [amend, setAmend] = useState(false);
  const [commitErr, setCommitErr] = useState<string | null>(null);
  const [confirmDiscardAll, setConfirmDiscardAll] = useState(false);
  const [confirmDiscardFile, setConfirmDiscardFile] = useState<FileChange | null>(null);
  const [fileMenu, setFileMenu] = useState<{ x: number; y: number; file: FileChange } | null>(null);
  const [stacked, setStacked] = useState(false);
  const [blameOn, setBlameOn] = useState(false);
  // Below ~980px the working copy stacks automatically (handoff §8); the
  // manual toggle still works on wide windows.
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 980px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const isStacked = stacked || narrow;
  // Design: files panel resizable 320–540, persisted.
  const filesW = usePanelWidth("gitsylva-w-working", 400, 320, 540, "right");

  // Exit animation for rows leaving a list (R3 §9): AFTER the git operation
  // succeeds, the real row is hidden and a non-interactive ghost plays a short
  // fileOut at the same position, then both are dropped. Errors never hide
  // anything — the row simply stays.
  type Ghost = { id: number; file: FileChange; letter: string; list: "u" | "s"; idx: number };
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [hiddenPaths, setHiddenPaths] = useState<ReadonlySet<string>>(new Set());
  // One sweeper timer clears finished ghosts; the effect cleanup guarantees no
  // orphan timeout survives unmount.
  useEffect(() => {
    if (ghosts.length === 0) return;
    const t = window.setTimeout(() => {
      setGhosts([]);
      setHiddenPaths(new Set());
    }, 220);
    return () => window.clearTimeout(t);
  }, [ghosts]);
  function exitRow(f: FileChange, list: "u" | "s", letter: string, idx: number) {
    const id = ++ghostSeq;
    setGhosts((g) => [...g, { id, file: f, letter, list, idx }]);
    setHiddenPaths((s) => new Set(s).add(f.path));
  }

  // Honor a file chosen from the command palette: it stays "selected" (derived,
  // no effect/setState) until the user picks another file, which clears it.
  const paletteFile = useAppStore((s) => s.selectedFile);
  const paletteSel = useMemo<Sel>(() => {
    if (!paletteFile) return null;
    const f = (data ?? []).find((x) => x.path === paletteFile);
    return f ? { path: paletteFile, staged: f.index_status !== "." && f.index_status !== "?" } : null;
  }, [paletteFile, data]);
  const effSel = paletteSel ?? sel;

  // New files aren't in the index yet, so their preview is synthesized backend-side.
  const selUntracked =
    !!effSel && !effSel.staged && (data ?? []).find((f) => f.path === effSel.path)?.worktree_status === "?";
  const diff = useDiff(repo.path, effSel?.path ?? null, effSel?.staged ?? false, selUntracked);
  const blameQ = useBlame(repo.path, effSel?.path ?? null, blameOn);

  // Stable so DiffLines' memoized rows survive re-renders of this screen.
  const stagedSel = effSel?.staged ?? false;
  const onStageHunk = useCallback(
    (p: string) => hunk.mutate({ patch: p, cached: true, reverse: stagedSel }),
    [hunk, stagedSel],
  );

  // ⌘Enter (rebindable) fires this event from the global shortcut handler.
  // Rebinds every render on purpose: the closure must see fresh msg/amend/data.
  useEffect(() => {
    const onCommitShortcut = () => {
      const all = data ?? [];
      const stagedCount = all.filter((f) => f.index_status !== "." && f.index_status !== "?" && !isConflict(f.index_status, f.worktree_status)).length;
      if (commit.isPending || msg.trim() === "" || (stagedCount === 0 && !amend)) return;
      setCommitErr(null);
      commit.mutate(
        { message: msg, amend },
        {
          onSuccess: () => { spawnLeaf(); setMsg(""); setAmend(false); },
          onError: (e: unknown) => setCommitErr((e as { message?: string })?.message ?? "não foi possível fazer commit"),
        },
      );
    };
    window.addEventListener("gitsylva:commit", onCommitShortcut);
    return () => window.removeEventListener("gitsylva:commit", onCommitShortcut);
  });

  if (isLoading) return <div style={{ padding: 16, color: "var(--muted)" }}>A carregar alterações…</div>;
  if (error) return <div style={{ padding: 16, color: "var(--ddT)" }}>{errMsg(error, "não foi possível ler o estado do repositório")}</div>;

  const files = data ?? [];
  // Conflicted files show once (in the unstaged list, letter "U") — staging them
  // would silently mark the conflict as resolved.
  const unstaged = files.filter((f) => f.worktree_status !== "." || isConflict(f.index_status, f.worktree_status));
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?" && !isConflict(f.index_status, f.worktree_status));
  const branch = repo.current_branch;

  function select(path: string, staged: boolean) {
    setSel({ path, staged });
    if (useAppStore.getState().selectedFile) useAppStore.getState().setSelectedFile(null);
  }

  function doCommit() {
    setCommitErr(null);
    commit.mutate(
      { message: msg, amend },
      {
        onSuccess: () => { spawnLeaf(); setMsg(""); setAmend(false); },
        onError: (e: unknown) => setCommitErr((e as { message?: string })?.message ?? "não foi possível fazer commit"),
      },
    );
  }

  function discardAll() {
    actions.discardAll.mutate();
    setConfirmDiscardAll(false);
  }

  const selStatus = effSel
    ? effSel.staged
      ? files.find((f) => f.path === effSel.path)?.index_status ?? "M"
      : files.find((f) => f.path === effSel.path)?.worktree_status ?? "M"
    : "";
  const selSt = statusStyle(selStatus);

  const commitReady = msg.trim() !== "" && (staged.length > 0 || amend);
  const untrackedCount = unstaged.filter((f) => f.worktree_status === "?").length;
  // Amending a commit that's already on the upstream rewrites published history.
  const amendPushed = amend && !!syncQ.data?.upstream && (syncQ.data?.ahead ?? 0) === 0;

  function toggleAmend() {
    setAmend((v) => !v);
    // Prefill with HEAD's message so amending doesn't silently drop the body.
    if (!amend && !msg.trim()) {
      headMessage(repo.path)
        .then((m) => setMsg((cur) => (cur.trim() ? cur : m)))
        .catch(() => {});
    }
  }

  function fileMenuItems(f: FileChange): MenuItem[] {
    const untracked = f.worktree_status === "?";
    const items: MenuItem[] = [
      { label: "Abrir", onClick: () => void openPath(repo.path, f.path).catch((e: unknown) => toast(errMsg(e, "não foi possível abrir"), "error")) },
      { label: "Mostrar no explorador", onClick: () => void revealPath(repo.path, f.path).catch((e: unknown) => toast(errMsg(e, "não foi possível abrir o explorador"), "error")) },
      { label: "Copiar caminho", onClick: () => void navigator.clipboard?.writeText(f.path).then(() => toast("Caminho copiado")) },
    ];
    if (f.worktree_status !== "." && !isConflict(f.index_status, f.worktree_status)) {
      items.push({ label: "", onClick: () => {}, divider: true });
      items.push({
        label: untracked ? "Apagar do disco…" : "Descartar alterações…",
        danger: true,
        onClick: () => {
          if (useThemeStore.getState().confirmDiscard) setConfirmDiscardFile(f);
          else discardFileNow(f);
        },
      });
    }
    return items;
  }

  function discardFileNow(f: FileChange) {
    setConfirmDiscardFile(null);
    const idx = unstaged.indexOf(f);
    actions.discard.mutate(
      { file: f.path, untracked: f.worktree_status === "?" },
      {
        onSuccess: () => {
          exitRow(f, "u", f.worktree_status, Math.max(0, idx));
          toast(f.worktree_status === "?" ? `${f.path} apagado` : `Alterações de ${f.path} descartadas`);
        },
        onError: (e: unknown) => toast(errMsg(e, "não foi possível descartar"), "error"),
      },
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, animation: "fadeIn 0.25s ease both" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: isStacked ? "column" : "row", minWidth: 0, minHeight: 0 }}>
      {/* Files + commit */}
      <div
        style={{
          width: isStacked ? "auto" : filesW.width,
          flexShrink: 0,
          borderRight: isStacked ? "none" : "1px solid var(--border)",
          borderTop: isStacked ? "1px solid var(--border)" : "none",
          order: isStacked ? 2 : 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {!isStacked && <PanelHandle edge="right" handleProps={filesW.handleProps} />}
        <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center" }}>
          <SectionHead>NÃO PREPARADAS · {unstaged.length}</SectionHead>
          <div onClick={() => actions.stageAll.mutate()} className="gs-row" style={{ fontSize: 12, color: "var(--l0)", cursor: "pointer", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
            Preparar tudo
          </div>
          <div
            onClick={() => {
              if (unstaged.length === 0) return;
              if (useThemeStore.getState().confirmDiscard) setConfirmDiscardAll(true);
              else discardAll();
            }}
            className="gs-row"
            style={{ fontSize: 12, color: "var(--ddT)", cursor: unstaged.length ? "pointer" : "default", opacity: unstaged.length ? 1 : 0.5, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}
          >
            Descartar
          </div>
        </div>
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 1 }}>
          {(() => {
            const items = unstaged
              .filter((f) => !hiddenPaths.has(f.path))
              .map((f) => (
                <FileRow
                  key={"u" + f.path}
                  file={f}
                  letter={isConflict(f.index_status, f.worktree_status) ? "U" : f.worktree_status}
                  checked={false}
                  selected={effSel?.path === f.path && !effSel.staged}
                  conflicted={isConflict(f.index_status, f.worktree_status)}
                  onToggle={() => {
                    const idx = unstaged.indexOf(f);
                    actions.stage.mutate(f.path, { onSuccess: () => exitRow(f, "u", f.worktree_status, idx) });
                  }}
                  onSelect={() => select(f.path, false)}
                  onContext={(x, y) => setFileMenu({ x, y, file: f })}
                />
              ));
            for (const g of ghosts.filter((x) => x.list === "u")) {
              items.splice(
                Math.min(g.idx, items.length),
                0,
                <div key={`ghost${g.id}`} style={{ animation: "fileOut 200ms var(--ease-out) both", pointerEvents: "none" }}>
                  <FileRow file={g.file} letter={g.letter} checked={false} selected={false} onToggle={() => {}} onSelect={() => {}} />
                </div>,
              );
            }
            return items;
          })()}
        </div>

        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center" }}>
          <SectionHead>PREPARADAS · {staged.length}</SectionHead>
        </div>
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 1, flex: 1, overflowY: "auto" }}>
          {(() => {
            const items = staged
              .filter((f) => !hiddenPaths.has(f.path))
              .map((f) => (
                <FileRow
                  key={"s" + f.path}
                  file={f}
                  letter={f.index_status}
                  checked
                  selected={effSel?.path === f.path && effSel.staged}
                  onToggle={() => {
                    const idx = staged.indexOf(f);
                    actions.unstage.mutate(f.path, { onSuccess: () => exitRow(f, "s", f.index_status, idx) });
                  }}
                  onSelect={() => select(f.path, true)}
                  onContext={(x, y) => setFileMenu({ x, y, file: f })}
                />
              ));
            for (const g of ghosts.filter((x) => x.list === "s")) {
              items.splice(
                Math.min(g.idx, items.length),
                0,
                <div key={`ghost${g.id}`} style={{ animation: "fileOut 200ms var(--ease-out) both", pointerEvents: "none" }}>
                  <FileRow file={g.file} letter={g.letter} checked selected={false} onToggle={() => {}} onSelect={() => {}} />
                </div>,
              );
            }
            return items;
          })()}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, background: "var(--panel)" }}>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Mensagem do commit…"
            style={{
              height: 64,
              resize: "none",
              background: "var(--input)",
              border: "1px solid var(--btnB)",
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 13,
              color: "var(--text)",
              outline: "none",
              fontFamily: "var(--font)",
              boxSizing: "border-box",
            }}
          />
          {commitErr && <div style={{ color: "var(--ddT)", fontSize: 12.5 }}>{commitErr}</div>}
          <div onClick={toggleAmend} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "var(--text2)" }}>
            <span style={{ width: 15, height: 15, borderRadius: 4, border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: amend ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 10, fontWeight: 800 }}>
              {amend ? "✓" : ""}
            </span>
            <span>Emendar último commit (amend)</span>
          </div>
          {amendPushed && (
            <div style={{ fontSize: 11.5, color: "var(--stMT)", lineHeight: 1.4 }}>
              O último commit já está no remoto — emendá-lo reescreve história publicada e vai exigir force push.
            </div>
          )}
          <div
            onClick={() => commitReady && !commit.isPending && doCommit()}
            className="gs-press"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 10,
              borderRadius: 9,
              background: commitReady ? "var(--accent)" : "var(--btn)",
              color: commitReady ? "var(--accentT)" : "var(--muted)",
              border: commitReady ? "none" : "1px solid var(--btnB)",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: commitReady ? "pointer" : "default",
              opacity: commit.isPending ? 0.7 : 1,
            }}
          >
            {commit.isPending ? "A fazer commit…" : amend ? "Emendar commit" : `Commit em ${branch}`}
            <span style={{ fontFamily: mono, fontWeight: 500, opacity: 0.75 }}>· {staged.length} arq.</span>
          </div>
        </div>
      </div>

      {/* Diff */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", order: isStacked ? 1 : 2 }}>
        <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          {effSel ? (
            <>
              <span style={{ width: 16, height: 16, borderRadius: 4, display: "grid", placeItems: "center", fontFamily: mono, fontSize: 10, fontWeight: 700, background: selSt.bg, color: selSt.color }}>
                {selStatus}
              </span>
              <span style={{ fontFamily: mono, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{effSel.path}</span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Selecione um ficheiro para ver o diff</span>
          )}
          <div style={{ flex: 1 }} />
          {effSel && selStatus !== "?" && (
            <div onClick={() => setBlameOn((v) => !v)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 7, background: blameOn ? "var(--sel)" : "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap" }}>
              Blame
            </div>
          )}
          {!blameOn && <span style={{ fontSize: 12, color: "var(--muted)" }}>{effSel?.staged ? "diff preparado" : "diff da cópia de trabalho"}</span>}
          {!blameOn && (
            <div onClick={() => setStacked((v) => !v)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 7, background: "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap" }}>
              {isStacked ? "Lado a lado" : "Empilhado"}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "10px 0", background: "var(--panel2)" }}>
          {!effSel ? null : blameOn ? (
            blameQ.isLoading ? (
              <div style={{ padding: 20, color: "var(--muted)" }}>A carregar blame…</div>
            ) : blameQ.data && blameQ.data.length ? (
              <BlameView lines={blameQ.data} />
            ) : (
              <div style={{ padding: 20, color: "var(--muted)" }}>Sem blame (ficheiro novo?).</div>
            )
          ) : diff.isLoading ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>A carregar diff…</div>
          ) : diff.data && diff.data.trim() ? (
            <DiffView
              patch={diff.data}
              fontSize={12.5}
              stageLabel={effSel.staged ? "Retirar" : "Preparar"}
              onStageHunk={selStatus === "?" ? undefined : onStageHunk}
            />
          ) : (
            <div style={{ padding: 20, color: "var(--muted)" }}>Sem alterações textuais.</div>
          )}
        </div>
      </div>
      </div>

      {confirmDiscardAll && (
        <ConfirmDialog
          message={`Descartar ${unstaged.length} alteração(ões) não preparada(s)?${
            untrackedCount > 0 ? ` ${untrackedCount} ficheiro(s) não rastreado(s) serão apagados do disco.` : ""
          } As alterações preparadas mantêm-se. Esta ação não pode ser desfeita.`}
          onCancel={() => setConfirmDiscardAll(false)}
          onConfirm={discardAll}
        />
      )}

      {confirmDiscardFile && (
        <ConfirmDialog
          message={
            confirmDiscardFile.worktree_status === "?"
              ? `Apagar ${confirmDiscardFile.path} do disco? Não pode ser desfeito.`
              : `Descartar as alterações não preparadas de ${confirmDiscardFile.path}? As preparadas mantêm-se.`
          }
          onCancel={() => setConfirmDiscardFile(null)}
          onConfirm={() => discardFileNow(confirmDiscardFile)}
        />
      )}

      {fileMenu && (
        <ContextMenu x={fileMenu.x} y={fileMenu.y} items={fileMenuItems(fileMenu.file)} onClose={() => setFileMenu(null)} />
      )}
    </div>
  );
}
