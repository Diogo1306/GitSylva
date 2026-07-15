import { useEffect, useState } from "react";
import { OnboardTree } from "../../components/TreeLogo";
import { Wordmark } from "../../components/Wordmark";
import { FallingLeaves } from "../../components/FallingLeaves";
import { useThemeStore } from "../../state/themeStore";
import { useOnboardStore } from "../../state/onboardStore";
import { toast } from "../../state/toastStore";
import { PALETTES, TREE_META, type ThemeKey, type TreeStyleKey } from "../../theme/themes";
import { WinControls } from "../shell/Titlebar";

// Always-on window bar (R5.18): a frameless window must be movable and
// closable in EVERY onboarding phase, splash included — full-width drag strip
// with the real minimize / maximize / close controls.
function OnboardBar() {
  return (
    <div
      data-tauri-drag-region
      style={{ position: "fixed", top: 0, left: 0, right: 0, height: 40, zIndex: 95, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6, boxSizing: "border-box" }}
    >
      <WinControls />
    </div>
  );
}

type Phase = "splash" | "login" | "setup" | "grow";

const THEME_ORDER: ThemeKey[] = ["escuro", "claro", "nipon", "gitclassic"];
const TREE_ORDER: TreeStyleKey[] = ["normal", "sakura", "tropical", "grafo"];

// Tree box dimensions per stage (design: obTreeW/obTreeH).
const TREE_W = [172, 208, 250];
const TREE_H = [229, 277, 333];

function Splash() {
  // git + tree-S + ylva; side letters animate in then hop away.
  const letter = (ch: string, side: "L" | "R", inDelay: number, hopDelay: number, margin?: string) => (
    <span
      style={{
        display: "inline-block",
        marginRight: margin === "r" ? 5 : undefined,
        marginLeft: margin === "l" ? 5 : undefined,
        animation: `letter${side} 0.32s ease ${inDelay}s both, letterHop 0.42s ease ${hopDelay}s both`,
      }}
    >
      {ch}
    </span>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "var(--desk)", display: "grid", placeItems: "center", animation: "splashSeq 2.05s ease both", pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "baseline", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 52, color: "var(--text)", letterSpacing: "0.5px", animation: "logoIn 0.4s cubic-bezier(0.2,0.9,0.3,1) both" }}>
        {letter("g", "L", 0.88, 1.62)}
        {letter("i", "L", 0.78, 1.56)}
        {letter("t", "L", 0.68, 1.5, "r")}
        <span style={{ display: "inline-block", width: 44, height: 60 }}>
          <OnboardTree stage={0} />
        </span>
        {letter("y", "R", 0.68, 1.5, "l")}
        {letter("l", "R", 0.78, 1.56)}
        {letter("v", "R", 0.88, 1.62)}
        {letter("a", "R", 0.98, 1.68)}
      </div>
    </div>
  );
}

