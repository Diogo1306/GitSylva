import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";
import { pickFolder } from "../../lib/api";
import { toast } from "../../state/toastStore";
import { initials } from "../../lib/format";
import { useOpenRepo } from "./useOpenRepo";

const mono = "'JetBrains Mono', monospace";
type Tab = "local" | "remote" | "clone" | "add" | "create";

export function RepoPicker() {
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);
  const recents = useRecentsStore((s) => s.recents);
  const removeRecent = useRecentsStore((s) => s.remove);
  const { open, busy, error } = useOpenRepo();

  const [tab, setTab] = useState<Tab>("local");
  const [q, setQ] = useState("");
  const [addPath, setAddPath] = useState("");

  const close = () => setView(prevView === "picker" ? "history" : prevView);

  async function browseAndOpen() {
    const path = await pickFolder();
    if (!path) return;
    const ok = await open(path);
    if (ok) close();
  }

  async function browseInto(setter: (p: string) => void) {
    const path = await pickFolder();
    if (path) setter(path);
  }

  async function openPath(path: string) {
    const ok = await open(path);
    if (ok) close();
  }

  const filteredRecents = recents.filter((r) =>
    (r.name + " " + r.path).toLowerCase().includes(q.trim().toLowerCase()),
  );

  const tabs: [Tab, string][] = [
    ["local", "Local"],
    ["remote", "Remoto"],
    ["clone", "Clonar"],
    ["add", "Adicionar"],
    ["create", "Criar"],
  ];

  const bigTitle = { fontSize: 24, fontWeight: 700, letterSpacing: "-0.3px" } as const;
  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--btnB)",
    borderRadius: 9,
    padding: "10px 13px",
    fontSize: 13,
    color: "var(--text)",
    outline: "none",
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
  };

  return (
    <div data-screen-label="Adicionar repositório" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, animation: "fadeIn 0.25s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
        {tabs.map(([key, name]) => (
          <div
            key={key}
            onClick={() => setTab(key)}
            className="gs-row"
            style={{ padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: tab === key ? "var(--text)" : "var(--muted)", background: tab === key ? "var(--sel)" : "transparent", cursor: "pointer" }}
          >
            {name}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div onClick={close} className="gs-lift" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--btnB)", background: "var(--btn)", color: "var(--btnT)", fontSize: 12.5, cursor: "pointer" }}>
          ✕ Fechar
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "30px 28px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ color: "var(--ddT)", fontSize: 13 }}>{error}</div>}

          {tab === "local" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>Repositórios recentes</div>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar…" style={{ ...inputStyle, fontFamily: "var(--font)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {filteredRecents.map((r) => (
                  <div
                    key={r.path}
                    onClick={() => !busy && openPath(r.path)}
                    className="gs-lift"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--panel)", cursor: "pointer" }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--l0bg)", color: "var(--l0)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{initials(r.name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, minWidth: 0 }}>
                        <span style={{ fontFamily: mono, fontSize: 10.5, padding: "1px 7px", borderRadius: 999, background: "var(--l1bg)", color: "var(--l1)", border: "1px solid var(--l1bd)", whiteSpace: "nowrap" }}>{r.branch}</span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.path}</span>
                      </div>
                    </div>
                    <span
                      onClick={(e) => { e.stopPropagation(); removeRecent(r.path); }}
                      title="Remover dos recentes"
                      style={{ color: "var(--muted)", fontSize: 12, padding: 4, borderRadius: 6 }}
                    >
                      ✕
                    </span>
                  </div>
                ))}
                {filteredRecents.length === 0 && (
                  <div style={{ padding: 18, border: "1px dashed var(--btnB)", borderRadius: 11, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                    {recents.length === 0 ? "Ainda sem repositórios recentes." : "Nada encontrado para essa procura."}
                  </div>
                )}
              </div>
              <div onClick={() => !busy && browseAndOpen()} style={{ ...browseBtn, alignSelf: "flex-start" }} className="gs-lift">+ Procurar pasta…</div>
            </div>
          )}

          {tab === "add" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>Adicionar repositório existente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text2)" }}>Caminho da pasta (com .git)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={addPath} onChange={(e) => setAddPath(e.target.value)} placeholder="C:/projetos/o-meu-repo" style={{ ...inputStyle, flex: 1 }} />
                  <div onClick={() => browseInto(setAddPath)} style={browseBtn} className="gs-lift">Escolher…</div>
                </div>
              </div>
              <div onClick={() => addPath.trim() && !busy && openPath(addPath.trim())} style={{ ...primaryBtn, opacity: addPath.trim() ? 1 : 0.5 }} className="gs-press">
                {busy ? "A abrir…" : "Adicionar"}
              </div>
            </div>
          )}

          {(tab === "remote" || tab === "clone" || tab === "create") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={bigTitle}>
                  {tab === "remote" ? "Repositórios remotos" : tab === "clone" ? "Clonar repositório" : "Criar repositório novo"}
                </div>
                <span className="gs-soon">Em breve</span>
              </div>
              <div style={{ padding: 20, border: "1px dashed var(--btnB)", borderRadius: 12, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 }}>
                {tab === "remote" && "Listar e clonar repositórios da tua conta (GitHub/GitLab/Bitbucket) chega quando o backend suportar autenticação."}
                {tab === "clone" && "Clonar por URL (git clone) chega numa próxima fase, com o backend de rede."}
                {tab === "create" && "Criar um repositório novo (git init) chega numa próxima fase."}
              </div>
              <div onClick={() => toast("Esta opção chega numa próxima fase")} style={{ ...browseBtn, alignSelf: "flex-start" }} className="gs-lift">
                Entretanto, abrir uma pasta existente
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
