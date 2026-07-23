import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Wordmark } from "../../components/Wordmark";
import { FallingLeaves } from "../../components/FallingLeaves";
import { useThemeStore } from "../../state/themeStore";
import { useOnboardStore } from "../../state/onboardStore";
import { useShortcutsStore } from "../../state/shortcutsStore";
import { toast } from "../../state/toastStore";
import { PALETTES, type ThemeKey, type TreeStyleKey, themeName, treeName } from "../../theme/themes";
import { comboHint } from "../../lib/platform";
import { useT } from "../../i18n";
import { WinControls } from "../shell/Titlebar";
import { Button } from "../../components/ui/Button";
import { SelectableRow, SelectableCard } from "../../components/ui/SelectableRow";
import s0Escuro from "../../theme/marks/onboard/s0-escuro.svg?raw";
import s1Escuro from "../../theme/marks/onboard/s1-escuro.svg?raw";
import s2Escuro from "../../theme/marks/onboard/s2-escuro.svg?raw";
import s0Claro from "../../theme/marks/onboard/s0-claro.svg?raw";
import s1Claro from "../../theme/marks/onboard/s1-claro.svg?raw";
import s2Claro from "../../theme/marks/onboard/s2-claro.svg?raw";
import s0Git from "../../theme/marks/onboard/s0-gitclassic.svg?raw";
import s1Git from "../../theme/marks/onboard/s1-gitclassic.svg?raw";
import s2Git from "../../theme/marks/onboard/s2-gitclassic.svg?raw";
import s0Nipon from "../../theme/marks/onboard/s0-nipon.svg?raw";
import s1Nipon from "../../theme/marks/onboard/s1-nipon.svg?raw";
import s2Nipon from "../../theme/marks/onboard/s2-nipon.svg?raw";

// The kit's animated onboarding trees (design v6): per theme, three growth
// stages, self-drawing on mount. Hollow nodes fill with --gs-bg (set on the
// host to blend with the backdrop, per the kit README).
const TREES: Record<ThemeKey, [string, string, string]> = {
  escuro: [s0Escuro, s1Escuro, s2Escuro],
  claro: [s0Claro, s1Claro, s2Claro],
  gitclassic: [s0Git, s1Git, s2Git],
  nipon: [s0Nipon, s1Nipon, s2Nipon],
};

// Splash shows just the S (stage 0) cropped to its own bounds so it sits big
// between the letters — the stage files share the 84×112 growth canvas.
const cropToS = (svg: string) => svg.replace('viewBox="0 0 84 112"', 'viewBox="11 44 47 65"');

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

// A labeled group of choice cards/pills (theme, tree style, repo layout).
// Every card is already its own Tab stop (SelectableRow/SelectableCard), so
// this only adds Left/Right (and Up/Down) arrow-key hopping between the
// cards already inside — a11y bonus on top of the Tab/Enter/Space each card
// gets for free from the Task-1 primitive.
function ChoiceGroup({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="button"]') ?? []);
    const from = items.indexOf(document.activeElement as HTMLElement);
    if (from === -1) return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    items[(from + delta + items.length) % items.length]?.focus();
  };
  return (
    <div ref={ref} role="group" aria-label={label} onKeyDown={onKeyDown} style={style}>
      {children}
    </div>
  );
}

type Phase = "splash" | "login" | "setup" | "grow";

const THEME_ORDER: ThemeKey[] = ["escuro", "claro", "nipon", "gitclassic"];
const TREE_ORDER: TreeStyleKey[] = ["normal", "sakura", "tropical", "grafo"];

// Tree box heights per onboarding stage (design: obTreeH).
const TREE_H = [268, 330, 396];

