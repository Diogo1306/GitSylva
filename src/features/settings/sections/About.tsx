import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "../../../components/ui/Button";
import { SectionTitle, Hint } from "./_shared";
import { errMsg } from "../../../lib/errors";

const mono = "'JetBrains Mono', monospace";

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
      .catch((e: unknown) => setState({ kind: "error", message: errMsg(e, "não foi possível verificar atualizações") }));
  }

  function install(u: Update) {
    setState({ kind: "installing" });
    u.downloadAndInstall()
      .then(() => relaunch())
      .catch((e: unknown) => setState({ kind: "error", message: errMsg(e, "não foi possível atualizar") }));
  }

  return (
    <div id="set-sobre" style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
      <SectionTitle>SOBRE</SectionTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>
            GitSylva{" "}
            <span style={{ fontFamily: mono, fontSize: 12.5, color: "var(--text2)" }}>v{version || "…"}</span>
          </div>
          <Hint>As atualizações também são verificadas automaticamente no arranque.</Hint>
        </div>
        {state.kind === "available" ? (
          <Button variant="primary" onClick={() => install(state.update)}>
            Atualizar para {state.update.version}
          </Button>
        ) : (
          <Button onClick={runCheck} disabled={state.kind === "checking" || state.kind === "installing"}>
            {state.kind === "checking" ? "A verificar…" : state.kind === "installing" ? "A instalar…" : "Procurar atualizações"}
          </Button>
        )}
      </div>
      {state.kind === "latest" && <Hint>Estás na versão mais recente.</Hint>}
      {state.kind === "installing" && <Hint>A transferir e instalar — a app reinicia sozinha no fim.</Hint>}
      {state.kind === "error" && <div style={{ fontSize: 12.5, color: "var(--ddT)" }}>{state.message}</div>}
    </div>
  );
}
