import { useEffect, useState } from "react";
import { OnboardTree } from "../../components/TreeLogo";
import { Wordmark } from "../../components/Wordmark";
import { FallingLeaves } from "../../components/FallingLeaves";
import { useThemeStore } from "../../state/themeStore";
import { useOnboardStore } from "../../state/onboardStore";
import { toast } from "../../state/toastStore";
import { PALETTES, TREE_META, BRANCH_COLOR_META, type ThemeKey, type TreeStyleKey } from "../../theme/themes";
import { comboHint } from "../../lib/platform";

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

// The "what's new" deck shown in the setup step (design: obNovCards).
const NEWS: [string, string][] = [
  ["Grupos de separadores", "Organiza os repositórios abertos em grupos com cor, em abas ou na barra lateral."],
  [`Pesquisa total ${comboHint("mod+k")}`, "Commits, branches, ficheiros, repositórios e ações git num só sítio."],
  ["Árvore viva", "O histórico cresce como uma árvore — folhas, flores, palmeiras ou só nós."],
];

export function Onboarding() {
  const anims = useThemeStore((s) => s.anims);
  const t = useThemeStore();
  const finish = useOnboardStore((s) => s.finish);
  const [phase, setPhase] = useState<Phase>(anims ? "splash" : "login");
  const [news, setNews] = useState(0);

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

  if (phase === "splash") return <Splash />;

  const stage = phase === "login" ? 0 : phase === "setup" ? 1 : 2;
  const caption = phase === "login" ? "ENTRAR" : phase === "setup" ? "PERSONALIZAR" : "PLANTADO";

  const providers: [string, string, string][] = [
    ["G", "Continuar com GitHub", "github.com"],
    ["GL", "Continuar com GitLab", "gitlab.com"],
    ["B", "Continuar com Bitbucket", "bitbucket.org"],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 85, background: "var(--desk)", display: "grid", placeItems: "center", fontFamily: "var(--font)", color: "var(--text)", overflow: "hidden", animation: "fadeIn 0.45s ease both" }}>
      <FallingLeaves />
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 60, padding: 24, boxSizing: "border-box" }}>
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
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>COR DAS BRANCHES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {BRANCH_COLOR_META.map((lc) => {
                  // "Auto" must preview the SELECTED theme's own vivid pair;
                  // the live --l1/--l2 vars are already recolored by whatever
                  // palette is active (the initial-screen color bug).
                  const vivid = PALETTES[t.theme].vivid;
                  const swatch = lc.key === "auto" ? `linear-gradient(90deg, ${vivid[0]}, ${vivid[1]})` : lc.swatch;
                  return (
                    <div
                      key={lc.key}
                      onClick={() => t.savePrefs({ branchColor: lc.key })}
                      title={lc.name}
                      className="gs-lift"
                      style={{ width: 26, height: 26, borderRadius: "50%", border: `2px solid ${t.branchColor === lc.key ? "var(--accent)" : "var(--btnB)"}`, background: swatch, cursor: "pointer", boxSizing: "border-box" }}
                    />
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>NOVIDADES</div>
              <div style={{ position: "relative", height: 88 }}>
                {NEWS.map(([title, sub], i) => {
                  // Stacked deck per the animation spec: back cards sit at
                  // translateX ±30, y9, rotate ±3.5°, scale .96, opacity .5;
                  // advancing reflows over 450ms with the pop easing.
                  const off = (i - news + NEWS.length) % NEWS.length;
                  return (
                    <div
                      key={title}
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "12px 14px",
                        borderRadius: 11,
                        border: "1px solid var(--border)",
                        background: "var(--panel)",
                        transform:
                          off === 0
                            ? "none"
                            : `translateX(${off === 1 ? 30 : -30}px) translateY(9px) rotate(${off === 1 ? 3.5 : -3.5}deg) scale(0.96)`,
                        opacity: off === 0 ? 1 : 0.5,
                        zIndex: NEWS.length - off,
                        transition: "transform 450ms var(--ease-pop), opacity 450ms var(--ease-pop)",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, lineHeight: 1.4 }}>{sub}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {NEWS.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setNews(i)}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: i === news ? "var(--accent)" : "var(--btnB)", cursor: "pointer" }}
                  />
                ))}
                <div style={{ flex: 1 }} />
                <div onClick={() => setNews((n) => (n + 1) % NEWS.length)} style={{ fontSize: 12, color: "var(--text2)", cursor: "pointer" }}>
                  próximo →
                </div>
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
