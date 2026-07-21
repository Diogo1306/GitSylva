import { useId, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";
import { pickFolder, initRepo, cloneRepo } from "../../lib/api";
import { notify } from "../../state/notificationStore";
import { initials } from "../../lib/format";
import { fold } from "../../lib/fold";
import { useOpenRepo } from "./useOpenRepo";
import { FormField } from "../../components/ui/FormField";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { activateOnKeyDown } from "../../components/ui/keys";

const mono = "'JetBrains Mono', monospace";
type Tab = "local" | "remote" | "clone" | "add" | "create";

export function RepoPicker() {
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);
  // Standalone at startup (no repo open yet): there is nothing to close into.
  const hasRepo = useAppStore((s) => !!s.repo);
  const recents = useRecentsStore((s) => s.recents);
  const removeRecent = useRecentsStore((s) => s.remove);
  const { open, run, busy, error } = useOpenRepo();

  const [tab, setTab] = useState<Tab>("local");
  const [q, setQ] = useState("");
  const [addPath, setAddPath] = useState("");
  const [createParent, setCreateParent] = useState("");
  const [createName, setCreateName] = useState("");
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloneParent, setCloneParent] = useState("");

  // Composite fields (text input + adjacent "Escolher…" button) can't go
  // through FormField's single-child cloneElement, so they get an explicit
  // id and a real <label htmlFor> instead.
  const addPathId = useId();
  const createParentId = useId();
  const cloneParentId = useId();

  const close = () => setView(prevView === "picker" ? "history" : prevView);
  // Default the clone folder name from the URL (…/name.git -> name).
  const cloneName = (cloneUrl.trim().split("/").pop() ?? "").replace(/\.git$/, "");

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
    fold(r.name + " " + r.path).includes(fold(q.trim())),
  );

  const tabs: [Tab, string][] = [
    ["local", "Local"],
    ["remote", "Remoto"],
    ["clone", "Clonar"],
    ["add", "Adicionar"],
    ["create", "Criar"],
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

  return (
    <div data-screen-label="Adicionar repositório" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, animation: "fadeUp 0.25s ease both" }}>
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
            ✕ Fechar
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "30px 28px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ color: "var(--ddT)", fontSize: 13 }}>{error}</div>}

          {tab === "local" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>Repositórios recentes</div>
              <FormField label="Procurar repositórios recentes" hideLabel>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar…" style={{ ...inputStyle, fontFamily: "var(--font)" }} />
              </FormField>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {filteredRecents.map((r) => (
                  <SelectableRow
                    key={r.path}
                    onSelect={() => openPath(r.path)}
                    disabled={busy}
                    style={{ gap: 12, padding: "11px 14px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--panel)" }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--l0bg)", color: "var(--l0)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>{initials(r.name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3, minWidth: 0 }}>
                        <span style={{ fontFamily: mono, fontSize: 10.5, padding: "1px 7px", borderRadius: 999, background: "var(--l1bg)", color: "var(--l1)", border: "1px solid var(--l1bd)", whiteSpace: "nowrap" }}>{r.branch}</span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.path}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeRecent(r.path); }}
                      onKeyDown={(e) => {
                        // Stop the row's own Enter/Space activation (SelectableRow's
                        // onKeyDown) from also firing via bubbling.
                        e.stopPropagation();
                        activateOnKeyDown(e);
                      }}
                      title="Remover dos recentes"
                      aria-label={`Remover ${r.name} dos recentes`}
                      style={{ color: "var(--muted)", fontSize: 12, padding: 4, borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      ✕
                    </button>
                  </SelectableRow>
                ))}
                {filteredRecents.length === 0 && (
                  <div style={{ padding: 18, border: "1px dashed var(--btnB)", borderRadius: 11, textAlign: "center", color: "var(--muted)", fontSize: 13, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                    {recents.length === 0 ? (
                      "Ainda sem repositórios recentes."
                    ) : (
                      <>
                        <div>Nenhum recente corresponde. Abrir ou clonar um repositório?</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" onClick={browseAndOpen} onKeyDown={activateOnKeyDown} disabled={busy} style={browseBtn} className="gs-lift">
                            Abrir pasta…
                          </button>
                          <button type="button" onClick={() => setTab("clone")} onKeyDown={activateOnKeyDown} style={browseBtn} className="gs-lift">
                            Clonar…
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={browseAndOpen}
                onKeyDown={activateOnKeyDown}
                disabled={busy}
                style={{ ...browseBtn, alignSelf: "flex-start" }}
                className="gs-lift"
              >
                + Procurar pasta…
              </button>
            </div>
          )}

          {tab === "add" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>Adicionar repositório existente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor={addPathId} style={fieldLabelStyle}>Caminho da pasta (com .git)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id={addPathId} value={addPath} onChange={(e) => setAddPath(e.target.value)} placeholder="C:/projetos/o-meu-repo" style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={() => browseInto(setAddPath)} onKeyDown={activateOnKeyDown} style={browseBtn} className="gs-lift">Escolher…</button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openPath(addPath.trim())}
                onKeyDown={activateOnKeyDown}
                disabled={!addPath.trim() || busy}
                style={{ ...primaryBtn, opacity: addPath.trim() ? 1 : 0.5 }}
                className="gs-press"
              >
                {busy ? "A abrir…" : "Adicionar"}
              </button>
            </div>
          )}

          {tab === "create" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>Criar repositório novo</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 8 }}>
                <FormField label={<span style={fieldLabelStyle}>Nome</span>}>
                  <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="o-meu-projeto" style={inputStyle} />
                </FormField>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor={createParentId} style={fieldLabelStyle}>Pasta raiz</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input id={createParentId} value={createParent} onChange={(e) => setCreateParent(e.target.value)} placeholder="C:/dev" style={{ ...inputStyle, flex: 1 }} />
                    <button type="button" onClick={() => browseInto(setCreateParent)} onKeyDown={activateOnKeyDown} style={browseBtn} className="gs-lift">Escolher…</button>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Corre <span style={{ fontFamily: mono }}>git init</span> em {createParent || "…"}/{createName || "nome"} com branch main.
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (await run(() => initRepo(createParent.trim(), createName.trim()))) close();
                }}
                onKeyDown={activateOnKeyDown}
                disabled={!createName.trim() || !createParent.trim() || busy}
                style={{ ...primaryBtn, opacity: createName.trim() && createParent.trim() ? 1 : 0.5 }}
                className="gs-press"
              >
                {busy ? "A criar…" : "Criar repositório"}
              </button>
            </div>
          )}

          {tab === "clone" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={bigTitle}>Clonar repositório</div>
              <FormField label={<span style={fieldLabelStyle}>URL de origem</span>}>
                <input value={cloneUrl} onChange={(e) => setCloneUrl(e.target.value)} placeholder="https://github.com/user/repo.git" style={inputStyle} />
              </FormField>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor={cloneParentId} style={fieldLabelStyle}>Pasta de destino</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id={cloneParentId} value={cloneParent} onChange={(e) => setCloneParent(e.target.value)} placeholder="C:/dev" style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={() => browseInto(setCloneParent)} onKeyDown={activateOnKeyDown} style={browseBtn} className="gs-lift">Escolher…</button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Clona para {cloneParent || "…"}/{cloneName || "repo"}.</div>
              <button
                type="button"
                onClick={async () => {
                  if (await run(() => cloneRepo(cloneParent.trim(), cloneUrl.trim(), cloneName))) {
                    notify("Clone concluído", `${cloneName} → ${cloneParent.trim()}/${cloneName}`);
                    close();
                  }
                }}
                onKeyDown={activateOnKeyDown}
                disabled={!cloneUrl.trim() || !cloneParent.trim() || !cloneName || busy}
                style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 8, opacity: cloneUrl.trim() && cloneParent.trim() && cloneName ? 1 : 0.5 }}
                className="gs-press"
              >
                {busy && <span style={{ animation: "spin 0.8s linear infinite" }}>⟳</span>}
                {busy ? "A clonar…" : "Clonar"}
              </button>
            </div>
          )}

          {tab === "remote" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={bigTitle}>Repositórios remotos</div>
                <span className="gs-soon">Em breve</span>
              </div>
              <div style={{ padding: 20, border: "1px dashed var(--btnB)", borderRadius: 12, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6 }}>
                Listar repositórios da tua conta (GitHub/GitLab/Bitbucket) chega quando o backend suportar autenticação. Entretanto, usa a aba Clonar com o URL.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
