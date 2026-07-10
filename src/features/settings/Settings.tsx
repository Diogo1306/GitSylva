import { useAppStore } from "../../state/appStore";
import { useThemeStore } from "../../state/themeStore";
import { useOnboardStore } from "../../state/onboardStore";
import {
  PALETTES,
  FONTS,
  TREE_META,
  BRANCH_COLOR_META,
  type ThemeKey,
  type TreeStyleKey,
  type FontKey,
} from "../../theme/themes";

const THEME_ORDER: ThemeKey[] = ["escuro", "claro", "nipon", "gitclassic"];
const TREE_ORDER: TreeStyleKey[] = ["normal", "sakura", "tropical", "grafo"];
const FONT_ORDER: FontKey[] = ["inter", "sistema", "atkinson"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13.5, fontWeight: 600 }}>{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--muted)" }}>{children}</div>;
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div style={{ width: 38, height: 22, borderRadius: 999, background: on ? "var(--accent)" : "var(--btnB)", position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
      <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.15s" }} />
    </div>
  );
}

function ThemeCard({ themeKey, active, onPick }: { themeKey: ThemeKey; active: boolean; onPick: () => void }) {
  const p = PALETTES[themeKey];
  const v = p.vars;
  const accent = p.accents[0][1];
  return (
    <div
      onClick={onPick}
      style={{
        flex: 1,
        border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`,
        borderRadius: 12,
        padding: 10,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        background: "var(--panel)",
      }}
    >
      <div style={{ height: 88, borderRadius: 8, background: v["--win"], border: `1px solid ${v["--border"]}`, overflow: "hidden", display: "flex" }}>
        <div style={{ width: "34%", background: v["--panel"], borderRight: `1px solid ${v["--border"]}` }} />
        <div style={{ flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ height: 7, width: "72%", borderRadius: 4, background: v["--text"] }} />
          <div style={{ height: 7, width: "52%", borderRadius: 4, background: v["--muted"] }} />
          <div style={{ height: 7, width: "62%", borderRadius: 4, background: v["--muted"] }} />
          <div style={{ height: 7, width: "34%", borderRadius: 4, background: v["--l0"] }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${v["--l0"]}`, background: accent, boxSizing: "border-box" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{p.hint}</span>
      </div>
    </div>
  );
}

function TreeIcon({ kind }: { kind: TreeStyleKey }) {
  const c = "var(--l0)";
  if (kind === "sakura")
    return (
      <svg width={20} height={20} viewBox="0 0 16 16">
        {[0, 1, 2, 3, 4].map((a) => {
          const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
          return <circle key={a} cx={8 + Math.cos(ang) * 3.2} cy={8 + Math.sin(ang) * 3.2} r={2.1} fill="var(--leaf)" />;
        })}
        <circle cx={8} cy={8} r={1.3} fill="var(--win)" />
      </svg>
    );
  if (kind === "tropical")
    return (
      <svg width={22} height={16} viewBox="0 0 18 13">
        <path d="M9,11 Q10,4 17,2 Q11,8 9,11 Z" fill="var(--leaf)" />
        <path d="M9,11 Q8,4 1,2 Q7,8 9,11 Z" fill="var(--leaf)" opacity={0.8} />
      </svg>
    );
  if (kind === "grafo")
    return (
      <svg width={22} height={16} viewBox="0 0 18 13">
        <path d="M3,10 C7,9 11,5 15,3.5" stroke="var(--muted)" strokeWidth={1.6} fill="none" />
        <circle cx={3.5} cy={9.5} r={2.4} fill="var(--win)" stroke="var(--muted)" strokeWidth={1.6} />
        <circle cx={15} cy={3.5} r={2} fill="var(--muted)" />
      </svg>
    );
  return (
    <svg width={20} height={16} viewBox="0 0 16 12">
      <path d="M1,10 Q6,2 15,4 Q7,9 1,10 Z" fill={c} />
    </svg>
  );
}

function StubSection({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) {
  return (
    <div id={id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SectionTitle>{title}</SectionTitle>
        <span className="gs-soon">Em breve</span>
      </div>
      <div style={{ padding: 16, border: "1px dashed var(--btnB)", borderRadius: 12, color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

export function Settings() {
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);
  const replayOnboard = useOnboardStore((s) => s.replay);
  const t = useThemeStore();

  const accents = PALETTES[t.theme].accents;

  const chip = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 999,
    border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`,
    cursor: "pointer",
    background: "var(--panel)",
    fontSize: 13,
  });

  const nav = [
    ["Aparência", "set-aparencia"],
    ["Contas", "set-contas"],
    ["Git", "set-git"],
    ["Atalhos", "set-atalhos"],
    ["SSH", "set-ssh"],
    ["Avançado", "set-avancado"],
  ];

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, background: "var(--win)", animation: "fadeIn 0.25s ease both" }}>
      <div style={{ width: 192, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--panel)", padding: "16px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", boxSizing: "border-box" }}>
        <div
          onClick={() => setView(prevView)}
          className="gs-lift"
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", marginBottom: 12, borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          ← Voltar
        </div>
        {nav.map(([name, id]) => (
          <a
            key={id}
            href={`#${id}`}
            className="gs-row"
            style={{ padding: "7px 11px", borderRadius: 8, fontSize: 13, color: "var(--text2)", textDecoration: "none" }}
          >
            {name}
          </a>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 32, animation: "fadeUp 0.3s ease both" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.2px" }}>Definições</div>
              <div style={{ fontSize: 13.5, color: "var(--text2)", marginTop: 4 }}>Preferências guardadas automaticamente neste dispositivo.</div>
            </div>
            <div
              onClick={replayOnboard}
              className="gs-lift"
              style={{ fontSize: 12, color: "var(--text2)", border: "1px solid var(--btnB)", padding: "6px 12px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Rever ecrã de boas-vindas
            </div>
          </div>

          {/* APARÊNCIA — fully wired */}
          <div id="set-aparencia" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SectionTitle>APARÊNCIA</SectionTitle>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Tema</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {THEME_ORDER.map((k) => (
                  <ThemeCard key={k} themeKey={k} active={t.theme === k} onPick={() => t.savePrefs({ theme: k })} />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Estilo da árvore</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {TREE_ORDER.map((k) => {
                  const active = t.treeStyle === k;
                  return (
                    <div
                      key={k}
                      onClick={() => t.savePrefs({ treeStyle: k })}
                      className="gs-lift"
                      style={{ border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: "var(--panel)" }}
                    >
                      <TreeIcon kind={k} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{TREE_META[k].name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{TREE_META[k].desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Hint>Muda as folhas da árvore de commits · combina com qualquer tema.</Hint>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Cor das branches</FieldLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {BRANCH_COLOR_META.map((lc) => (
                  <div key={lc.key} onClick={() => t.savePrefs({ branchColor: lc.key })} style={chip(t.branchColor === lc.key)}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: lc.swatch }} />
                    <span>{lc.name}</span>
                  </div>
                ))}
              </div>
              <Hint>Recolore as linhas que partem da main · Auto usa o par vivo do tema.</Hint>
            </div>

            <div onClick={() => t.savePrefs({ anims: !t.anims })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", cursor: "pointer", borderBottom: "1px solid var(--bsoft)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Animações decorativas</div>
                <Hint>Folhas a cair, floresta a balançar e flash na troca de tema</Hint>
              </div>
              <Toggle on={t.anims} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Cor de destaque</FieldLabel>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {accents.map((a, i) => (
                  <div key={a[0]} onClick={() => t.savePrefs({ accentIdx: i })} style={chip(t.accentIdx === i)}>
                    <span style={{ width: 16, height: 16, borderRadius: "50%", background: a[1] }} />
                    <span>{a[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Repositórios abertos</FieldLabel>
              <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
                {(["tabs", "rail"] as const).map((k) => (
                  <div
                    key={k}
                    onClick={() => t.savePrefs({ repoLayout: k })}
                    style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: t.repoLayout === k ? "var(--win)" : "transparent", color: t.repoLayout === k ? "var(--text)" : "var(--muted)" }}
                  >
                    {k === "tabs" ? "Abas em cima" : "Barra lateral"}
                  </div>
                ))}
              </div>
              <Hint>Barra lateral: estilo VS Code · escala melhor com muitos repositórios.</Hint>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Fonte da interface</FieldLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FONT_ORDER.map((k) => {
                  const active = t.fontKey === k;
                  return (
                    <div
                      key={k}
                      onClick={() => t.savePrefs({ fontKey: k })}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, cursor: "pointer", background: "var(--panel)" }}
                    >
                      <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, background: active ? "var(--accent)" : "transparent", boxSizing: "border-box", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{FONTS[k].name}</div>
                        <Hint>{FONTS[k].desc}</Hint>
                      </div>
                      <div style={{ fontSize: 16, color: "var(--text2)", fontFamily: FONTS[k].stack }}>AaBbCc 0123</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <StubSection id="set-contas" title="CONTAS &amp; ACESSO">
            Ligar GitHub / GitLab / Bitbucket (OAuth) e gerir contas locais chega quando o backend suportar autenticação.
          </StubSection>
          <StubSection id="set-git" title="GIT">
            Identidade (nome/email), editor externo e opções de git por repositório chegam numa próxima fase.
          </StubSection>
          <StubSection id="set-atalhos" title="ATALHOS DE TECLADO">
            Atalhos regraváveis (clicar numa linha para gravar) chegam com o sistema de comandos.
          </StubSection>
          <StubSection id="set-ssh" title="CHAVES SSH">
            Gerar chaves, testar ligação e assinar commits chegam quando o backend suportar SSH.
          </StubSection>
          <StubSection id="set-avancado" title="AVANÇADO">
            Git LFS, hooks e limpeza de cache chegam numa próxima fase.
          </StubSection>
        </div>
      </div>
    </div>
  );
}