export function Onboarding() {
  const anims = useThemeStore((s) => s.anims);
  const t = useThemeStore();
  const finish = useOnboardStore((s) => s.finish);
  const [phase, setPhase] = useState<Phase>(anims ? "splash" : "login");

  // Splash auto-advances to login.
  useEffect(() => {
    if (phase !== "splash") return;
    const id = setTimeout(() => setPhase("login"), 2050);
    return () => clearTimeout(id);
  }, [phase]);

  // The final "planted" beat, then into the app.
  useEffect(() => {
    if (phase !== "grow") return;
    const id = setTimeout(finish, 1500);
    return () => clearTimeout(id);
  }, [phase, finish]);

  if (phase === "splash")
    return (
      <>
        <Splash />
        <OnboardBar />
      </>
    );

  const stage = phase === "login" ? 0 : phase === "setup" ? 1 : 2;
  const caption = phase === "login" ? "ENTRAR" : phase === "setup" ? "PERSONALIZAR" : "PLANTADO";

  const providers: [string, string, string][] = [
    ["G", "Continuar com GitHub", "github.com"],
    ["GL", "Continuar com GitLab", "gitlab.com"],
    ["B", "Continuar com Bitbucket", "bitbucket.org"],
  ];

  return (
    // The WHOLE empty background is a drag handle (R5.17) — a thin top strip
    // wasn't where anyone instinctively grabs. Interactive children still get
    // their clicks (the drag only fires when the target IS this element).
    <div data-tauri-drag-region style={{ position: "fixed", inset: 0, zIndex: 85, background: "var(--desk)", display: "grid", placeItems: "center", fontFamily: "var(--font)", color: "var(--text)", overflow: "hidden", animation: "fadeIn 0.45s ease both" }}>
      <OnboardBar />
      <FallingLeaves />
      <div data-tauri-drag-region style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 60, padding: 24, boxSizing: "border-box" }}>
        {/* Left: the growing tree + wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 262 }}>
          <div style={{ width: TREE_W[stage], height: TREE_H[stage], transition: "width 0.9s cubic-bezier(0.2,0.9,0.3,1), height 0.9s cubic-bezier(0.2,0.9,0.3,1)" }}>
            <OnboardTree stage={stage} />
          </div>
          <div style={{ marginTop: 4 }}>
            <Wordmark size={20} />
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "1.8px", textTransform: "uppercase" }}>{caption}</div>
        </div>

        {/* Right: stage content */}
        {phase === "login" && (
          <div style={{ width: 336, display: "flex", flexDirection: "column", gap: 8, animation: "fadeUp 0.45s ease 0.15s both" }}>
            <div style={{ fontSize: 21, fontWeight: 700 }}>Bem-vindo</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10, lineHeight: 1.5 }}>
              Liga a tua conta para sincronizar os teus repositórios, ou continua só local.
            </div>
            {providers.map(([initial, label, sub]) => (
              <div
                key={label}
                onClick={() => toast("Login com conta chega na fase de sincronização")}
                className="gs-lift"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 15px", borderRadius: 11, background: "var(--btn)", border: "1px solid var(--btnB)", cursor: "pointer" }}
              >
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--badge)", color: "var(--badgeT)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initial}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>
                </div>
                <span className="gs-soon">Em breve</span>
              </div>
            ))}
            <div onClick={() => setPhase("setup")} style={{ alignSelf: "flex-start", marginTop: 8, fontSize: 12.5, color: "var(--text2)", cursor: "pointer", borderBottom: "1px dashed var(--btnB)", paddingBottom: 1 }}>
              continuar sem conta →
            </div>
          </div>
        )}

        {phase === "setup" && (
          <div style={{ width: 360, display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.45s ease both" }}>
            <div>
              <div style={{ fontSize: 21, fontWeight: 700 }}>Personaliza o teu jardim</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>Tudo isto muda depois nas Definições.</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>TEMA</div>
              <div style={{ display: "flex", gap: 8 }}>
                {THEME_ORDER.map((k) => {
                  const v = PALETTES[k].vars;
                  const active = t.theme === k;
                  return (
                    <div key={k} onClick={() => t.savePrefs({ theme: k })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
                      <div className="gs-lift" style={{ width: 76, height: 52, borderRadius: 9, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, background: v["--win"], overflow: "hidden", display: "flex" }}>
                        <div style={{ width: 24, background: v["--panel"], borderRight: `1px solid ${v["--border"]}`, boxSizing: "border-box" }} />
                        <div style={{ flex: 1, padding: 7, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ height: 5, width: "72%", borderRadius: 3, background: v["--l0"] }} />
                          <div style={{ height: 5, width: "50%", borderRadius: 3, background: v["--border"] }} />
                          <div style={{ height: 5, width: "62%", borderRadius: 3, background: v["--border"] }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--text)" : "var(--muted)" }}>{PALETTES[k].name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>ESTILO DA ÁRVORE</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TREE_ORDER.map((k) => {
                  const active = t.treeStyle === k;
                  return (
                    <div key={k} onClick={() => t.savePrefs({ treeStyle: k })} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 999, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, fontSize: 12.5, cursor: "pointer", color: active ? "var(--text)" : "var(--text2)" }}>
                      {TREE_META[k].name}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>REPOSITÓRIOS ABERTOS</div>
              {/* Mini previews, same language as the theme cards (R5.18). */}
              <div style={{ display: "flex", gap: 8 }}>
                {(["tabs", "rail"] as const).map((k) => {
                  const active = t.repoLayout === k;
                  return (
                    <div key={k} onClick={() => t.savePrefs({ repoLayout: k })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
                      <div className="gs-lift" style={{ width: 76, height: 52, borderRadius: 9, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, background: "var(--win)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {k === "tabs" ? (
                          <>
                            <div style={{ height: 13, background: "var(--panel)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 3, padding: "0 5px", boxSizing: "border-box" }}>
                              <span style={{ width: 18, height: 6, borderRadius: 3, background: "var(--sel)", border: "1px solid var(--btnB)", boxSizing: "border-box" }} />
                              <span style={{ width: 14, height: 6, borderRadius: 3, background: "var(--border)" }} />
                              <span style={{ width: 14, height: 6, borderRadius: 3, background: "var(--border)" }} />
                            </div>
                            <div style={{ flex: 1 }} />
                          </>
                        ) : (
                          <div style={{ flex: 1, display: "flex" }}>
                            <div style={{ width: 15, background: "var(--panel)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 5, boxSizing: "border-box" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--l0)" }} />
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--border)" }} />
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--border)" }} />
                            </div>
                            <div style={{ flex: 1 }} />
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--text)" : "var(--muted)" }}>
                        {k === "tabs" ? "Abas (browser)" : "Barra lateral"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <div onClick={() => setPhase("grow")} className="gs-press" style={{ flex: 1, padding: 12, borderRadius: 11, background: "var(--accent)", color: "var(--accentT)", fontSize: 14, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>
                Plantar e entrar
              </div>
              <div
                onClick={() => {
                  // Skip = enter with the default look (discard the previews above).
                  t.resetPrefs();
                  setPhase("grow");
                }}
                title="Entrar com o aspeto por omissão"
                className="gs-lift"
                style={{ padding: "12px 16px", borderRadius: 11, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--text2)", fontSize: 13, cursor: "pointer" }}
              >
                Saltar
              </div>
            </div>
          </div>
        )}

        {phase === "grow" && (
          <div style={{ width: 336, display: "flex", flexDirection: "column", gap: 8, animation: "fadeUp 0.45s ease 0.25s both" }}>
            <div style={{ fontSize: 21, fontWeight: 700 }}>A tua floresta está plantada</div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>bom código.</div>
          </div>
        )}
      </div>
    </div>
  );
}