function Splash({ theme }: { theme: ThemeKey }) {
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
        {/* The kit's clean S (stage 0), self-drawing, themed — design v6. */}
        <span
          className="gs-treeanim"
          dangerouslySetInnerHTML={{ __html: cropToS(TREES[theme]?.[0] ?? s0Escuro) }}
          style={{ display: "inline-block", width: 46, height: 64, margin: "0 1px", alignSelf: "center", transform: "translateY(6px)", ["--gs-bg" as never]: "var(--win)" }}
        />
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
  const ts = useThemeStore();
  const t = useT();
  const finish = useOnboardStore((s) => s.finish);
  const [phase, setPhase] = useState<Phase>(anims ? "splash" : "login");
  // Same rebindable, platform-aware hint the titlebar search uses (Ctrl+K on
  // Windows/Linux, ⌘K on macOS) — never hardcoded, so it stays true if the
  // user rebinds the palette shortcut.
  const paletteHint = comboHint(useShortcutsStore((s) => s.bindings.palette));

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
        <Splash theme={ts.theme} />
        <OnboardBar />
      </>
    );

  const stage = phase === "login" ? 0 : phase === "setup" ? 1 : 2;
  const caption =
    phase === "login"
      ? t("onboarding.caption.login")
      : phase === "setup"
        ? t("onboarding.caption.setup")
        : t("onboarding.caption.grow");

  const providers: [string, string, string][] = [
    ["G", "GitHub", "github.com"],
    ["GL", "GitLab", "gitlab.com"],
    ["B", "Bitbucket", "bitbucket.org"],
  ];

  return (
    // The WHOLE empty background is a drag handle (R5.17) — a thin top strip
    // wasn't where anyone instinctively grabs. Interactive children still get
    // their clicks (the drag only fires when the target IS this element).
    <div data-tauri-drag-region style={{ position: "fixed", inset: 0, zIndex: 85, background: "var(--desk)", display: "grid", placeItems: "center", fontFamily: "var(--font)", color: "var(--text)", overflow: "hidden", animation: "fadeIn 0.45s ease both" }}>
      <OnboardBar />
      <FallingLeaves />
      <div data-tauri-drag-region style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 60, padding: 24, boxSizing: "border-box" }}>
        {/* Left: the kit's growing tree, stage by stage (design v6): only the
            S at login, the trunk extends at setup, full crown when planted. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 310 }}>
          {/* Outer PERSISTS across stages (key = theme) so its height/width
              transition animates the GROWTH; inner REMOUNTS per stage (key
              includes stage) so each stage's strokes self-draw again. Both. */}
          <div
            key={`tree-${ts.theme}`}
            style={{ height: TREE_H[stage], width: Math.round((TREE_H[stage] * 84) / 112), transition: "height 0.9s cubic-bezier(0.2,0.9,0.3,1), width 0.9s cubic-bezier(0.2,0.9,0.3,1)" }}
          >
            <div
              key={`s-${ts.theme}-${stage}`}
              className="gs-treeanim"
              dangerouslySetInnerHTML={{ __html: TREES[ts.theme]?.[stage] ?? s0Escuro }}
              style={{ width: "100%", height: "100%", ["--gs-bg" as never]: "var(--win)" }}
            />
          </div>
          <div style={{ marginTop: 4 }}>
            <Wordmark size={20} />
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "1.8px", textTransform: "uppercase" }}>{caption}</div>
        </div>

        {/* Right: stage content */}
        {phase === "login" && (
          <div style={{ width: 336, display: "flex", flexDirection: "column", gap: 8, animation: "fadeUp 0.45s ease 0.15s both" }}>
            <div style={{ fontSize: 21, fontWeight: 700 }}>{t("onboarding.login.welcome")}</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4, lineHeight: 1.5 }}>
              {t("onboarding.login.subtitle")}
            </div>
            {/* Primary path (item 1): a real, accent, first-in-tab-order CTA. */}
            <Button
              variant="primary"
              onClick={() => setPhase("setup")}
              style={{ width: "100%", justifyContent: "center", padding: 12, borderRadius: 11, fontSize: 14, marginTop: 4 }}
            >
              {t("onboarding.login.continueLocally")}
            </Button>

            {/* Secondary, de-emphasized path (item 2): not yet functional. */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 20 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>
                {t("onboarding.login.integrationsSoonLabel")}
              </div>
              <ChoiceGroup label={t("onboarding.login.integrationsGroup")} style={{ display: "flex", flexDirection: "column", gap: 6, opacity: 0.7 }}>
                {providers.map(([initial, provider, sub]) => (
                  <SelectableRow
                    key={provider}
                    onSelect={() => toast(t("onboarding.login.accountSoon"))}
                    className="gs-lift"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 13px", borderRadius: 11, background: "var(--btn)", border: "1px solid var(--btnB)" }}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--badge)", color: "var(--badgeT)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11.5, flexShrink: 0 }}>{initial}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t("onboarding.login.continueWith", { provider })}</div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>
                    </div>
                    <span className="gs-soon">{t("common.soon")}</span>
                  </SelectableRow>
                ))}
              </ChoiceGroup>
            </div>
          </div>
        )}

        {phase === "setup" && (
          <div style={{ width: 360, display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.45s ease both" }}>
            <div>
              <div style={{ fontSize: 21, fontWeight: 700 }}>{t("onboarding.setup.title")}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4 }}>{t("onboarding.setup.subtitle")}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>{t("onboarding.setup.themeLabel")}</div>
              <ChoiceGroup label={t("onboarding.setup.themeGroup")} style={{ display: "flex", gap: 8 }}>
                {THEME_ORDER.map((k) => {
                  const v = PALETTES[k].vars;
                  const active = ts.theme === k;
                  return (
                    <SelectableCard
                      key={k}
                      selected={active}
                      onSelect={() => ts.savePrefs({ theme: k })}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 0, border: "none", background: "transparent" }}
                    >
                      <div className="gs-lift" style={{ width: 76, height: 52, borderRadius: 9, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, background: v["--win"], overflow: "hidden", display: "flex" }}>
                        <div style={{ width: 24, background: v["--panel"], borderRight: `1px solid ${v["--border"]}`, boxSizing: "border-box" }} />
                        <div style={{ flex: 1, padding: 7, display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ height: 5, width: "72%", borderRadius: 3, background: v["--l0"] }} />
                          <div style={{ height: 5, width: "50%", borderRadius: 3, background: v["--border"] }} />
                          <div style={{ height: 5, width: "62%", borderRadius: 3, background: v["--border"] }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--text)" : "var(--muted)" }}>{themeName(k)}</div>
                    </SelectableCard>
                  );
                })}
              </ChoiceGroup>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>{t("onboarding.setup.treeStyleLabel")}</div>
              <ChoiceGroup label={t("onboarding.setup.treeStyleGroup")} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TREE_ORDER.map((k) => {
                  const active = ts.treeStyle === k;
                  return (
                    <SelectableRow
                      key={k}
                      selected={active}
                      onSelect={() => ts.savePrefs({ treeStyle: k })}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 999, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, fontSize: 12.5, color: active ? "var(--text)" : "var(--text2)", background: "transparent" }}
                    >
                      {treeName(k)}
                    </SelectableRow>
                  );
                })}
              </ChoiceGroup>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>{t("onboarding.setup.repoLayoutLabel")}</div>
              {/* Mini previews, same language as the theme cards (R5.18). */}
              <ChoiceGroup label={t("onboarding.setup.repoLayoutGroup")} style={{ display: "flex", gap: 8 }}>
                {(["tabs", "rail"] as const).map((k) => {
                  const active = ts.repoLayout === k;
                  return (
                    <SelectableCard
                      key={k}
                      selected={active}
                      onSelect={() => ts.savePrefs({ repoLayout: k })}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 0, border: "none", background: "transparent" }}
                    >
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
                        {k === "tabs" ? t("onboarding.setup.layoutTabs") : t("onboarding.setup.layoutRail")}
                      </div>
                    </SelectableCard>
                  );
                })}
              </ChoiceGroup>
            </div>

            {/* Saltar was removed (item 3): its handler called
                themeStore.resetPrefs(), which wipes the entire persisted prefs
                slice (theme, treeStyle, repoLayout AND anims, accent, font,
                branchColor, historyLayout, density, pullMode, confirmDiscard,
                notif* ...), not just the pickers above — then landed on the
                same "grow" phase Plantar e entrar reaches. As a one-click,
                no-confirm button reachable when replaying onboarding, it was a
                footgun that could silently reset a returning user's whole
                config. The confirm-gated "Repor todas as definicoes" in
                Settings > Cleanup covers the real reset need. */}
            <Button
              variant="primary"
              onClick={() => setPhase("grow")}
              style={{ width: "100%", padding: 12, borderRadius: 11, fontSize: 14, marginTop: 2, justifyContent: "center" }}
            >
              {t("onboarding.setup.plant")}
            </Button>
          </div>
        )}

        {phase === "grow" && (
          <div style={{ width: 336, display: "flex", flexDirection: "column", gap: 8, animation: "fadeUp 0.45s ease 0.25s both" }}>
            <div style={{ fontSize: 21, fontWeight: 700 }}>{t("onboarding.grow.title")}</div>
            {/* Item 4: only the three essential concepts, nothing more. */}
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>
              {t("onboarding.grow.descPre")}<strong>{t("onboarding.grow.workingCopy")}</strong>{t("onboarding.grow.descMid1")}<strong>{t("onboarding.grow.commitTree")}</strong>{t("onboarding.grow.descMid2")}<strong>{paletteHint}</strong>{t("onboarding.grow.descPost")}
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>{t("onboarding.grow.goodCode")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
