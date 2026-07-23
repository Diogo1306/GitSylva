import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useOnboardStore } from "../../state/onboardStore";
import { Appearance } from "./sections/Appearance";
import { Accounts } from "./sections/Accounts";
import { GitIdentity } from "./sections/GitIdentity";
import { Commits } from "./sections/Commits";
import { PushPull } from "./sections/PushPull";
import { Cleanup } from "./sections/Cleanup";
import { About } from "./sections/About";
import { Shortcuts } from "./sections/Shortcuts";
import { Notifications } from "./sections/Notifications";
import { StubSection, SectionTitle, Hint } from "./sections/_shared";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";
import { Segmented } from "../../components/ui/Segmented";
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
  ["settings.nav.about", "set-sobre"],
  ["settings.nav.cleanup", "set-limpeza"],
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
      <Segmented
        aria-label={t("settings.language.title")}
        value={locale}
        onChange={(v) => setLocale(v as Locale)}
        options={options.map(([key, labelKey]) => ({ value: key, label: t(labelKey) }))}
      />
      <Hint>{t("settings.language.desc")}</Hint>
    </div>
  );
}

export function Settings() {
  const t = useT();
  const setView = useAppStore((s) => s.setView);
  const prevView = useAppStore((s) => s.prevView);
  const settingsSection = useAppStore((s) => s.settingsSection);
  const setSettingsSection = useAppStore((s) => s.setSettingsSection);
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

  // Deep-link: opened targeting a section (e.g. the sidebar "Conta & sync" row) — scroll to it once,
  // then clear (deferred so it isn't a synchronous store write inside the effect). The scroll-spy updates `active`.
  useEffect(() => {
    if (!settingsSection) return;
    scrollRef.current?.querySelector(`#${settingsSection}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    const id = setTimeout(() => setSettingsSection(null), 0);
    return () => clearTimeout(id);
  }, [settingsSection, setSettingsSection]);

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, background: "var(--win)", animation: "fadeUp 0.25s ease both" }}>
      <div style={{ width: 192, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--panel)", padding: "var(--sp-7) var(--sp-4)", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", boxSizing: "border-box" }}>
        <div onClick={() => setView(prevView)} className="gs-lift" style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", marginBottom: "var(--sp-5)", borderRadius: "var(--r-btn)", background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", fontSize: "var(--fs-btn)", fontWeight: "var(--fw-semibold)", cursor: "pointer" }}>
          ← {t("common.back")}
        </div>
        <FormField label={t("settings.searchSections")} hideLabel>
          <Input
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            placeholder={t("common.searchEllipsis")}
            style={{ marginBottom: "var(--sp-3)", padding: "6px 10px", fontSize: "var(--fs-btn)" }}
          />
        </FormField>
        {visibleNav.length === 0 && (
          <div style={{ padding: "6px 11px", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{t("settings.noSections", { query: navQuery })}</div>
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
            style={{ padding: "7px 11px", borderRadius: "var(--r-btn)", fontSize: "var(--fs-sm)", textDecoration: "none", color: active === id ? "var(--text)" : "var(--text2)", background: active === id ? "var(--sel)" : undefined, fontWeight: active === id ? "var(--fw-semibold)" : "var(--fw-regular)" }}
          >
            {name}
          </a>
        ))}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 32, animation: "fadeUp 0.3s ease both" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-title)", fontWeight: "var(--fw-bold)", letterSpacing: "-0.2px" }}>{t("settings.title")}</div>
              <div style={{ fontSize: "var(--fs-base)", color: "var(--text2)", marginTop: 4 }}>{t("settings.subtitle")}</div>
            </div>
            <div onClick={replayOnboard} className="gs-lift" style={{ fontSize: "var(--fs-xs)", color: "var(--text2)", border: "1px solid var(--btnB)", padding: "6px 12px", borderRadius: "var(--r-btn)", cursor: "pointer", whiteSpace: "nowrap" }}>
              {t("settings.replayOnboarding")}
            </div>
          </div>

          <Appearance />

          <Accounts />

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

          <About />

          <Cleanup />
        </div>
      </div>
    </div>
  );
}
