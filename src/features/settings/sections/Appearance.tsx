import { useRef } from "react";
import { useThemeStore } from "../../../state/themeStore";
import { toast } from "../../../state/toastStore";
import { PALETTES, FONTS, TREE_META, BRANCH_COLOR_META, type ThemeKey, type TreeStyleKey, type FontKey } from "../../../theme/themes";
import { Toggle } from "../../../components/ui/misc";
import { Button } from "../../../components/ui/Button";
import { SectionTitle, FieldLabel, Hint, pillStyle } from "./_shared";

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
        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{p.hint}</span>
      </div>
    </div>
  );
}

function TreeIcon({ kind }: { kind: TreeStyleKey }) {
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
      <path d="M1,10 Q6,2 15,4 Q7,9 1,10 Z" fill="var(--l0)" />
    </svg>
  );
}

export function Appearance() {
  const t = useThemeStore();
  const accents = PALETTES[t.theme].accents;
  const fileRef = useRef<HTMLInputElement>(null);

  function exportTheme() {
    const data = Object.fromEntries(THEME_KEYS.map((k) => [k, t[k]]));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gitsylva-theme.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Tema exportado");
  }

  function importTheme(file: File) {
    file.text().then((text) => {
      try {
        const data = JSON.parse(text);
        const patch: Record<string, unknown> = {};
        for (const k of THEME_KEYS) if (k in data) patch[k] = data[k];
        t.savePrefs(patch);
        toast("Tema importado");
      } catch {
        toast("Ficheiro de tema inválido");
      }
    });
  }

  return (
    <div id="set-aparencia" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
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
              <div key={k} onClick={() => t.savePrefs({ treeStyle: k })} className="gs-lift" style={{ border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: "var(--panel)" }}>
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
            <div key={lc.key} onClick={() => t.savePrefs({ branchColor: lc.key })} style={pillStyle(t.branchColor === lc.key)}>
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
            <div key={a[0]} onClick={() => t.savePrefs({ accentIdx: i })} style={pillStyle(t.accentIdx === i)}>
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
            <div key={k} onClick={() => t.savePrefs({ repoLayout: k })} style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: t.repoLayout === k ? "var(--win)" : "transparent", color: t.repoLayout === k ? "var(--text)" : "var(--muted)" }}>
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
              <div key={k} onClick={() => t.savePrefs({ fontKey: k })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`, cursor: "pointer", background: "var(--panel)" }}>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>Partilhar tema</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={exportTheme}>Exportar</Button>
          <Button onClick={() => fileRef.current?.click()}>Importar</Button>
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
        <Hint>Guarda ou carrega tema, estilo de árvore, cores, accent e fonte num ficheiro.</Hint>
      </div>
    </div>
  );
}
