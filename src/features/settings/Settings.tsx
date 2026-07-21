import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useOnboardStore } from "../../state/onboardStore";
import { Appearance } from "./sections/Appearance";
import { GitIdentity } from "./sections/GitIdentity";
import { Commits } from "./sections/Commits";
import { PushPull } from "./sections/PushPull";
import { Cleanup } from "./sections/Cleanup";
import { About } from "./sections/About";
import { Shortcuts } from "./sections/Shortcuts";
import { Notifications } from "./sections/Notifications";
import { StubSection, SectionTitle } from "./sections/_shared";
import { FormField } from "../../components/ui/FormField";
import { fold } from "../../lib/fold";
import { useT, useLocaleStore, type MessageKey, type Locale } from "../../i18n";

// Settings nav. Each entry pairs a label catalog key with the section id
// rendered in the scroll area below; a scroll-spy highlights the one in view.
const NAV: [MessageKey, string][] = [
  ["settings.nav.appearance", "set-aparencia"],
  ["settings.nav.accounts", "set-contas"],
  ["settings.nav.git", "set-git"],
  ["settings.nav.gitEditor", "set-git-extra"],
  ["settings.nav.commits", "set-commits"],
  ["settings.nav.pushPull", "set-pushpull"],
  ["settings.nav.shortcuts", "set-atalhos"],
  ["settings.nav.ssh", "set-ssh"],
  ["settings.nav.notifications", "set-notificacoes"],
  ["settings.nav.language", "set-idioma"],
  ["settings.nav.advanced", "set-avancado"],
  ["settings.nav.cleanup", "set-limpeza"],
  ["settings.nav.about", "set-sobre"],
];

// Live language picker replacing the old "Em breve" stub. Switching updates the
// whole UI immediately (useT subscribers re-render) and pins the choice.
function LanguageSection() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const options: [Locale, MessageKey][] = [
    ["pt", "settings.language.pt"],
    ["en", "settings.language.en"],
  ];
  return (
    <div id="set-idioma" style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.language.title")}</SectionTitle>
      <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--panel2)", border: "1px solid var(--border)", alignSelf: "flex-start" }}>
        {options.map(([key, labelKey]) => (
          <div
            key={key}
            onClick={() => setLocale(key)}
            role="button"
            aria-pressed={locale === key}
            style={{ padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: locale === key ? "var(--win)" : "transparent", color: locale === key ? "var(--text)" : "var(--muted)" }}
          >
            {t(labelKey)}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{t("settings.language.desc")}</div>
    </div>
  );
}

export function Settings() {
  const t = useT();
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);
  const replayOnboard = useOnboardStore((s) => s.replay);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("set-aparencia");
  const [navQuery, setNavQuery] = useState("");
  const nav = NAV.map(([key, id]) => [t(key), id] as [string, string]);
  const visibleNav = navQuery.trim() ? nav.filter(([name]) => fold(name).includes(fold(navQuery.trim()))) : nav;

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
    <div style={{ flex: 1, display: "flex", minHeight: 0, background: "var(--win)", animation: "fadeUp 0.25s ease both" }}>
      <div style={{ width: 192, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--panel)", padding: "16px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", boxSizing: "border-box" }}>
        <div onClick={() => setView(prevView)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", marginBottom: 8, borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          ← {t("common.back")}
        </div>
        <FormField label={t("settings.searchSections")} hideLabel>
          <input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder={t("common.searchEllipsis")}
            style={{ marginBottom: 8, background: "var(--input)", border: "1px solid var(--btnB)", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, color: "var(--text)", fontFamily: "var(--font)", boxSizing: "border-box", width: "100%" }}
          />
        </FormField>
        {visibleNav.length === 0 && (
          <div style={{ padding: "6px 11px", fontSize: 12, color: "var(--muted)" }}>{t("settings.noSections", { query: navQuery })}</div>
        )}
        {visibleNav.map(([name, id]) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => {
              e.preventDefault();
              scrollRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="gs-row"
            style={{ padding: "7px 11px", borderRadius: 8, fontSize: 13, textDecoration: "none", color: active === id ? "var(--text)" : "var(--text2)", background: active === id ? "var(--sel)" : undefined, fontWeight: active === id ? 600 : 400 }}
          >
            {name}
          </a>
        ))}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 32, animation: "fadeUp 0.3s ease both" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.2px" }}>{t("settings.title")}</div>
              <div style={{ fontSize: 13.5, color: "var(--text2)", marginTop: 4 }}>{t("settings.subtitle")}</div>
            </div>
            <div onClick={replayOnboard} className="gs-lift" style={{ fontSize: 12, color: "var(--text2)", border: "1px solid var(--btnB)", padding: "6px 12px", borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>
              {t("settings.replayOnboarding")}
            </div>
          </div>

          <Appearance />

          <StubSection id="set-contas" title={t("settings.accounts.title")}>
            {t("settings.accounts.body")}
          </StubSection>

          <GitIdentity />
          <StubSection id="set-git-extra" title={t("settings.gitEditor.title")}>
            {t("settings.gitEditor.body")}
          </StubSection>

          <Commits />
          <PushPull />

          <Shortcuts />
          <StubSection id="set-ssh" title={t("settings.ssh.title")}>
            {t("settings.ssh.body")}
          </StubSection>

          <Notifications />

          <LanguageSection />

          <StubSection id="set-avancado" title={t("settings.advanced.title")}>
            {t("settings.advanced.body")}
          </StubSection>

          <Cleanup />

          <About />
        </div>
      </div>
    </div>
  );
}
