import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../state/appStore";
import { useStatus, queryKeys } from "../../state/queries";
import { discardAll } from "../../lib/api";
import { winMinimize, winToggleMaximize, winClose } from "../../lib/window";
import { toast } from "../../state/toastStore";
import { TreeLogo } from "../../components/TreeLogo";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const mono = "'JetBrains Mono', monospace";

function TrafficLights() {
  const light = (bg: string, glyph: string, onClick: () => void, title: string) => (
    <div
      className="gs-light"
      onClick={onClick}
      title={title}
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: bg,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <span>{glyph}</span>
    </div>
  );
  return (
    <div className="gs-lights" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      {light("#FF5F57", "✕", () => void winClose(), "Fechar")}
      {light("#FEBC2E", "–", () => void winMinimize(), "Minimizar")}
      {light("#28C840", "+", () => void winToggleMaximize(), "Maximizar")}
    </div>
  );
}

function Tool({
  onClick,
  title,
  stub,
  children,
}: {
  onClick?: () => void;
  title: string;
  stub?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={stub ? undefined : onClick}
      title={stub ? `${title} · em breve` : title}
      className={stub ? "gs-stub" : "gs-lift"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 11px",
        borderRadius: 8,
        background: "var(--btn)",
        border: "1px solid var(--btnB)",
        fontSize: 12.5,
        color: "var(--btnT)",
        cursor: stub ? "default" : "pointer",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

export function Titlebar() {
  const repo = useAppStore((s) => s.repo)!;
  const setView = useAppStore((s) => s.setView);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const qc = useQueryClient();
  const { data } = useStatus(repo.path);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const files = data ?? [];
  const unstaged = files.filter((f) => f.worktree_status !== ".").length;
  const repoName = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? repo.path;

  function refresh() {
    qc.invalidateQueries({ queryKey: queryKeys.status(repo.path) });
    qc.invalidateQueries({ queryKey: queryKeys.log(repo.path) });
  }

  function onDiscardClick() {
    if (unstaged === 0) {
      toast("Sem alterações para descartar");
      return;
    }
    setConfirmDiscard(true);
  }

  async function doDiscardAll() {
    setConfirmDiscard(false);
    try {
      await discardAll(repo.path);
      qc.invalidateQueries({ queryKey: queryKeys.status(repo.path) });
      toast("Alterações não preparadas descartadas");
    } catch (e: unknown) {
      toast((e as { message?: string })?.message ?? "não foi possível descartar");
    }
  }

  return (
    <div
      data-tauri-drag-region
      style={{
        height: 50,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
      }}
    >
      <TrafficLights />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          flexShrink: 0,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 17,
          letterSpacing: "0.3px",
        }}
      >
        <span>git</span>
        <span style={{ display: "inline-block", margin: "0 1px", transform: "translateY(2px)" }}>
          <TreeLogo size={14} crop xScale={1.22} />
        </span>
        <span>ylva</span>
      </div>

      {/* Repo tabs. Multi-repo tabs and groups arrive later; for now the open
          repo is the single active tab, with + to open another. */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 12px",
            borderRadius: 8,
            border: "1px solid var(--btnB)",
            background: "var(--sel)",
            minWidth: 0,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--l0)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {repoName}
          </span>
          <span style={{ fontFamily: mono, fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {repo.current_branch}
          </span>
        </div>
        <div
          onClick={() => setView("picker")}
          className="gs-lift"
          title="Abrir repositório"
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            color: "var(--muted)",
            fontSize: 15,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          +
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        <Tool onClick={refresh} title="Recarregar estado e histórico">
          <span style={{ fontSize: 14, lineHeight: 1 }}>⟳</span>Recarregar
        </Tool>
        <Tool onClick={onDiscardClick} title="Descartar alterações não preparadas">
          ↩ Descartar
          {unstaged > 0 && (
            <span
              style={{
                background: "var(--stMB)",
                color: "var(--stMT)",
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                padding: "1px 6px",
              }}
            >
              {unstaged}
            </span>
          )}
        </Tool>
        <div
          onClick={() => toast("Terminal integrado chega numa próxima fase")}
          className="gs-lift"
          title="Abrir terminal"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--btn)",
            border: "1px solid var(--btnB)",
            color: "var(--btnT)",
            fontFamily: mono,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          &gt;_
        </div>
        <div
          onClick={() => setPaletteOpen(true)}
          className="gs-lift"
          title="Pesquisar (⌘K)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 11px",
            borderRadius: 8,
            background: "var(--input)",
            border: "1px solid var(--btnB)",
            fontSize: 12.5,
            color: "var(--muted)",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          Pesquisar
          <span style={{ fontFamily: mono, fontSize: 10, border: "1px solid var(--btnB)", borderRadius: 5, padding: "1px 4px" }}>
            ⌘K
          </span>
        </div>
        <div
          onClick={() => setView("settings")}
          className="gs-lift"
          title="Definições"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--btn)",
            border: "1px solid var(--btnB)",
            color: "var(--btnT)",
            cursor: "pointer",
          }}
        >
          <span style={{ width: 11, height: 11, borderRadius: "50%", border: "2.5px dotted currentColor", boxSizing: "border-box" }} />
        </div>
      </div>

      {confirmDiscard && (
        <ConfirmDialog
          message={`Descartar ${unstaged} alteração(ões) não preparada(s)? Esta ação não pode ser desfeita.`}
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={doDiscardAll}
        />
      )}
    </div>
  );
}
