import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ConfirmDialog } from "./ConfirmDialog";
import { toast } from "../state/toastStore";
import { errMsg } from "../lib/errors";

// Startup update check (user request R5): if a newer release is published
// (GitHub releases → latest.json), ask once whether to install it. The
// download/verify/install runs in the Rust updater plugin; on success the app
// relaunches itself into the new version.
export function UpdatePrompt() {
  const [update, setUpdate] = useState<Update | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The first seconds after launch are the machine's busiest window (R4's
    // startup burst) — ask the network later, and never block anything on it.
    const t = window.setTimeout(() => {
      check()
        .then((u) => {
          if (!cancelled && u) setUpdate(u);
        })
        .catch(() => {
          // dev build, browser preview, offline, or private repo: no updates
          // reachable — stay silent, this is a convenience check.
        });
    }, 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!update) return null;
  return (
    <ConfirmDialog
      message={`Está disponível a versão ${update.version} do GitSylva (tens a ${update.currentVersion}). Transferir e instalar agora? A app reinicia sozinha no fim.`}
      confirmLabel="Atualizar agora"
      onCancel={() => setUpdate(null)}
      onConfirm={() => {
        const u = update;
        setUpdate(null);
        toast("A transferir a atualização…");
        u.downloadAndInstall()
          .then(() => relaunch())
          .catch((e: unknown) => toast(errMsg(e, "não foi possível atualizar"), "error"));
      }}
    />
  );
}
