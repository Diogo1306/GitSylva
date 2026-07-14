import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../state/appStore";
import { useStatus, queryKeys, useSyncActions } from "../../state/queries";
import { useThemeStore } from "../../state/themeStore";
import { discardAll } from "../../lib/api";
import { winMinimizeAnimated, winToggleMaximize, winClose, winIsMaximized } from "../../lib/window";
import { spawnLeaf } from "../../lib/leaf";
import { toast } from "../../state/toastStore";
import { notify } from "../../state/notificationStore";
import { Wordmark } from "../../components/Wordmark";
import { ConfirmDialog } from "../../components/ConfirmDialog";

const mono = "'JetBrains Mono', monospace";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

// macOS: traffic lights on the left. The handoff's minimize animation plays
// before the real minimize.
function TrafficLights() {
  const anims = useThemeStore((s) => s.anims);
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
      {light("#FEBC2E", "–", () => void winMinimizeAnimated(anims), "Minimizar")}
      {light("#28C840", "+", () => void winToggleMaximize(), "Maximizar")}
    </div>
  );
}

// Windows: min / max-restore / close on the RIGHT; close hover turns red
// (#E81123) per the interaction spec.
function WinControls() {
  const anims = useThemeStore((s) => s.anims);
  const [maxed, setMaxed] = useState(false);
  useEffect(() => {
    void winIsMaximized().then(setMaxed);
  }, []);
  const btn = (glyph: React.ReactNode, onClick: () => void, title: string, close = false) => (
    <div
      onClick={onClick}
      title={title}
      className={close ? "gs-winclose" : "gs-winbtn"}
      style={{ width: 40, height: 30, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 11, color: "var(--text2)", borderRadius: 6 }}
    >
      {glyph}
    </div>
  );
  return (
    <div style={{ display: "flex", flexShrink: 0, marginLeft: 2 }}>
      {btn("—", () => void winMinimizeAnimated(anims), "Minimizar")}
      {btn(
        maxed ? "❐" : "▢",
        () => {
          void winToggleMaximize().then(() => winIsMaximized().then(setMaxed));
        },
        maxed ? "Restaurar" : "Maximizar",
      )}
      {btn("✕", () => void winClose(), "Fechar", true)}
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

export function Titlebar({ rail = false }: { rail?: boolean }) {
  const repo = useAppStore((s) => s.repo)!;
  const repos = useAppStore((s) => s.repos);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const closeRepo = useAppStore((s) => s.closeRepo);
  const setView = useAppStore((s) => s.setView);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const qc = useQueryClient();
  const { data } = useStatus(repo.path);
  const sync = useSyncActions(repo.path);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const files = data ?? [];
  const unstaged = files.filter((f) => f.worktree_status !== ".").length;

  function refresh() {
    // The ⟳ fetches origin; on failure (no remote/credentials) still reload local.
    const name = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? repo.path;
    sync.fetch.mutate(undefined, {
      onSuccess: () => {
        spawnLeaf();
        notify("Fetch concluído", `origin · ${name}`, "success", "fetch");
      },
      onError: (e: unknown) => {
        qc.invalidateQueries({ queryKey: queryKeys.status(repo.path) });
        qc.invalidateQueries({ queryKey: queryKeys.log(repo.path) });
        notify("Fetch falhou", (e as { message?: string })?.message ?? "não foi possível fazer fetch", "error", "fetch");
      },
    });
  }

  function onDiscardClick() {
    if (unstaged === 0) {
      toast("Sem alterações para descartar");
      return;
    }
    if (useThemeStore.getState().confirmDiscard) setConfirmDiscard(true);
    else void doDiscardAll();
  }

  async function doDiscardAll() {
    setConfirmDiscard(false);
    try {
      await discardAll(repo.path);
      qc.invalidateQueries({ queryKey: queryKeys.status(repo.path) });
      toast("Alterações não preparadas descartadas");
    } catch (e: unknown) {
      toast((e as { message?: string })?.message ?? "não foi possível descartar", "error");
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
      {isMac && <TrafficLights />}

      <div style={{ flexShrink: 0 }}>
        <Wordmark size={17} />
      </div>

      {/* Rail mode: the tabs live in the left rail, so show repo/branch inline. */}
      {rail ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, minWidth: 0, flex: 1 }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: "var(--text2)" }}>
            {repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop()}
          </span>
          <span style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)" }}>/</span>
          <span style={{ fontFamily: mono, fontSize: 12, color: "var(--l0)", fontWeight: 600 }}>{repo.current_branch}</span>
        </div>
      ) : (
      /* Repo tabs: one per open repository, switch on click, ✕ to close.
         Horizontal scroll keeps every tab reachable with many repos open. */
      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "thin" }}>
        {repos.map((r, i) => {
          const active = r.path === repo.path;
          const name = r.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? r.path;
          return (
            <div
              key={r.path}
              onClick={() => switchRepo(r.path)}
              className="gs-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 8px 5px 12px",
                borderRadius: 8,
                border: `1px solid ${active ? "var(--btnB)" : "transparent"}`,
                background: active ? "var(--sel)" : "transparent",
                minWidth: 0,
                cursor: "pointer",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--l${i % 3})`, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {name}
              </span>
              <span style={{ fontFamily: mono, fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {active ? repo.current_branch : r.current_branch}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeRepo(r.path);
                }}
                title="Fechar"
                className="gs-row"
                style={{ width: 16, height: 16, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 10, flexShrink: 0 }}
              >
                ✕
              </span>
            </div>
          );
        })}
        <div
          onClick={() => setView("picker")}
          className="gs-lift"
          title="Abrir repositório"
          style={{ width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 15, cursor: "pointer", flexShrink: 0 }}
        >
          +
        </div>
      </div>
      )}

      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        <Tool onClick={refresh} title="Fetch de origin">
          <span style={{ fontSize: 14, lineHeight: 1, display: "inline-block", animation: sync.fetch.isPending ? "spin 0.8s linear infinite" : "none" }}>⟳</span>
          {sync.fetch.isPending ? "A obter…" : "Fetch"}
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

      {!isMac && <WinControls />}

      {confirmDiscard && (
        <ConfirmDialog
          message={`Descartar ${unstaged} alteração(ões) não preparada(s)?${
            files.filter((f) => f.worktree_status === "?").length > 0
              ? ` ${files.filter((f) => f.worktree_status === "?").length} ficheiro(s) não rastreado(s) serão apagados do disco.`
              : ""
          } As alterações preparadas mantêm-se. Esta ação não pode ser desfeita.`}
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={doDiscardAll}
        />
      )}
    </div>
  );
}
