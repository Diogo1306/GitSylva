import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useStageActions, useCommit, useDiff, useBlame } from "../../state/queries";
import { DiffView } from "../../components/DiffView";
import { BlameView } from "../../components/BlameView";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { statusStyle } from "../../lib/status";
import type { FileChange } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";

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
  onToggle,
  onSelect,
}: {
  file: FileChange;
  letter: string;
  checked: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const st = statusStyle(letter);
  const { name, dir } = splitPath(file.path);
  return (
    <div
      onClick={onSelect}
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
          onToggle();
        }}
        title={checked ? "Retirar da preparação" : "Preparar"}
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
  const commit = useCommit(repo.path);
  const [sel, setSel] = useState<Sel>(null);
  const [msg, setMsg] = useState("");
  const [amend, setAmend] = useState(false);
  const [commitErr, setCommitErr] = useState<string | null>(null);
  const [confirmDiscardAll, setConfirmDiscardAll] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [blameOn, setBlameOn] = useState(false);

  const diff = useDiff(repo.path, sel?.path ?? null, sel?.staged ?? false);
  const blameQ = useBlame(repo.path, sel?.path ?? null, blameOn);

  if (isLoading) return <div style={{ padding: 16, color: "var(--muted)" }}>A carregar alterações…</div>;
  if (error) return <div style={{ padding: 16, color: "var(--ddT)" }}>{String(error)}</div>;

  const files = data ?? [];
  const unstaged = files.filter((f) => f.worktree_status !== ".");
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?");
  const branch = repo.current_branch;

  function select(path: string, staged: boolean) {
    setSel({ path, staged });
  }

  function doCommit() {
    setCommitErr(null);
    commit.mutate(
      { message: msg, amend },
      {
        onSuccess: () => { setMsg(""); setAmend(false); },
        onError: (e: unknown) => setCommitErr((e as { message?: string })?.message ?? "não foi possível fazer commit"),
      },
    );
  }

  function discardAll() {
    for (const f of unstaged) {
      actions.discard.mutate({ file: f.path, untracked: f.worktree_status === "?" });
    }
    setConfirmDiscardAll(false);
  }

  const selStatus = sel
    ? sel.staged
      ? files.find((f) => f.path === sel.path)?.index_status ?? "M"
      : files.find((f) => f.path === sel.path)?.worktree_status ?? "M"
    : "";
  const selSt = statusStyle(selStatus);

  const commitReady = msg.trim() !== "" && (staged.length > 0 || amend);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: stacked ? "column" : "row", minWidth: 0, minHeight: 0, animation: "fadeIn 0.25s ease both" }}>
      {/* Files + commit */}
      <div
        style={{
          width: stacked ? "auto" : "42%",
          flexShrink: 0,
          borderRight: stacked ? "none" : "1px solid var(--border)",
          borderTop: stacked ? "1px solid var(--border)" : "none",
          order: stacked ? 2 : 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          boxSizing: "border-box",
        }}
      >
        <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center" }}>
          <SectionHead>NÃO PREPARADAS · {unstaged.length}</SectionHead>
          <div onClick={() => actions.stageAll.mutate()} className="gs-row" style={{ fontSize: 12, color: "var(--l0)", cursor: "pointer", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
            Preparar tudo
          </div>
          <div
            onClick={() => unstaged.length > 0 && setConfirmDiscardAll(true)}
            className="gs-row"
            style={{ fontSize: 12, color: "var(--ddT)", cursor: unstaged.length ? "pointer" : "default", opacity: unstaged.length ? 1 : 0.5, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}
          >
            Descartar
          </div>
        </div>
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 1 }}>
          {unstaged.map((f) => (
            <FileRow
              key={"u" + f.path}
              file={f}
              letter={f.worktree_status}
              checked={false}
              selected={sel?.path === f.path && !sel.staged}
              onToggle={() => actions.stage.mutate(f.path)}
              onSelect={() => select(f.path, false)}
            />
          ))}
        </div>

        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center" }}>
          <SectionHead>PREPARADAS · {staged.length}</SectionHead>
        </div>
        <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: 1, flex: 1, overflowY: "auto" }}>
          {staged.map((f) => (
            <FileRow
              key={"s" + f.path}
              file={f}
              letter={f.index_status}
              checked
              selected={sel?.path === f.path && sel.staged}
              onToggle={() => actions.unstage.mutate(f.path)}
              onSelect={() => select(f.path, true)}
            />
          ))}
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
          <div onClick={() => setAmend((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "var(--text2)" }}>
            <span style={{ width: 15, height: 15, borderRadius: 4, border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: amend ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 10, fontWeight: 800 }}>
              {amend ? "✓" : ""}
            </span>
            <span>Emendar último commit (amend)</span>
          </div>
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
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", order: stacked ? 1 : 2 }}>
        <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          {sel ? (
            <>
              <span style={{ width: 16, height: 16, borderRadius: 4, display: "grid", placeItems: "center", fontFamily: mono, fontSize: 10, fontWeight: 700, background: selSt.bg, color: selSt.color }}>
                {selStatus}
              </span>
              <span style={{ fontFamily: mono, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sel.path}</span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Selecione um ficheiro para ver o diff</span>
          )}
          <div style={{ flex: 1 }} />
          {sel && selStatus !== "?" && (
            <div onClick={() => setBlameOn((v) => !v)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 7, background: blameOn ? "var(--sel)" : "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap" }}>
              Blame
            </div>
          )}
          {!blameOn && <span style={{ fontSize: 12, color: "var(--muted)" }}>{sel?.staged ? "diff preparado" : "diff da cópia de trabalho"}</span>}
          {!blameOn && (
            <div onClick={() => setStacked((v) => !v)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 7, background: "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap" }}>
              {stacked ? "Lado a lado" : "Empilhado"}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "10px 0", background: "var(--panel2)" }}>
          {!sel ? null : blameOn ? (
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
            <DiffView patch={diff.data} fontSize={12.5} />
          ) : (
            <div style={{ padding: 20, color: "var(--muted)" }}>Sem alterações textuais.</div>
          )}
        </div>
      </div>

      {confirmDiscardAll && (
        <ConfirmDialog
          message={`Descartar ${unstaged.length} alteração(ões) não preparada(s)? Esta ação não pode ser desfeita.`}
          onCancel={() => setConfirmDiscardAll(false)}
          onConfirm={discardAll}
        />
      )}
    </div>
  );
}
