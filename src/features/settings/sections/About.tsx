import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { SectionTitle, Hint } from "./_shared";
import { errMsg } from "../../../lib/errors";
import { useT } from "../../../i18n";

const mono = "var(--font-mono)";

type CheckState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "latest" }
  | { kind: "available"; update: Update }
  | { kind: "installing" }
  | { kind: "error"; message: string };

// Sobre / versão (user request R5.7): shows the running version and lets the
// user check for + install updates on demand (the startup check stays).
export function About() {
  const t = useT();
  const [version, setVersion] = useState<string>("");
  const [state, setState] = useState<CheckState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    import("@tauri-apps/api/app")
      .then((m) => m.getVersion())
      .then((v) => {
        if (!cancelled) setVersion(v);
      })
      .catch(() => {
        if (!cancelled) setVersion("dev");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function runCheck() {
    setState({ kind: "checking" });
    check()
      .then((u) => setState(u ? { kind: "available", update: u } : { kind: "latest" }))
      .catch((e: unknown) => setState({ kind: "error", message: errMsg(e, t("settings.about.checkFailed")) }));
  }

  function install(u: Update) {
    setState({ kind: "installing" });
    u.downloadAndInstall()
      .then(() => relaunch())
      .catch((e: unknown) => setState({ kind: "error", message: errMsg(e, t("settings.about.updateFailed")) }));
  }

  return (
    <div id="set-sobre" style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
      <SectionTitle>{t("settings.about.title")}</SectionTitle>
      <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--fs-base)", fontWeight: "var(--fw-medium)" }}>
            GitSylva{" "}
            <span style={{ fontFamily: mono, fontSize: 12.5, color: "var(--text2)" }}>v{version || "…"}</span>
          </div>
          <Hint>{t("settings.about.autoCheckHint")}</Hint>
        </div>
        {state.kind === "available" ? (
          <Button variant="primary" onClick={() => install(state.update)}>
            {t("settings.about.updateTo", { version: state.update.version })}
          </Button>
        ) : (
          <Button onClick={runCheck} disabled={state.kind === "checking" || state.kind === "installing"}>
            {state.kind === "checking" ? t("settings.about.checking") : state.kind === "installing" ? t("settings.about.installing") : t("settings.about.checkUpdates")}
          </Button>
        )}
      </Card>
      {state.kind === "latest" && <Hint>{t("settings.about.upToDate")}</Hint>}
      {state.kind === "installing" && <Hint>{t("settings.about.downloading")}</Hint>}
      {state.kind === "error" && <div style={{ fontSize: "var(--fs-btn)", color: "var(--ddT)" }}>{state.message}</div>}
    </div>
  );
}
