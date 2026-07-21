import { useRef } from "react";
import { useThemeStore } from "../../../state/themeStore";
import { toast } from "../../../state/toastStore";
import {
  PALETTES,
  FONTS,
  BRANCH_COLOR_META,
  treeLeafColor,
  themeName,
  themeHint,
  accentName,
  fontName,
  fontDesc,
  treeName,
  treeDesc,
  branchColorName,
  type ThemeKey,
  type TreeStyleKey,
  type FontKey,
} from "../../../theme/themes";
import { useT } from "../../../i18n";
import { Toggle } from "../../../components/ui/misc";
import { Button } from "../../../components/ui/Button";
import { SectionTitle, FieldLabel, Hint } from "./_shared";
import { pillStyle } from "./pill";

const THEME_KEYS = ["theme", "treeStyle", "branchColor", "accentIdx", "fontKey", "anims"] as const;

const THEME_ORDER: ThemeKey[] = ["escuro", "claro", "nipon", "gitclassic"];
const TREE_ORDER: TreeStyleKey[] = ["normal", "sakura", "tropical", "grafo"];
const FONT_ORDER: FontKey[] = ["inter", "sistema", "atkinson"];

function ThemeCard({ themeKey, active, onPick }: { themeKey: ThemeKey; active: boolean; onPick: () => void }) {
  const p = PALETTES[themeKey];
  const v = p.vars;
  const accent = p.accents[0][1];
  return (
    <div onClick={onPick} style={{ flex: 1, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, borderRadius: 12, padding: 10, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, background: "var(--panel)" }}>
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
        <span style={{ fontSize: 13, fontWeight: 600 }}>{themeName(themeKey)}</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{themeHint(themeKey)}</span>
      </div>
    </div>
  );
}

// Each style previews with its OWN leaf color (via treeLeafColor) — reading
// the live --leaf here made every icon take the color of whichever style is
// currently applied.
function TreeIcon({ kind, leaf }: { kind: TreeStyleKey; leaf: string }) {
  if (kind === "sakura")
    return (
      <svg width={20} height={20} viewBox="0 0 16 16">
        {[0, 1, 2, 3, 4].map((a) => {
          const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
          return <circle key={a} cx={8 + Math.cos(ang) * 3.2} cy={8 + Math.sin(ang) * 3.2} r={2.1} fill={leaf} />;
        })}
        <circle cx={8} cy={8} r={1.3} fill="var(--win)" />
      </svg>
    );
  if (kind === "tropical")
    return (
      <svg width={22} height={16} viewBox="0 0 18 13">
        <path d="M9,11 Q10,4 17,2 Q11,8 9,11 Z" fill={leaf} />
        <path d="M9,11 Q8,4 1,2 Q7,8 9,11 Z" fill={leaf} opacity={0.8} />
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
      <path d="M1,10 Q6,2 15,4 Q7,9 1,10 Z" fill={leaf} />
    </svg>
  );
}

