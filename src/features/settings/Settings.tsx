import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useOnboardStore } from "../../state/onboardStore";
import { Appearance } from "./sections/Appearance";
import { GitIdentity } from "./sections/GitIdentity";
import { PushPull } from "./sections/PushPull";
import { StubSection } from "./sections/_shared";

// Settings nav. Each entry is a section id rendered in the scroll area below;
// a scroll-spy highlights the one currently in view.
const NAV: [string, string][] = [
  ["Aparência", "set-aparencia"],
  ["Contas", "set-contas"],
  ["Git", "set-git"],
  ["Push & Pull", "set-pushpull"],
  ["Atalhos", "set-atalhos"],
  ["SSH", "set-ssh"],
  ["Avançado", "set-avancado"],
];

export function Settings() {
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);
  const replayOnboard = useOnboardStore((s) => s.replay);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("set-aparencia");

  // Scroll-spy: highlight the nav entry whose section is nearest the top.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root, rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );
    NAV.forEach(([, id]) => {
      const el = root.querySelector(`#${id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, background: "var(--win)", animation: "fadeIn 0.25s ease both" }}>
      <div style={{ width: 192, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--panel)", padding: "16px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", boxSizing: "border-box" }}>
        <div onClick={() => setView(prevView)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", marginBottom: 12, borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          ← Voltar
        </div>
        {NAV.map(([name, id]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="gs-row"
            style={{ padding: "7px 11px", borderRadius: 8, fontSize: 13, textDecoration: "none", color: active === id ? "var(--text)" : "var(--text2)", background: active === id ? "var(--sel)" : "transparent", fontWeight: active === id ? 600 : 400 }}
          >
            {name}
          </a>
        ))}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 32, animation: "fadeUp 0.3s ease both" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.2px" }}>Definições</div>
              <div style={{ fontSize: 13.5, color: "var(--text2)", marginTop: 4 }}>Preferências guardadas automaticamente neste dispositivo.</div>
            </div>
            <div onClick={replayOnboard} className="gs-lift" style={{ fontSize: 12, color: "var(--text2)", border: "1px solid var(--btnB)", padding: "6px 12px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>
              Rever ecrã de boas-vindas
            </div>
          </div>

          <Appearance />

          <StubSection id="set-contas" title="CONTAS &amp; ACESSO">
            Ligar GitHub / GitLab / Bitbucket (OAuth) e gerir contas locais chega quando o backend suportar autenticação.
          </StubSection>

          <GitIdentity />
          <StubSection id="set-git-extra" title="GIT · EDITOR &amp; OPÇÕES">
            Editor externo e outras opções de git por repositório chegam numa próxima fase.
          </StubSection>

          <PushPull />

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
