import { useState } from "react";
import { useThemeStore } from "../../../state/themeStore";
import { useRecentsStore } from "../../../state/recentsStore";
import { toast } from "../../../state/toastStore";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { Hint } from "./_shared";

export function Cleanup() {
  const resetPrefs = useThemeStore((s) => s.resetPrefs);
  const recents = useRecentsStore((s) => s.recents);
  const clearRecents = useRecentsStore((s) => s.clear);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div id="set-limpeza" style={{ display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", color: "var(--ddT)" }}>LIMPEZA</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Button onClick={() => { clearRecents(); toast("Recentes limpos"); }}>Limpar repositórios recentes</Button>
        <Hint>{recents.length} guardado(s).</Hint>
      </div>
      <div>
        <Button variant="danger" onClick={() => setConfirmReset(true)}>Repor todas as definições</Button>
      </div>
      {confirmReset && (
        <ConfirmDialog
          message="Repor tema, estilo de árvore, cores, fonte e restantes preferências para os valores predefinidos?"
          confirmLabel="Repor"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => { resetPrefs(); setConfirmReset(false); toast("Definições repostas"); }}
        />
      )}
    </div>
  );
}