export function Appearance() {
  const t = useT();
  const prefs = useThemeStore();
  const accents = PALETTES[prefs.theme].accents;
  // "Auto" previews the CURRENT THEME's own vivid pair — the live --l1/--l2
  // vars are already recolored by the selected palette, so reading them made
  // Auto mirror whatever palette was active instead of the theme default.
  const vivid = PALETTES[prefs.theme].vivid;
  const autoSwatch = `linear-gradient(90deg, ${vivid[0]}, ${vivid[1]})`;
  const fileRef = useRef<HTMLInputElement>(null);

  function exportTheme() {
    const data = Object.fromEntries(THEME_KEYS.map((k) => [k, prefs[k]]));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gitsylva-theme.json";
    a.click();
    URL.revokeObjectURL(url);
    toast(t("settings.appearance.exported"));
  }

  function importTheme(file: File) {
    file.text().then((text) => {
      try {
        const data = JSON.parse(text);
        const patch: Record<string, unknown> = {};
        for (const k of THEME_KEYS) if (k in data) patch[k] = data[k];
        prefs.savePrefs(patch);
        toast(t("settings.appearance.imported"));
      } catch {
        toast(t("settings.appearance.invalidFile"));
      }
    });
  }

  return (
    <div id="set-aparencia" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.appearance.title")}</SectionTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.theme")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {THEME_ORDER.map((k) => (
            <ThemeCard key={k} themeKey={k} active={prefs.theme === k} onPick={() => prefs.savePrefs({ theme: k })} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.treeStyle")}</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {TREE_ORDER.map((k) => {
            const active = prefs.treeStyle === k;
            return (
              <div key={k} onClick={() => prefs.savePrefs({ treeStyle: k })} className="gs-lift" style={{ border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: "var(--panel)" }}>
                <TreeIcon kind={k} leaf={treeLeafColor(prefs.theme, k)} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{treeName(k)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{treeDesc(k)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <Hint>{t("settings.appearance.treeHint")}</Hint>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.branchColor")}</FieldLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BRANCH_COLOR_META.map((lc) => (
            <div key={lc.key} onClick={() => prefs.savePrefs({ branchColor: lc.key })} style={pillStyle(prefs.branchColor === lc.key)}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: lc.key === "auto" ? autoSwatch : lc.swatch }} />
              <span>{branchColorName(lc.key)}</span>
            </div>
          ))}
        </div>
        <Hint>{t("settings.appearance.branchHint")}</Hint>
      </div>

      <div onClick={() => prefs.savePrefs({ anims: !prefs.anims })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", cursor: "pointer", borderBottom: "1px solid var(--bsoft)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t("settings.appearance.anims")}</div>
          <Hint>{t("settings.appearance.animsHint")}</Hint>
        </div>
        <Toggle on={prefs.anims} aria-label={t("settings.appearance.anims")} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.accent")}</FieldLabel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {accents.map((a, i) => (
            <div key={a[0]} onClick={() => prefs.savePrefs({ accentIdx: i })} style={pillStyle(prefs.accentIdx === i)}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: a[1] }} />
              <span>{accentName(prefs.theme, i)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.density")}</FieldLabel>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
          {(["conforto", "compacta"] as const).map((k) => (
            <div key={k} onClick={() => prefs.savePrefs({ density: k })} style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: prefs.density === k ? "var(--win)" : "transparent", color: prefs.density === k ? "var(--text)" : "var(--muted)" }}>
              {k === "conforto" ? t("settings.appearance.densityComfort") : t("settings.appearance.densityCompact")}
            </div>
          ))}
        </div>
        <Hint>{t("settings.appearance.densityHint")}</Hint>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.openRepos")}</FieldLabel>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
          {(["tabs", "rail"] as const).map((k) => (
            <div key={k} onClick={() => prefs.savePrefs({ repoLayout: k })} style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: prefs.repoLayout === k ? "var(--win)" : "transparent", color: prefs.repoLayout === k ? "var(--text)" : "var(--muted)" }}>
              {k === "tabs" ? t("settings.appearance.layoutTabs") : t("settings.appearance.layoutRail")}
            </div>
          ))}
        </div>
        <Hint>{t("settings.appearance.openReposHint")}</Hint>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.historyPanel")}</FieldLabel>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
          {(["lado", "baixo"] as const).map((k) => (
            <div key={k} onClick={() => prefs.savePrefs({ historyLayout: k })} style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: prefs.historyLayout === k ? "var(--win)" : "transparent", color: prefs.historyLayout === k ? "var(--text)" : "var(--muted)" }}>
              {k === "lado" ? t("settings.appearance.historySide") : t("settings.appearance.historyBelow")}
            </div>
          ))}
        </div>
        <Hint>{t("settings.appearance.historyPanelHint")}</Hint>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.font")}</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {FONT_ORDER.map((k) => {
            const active = prefs.fontKey === k;
            return (
              <div key={k} onClick={() => prefs.savePrefs({ fontKey: k })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, cursor: "pointer", background: "var(--panel)" }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, background: active ? "var(--accent)" : "transparent", boxSizing: "border-box", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{fontName(k)}</div>
                  <Hint>{fontDesc(k)}</Hint>
                </div>
                <div style={{ fontSize: 16, color: "var(--text2)", fontFamily: FONTS[k].stack }}>AaBbCc 0123</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>{t("settings.appearance.shareTheme")}</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={exportTheme}>{t("settings.appearance.export")}</Button>
          <Button onClick={() => fileRef.current?.click()}>{t("settings.appearance.import")}</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importTheme(f);
              e.target.value = "";
            }}
          />
        </div>
        <Hint>{t("settings.appearance.shareHint")}</Hint>
      </div>
    </div>
  );
}
