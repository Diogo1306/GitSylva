import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStashes, useStashActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { errMsg } from "../../lib/errors";

const mono = "'JetBrains Mono', monospace";

export function Stashes() {
  const repo = useAppStore((s) => s.repo)!;
  const setModal = useAppStore((s) => s.setModal);
  const { data, isLoading, error } = useStashes(repo.path);
  const { apply, drop } = useStashActions(repo.path);
  const [confirmDrop, setConfirmDrop] = useState<number | null>(null);
  const stashes = data ?? [];

  return (
    <div style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", animation: "fadeUp 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", flex: 1 }}>Stashes</div>
        <div onClick={() => setModal("stash")} className="gs-lift" style={{ padding: "7px 14px", borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          + Guardar stash
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>A carregar…</div>
      ) : error ? (
        <div style={{ color: "var(--ddT)", fontSize: 13 }}>{errMsg(error, "não foi possível ler os stashes")}</div>
      ) : stashes.length === 0 ? (
        <div style={{ maxWidth: 620, border: "1px dashed var(--btnB)", borderRadius: 12, padding: "28px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
          Sem stashes. Use "Guardar stash" ou o botão Stash na barra inferior para guardar alterações em curso.
        </div>
      ) : (
        stashes.map((s) => (
          <div key={s.index} style={{ maxWidth: 620, border: "1px solid var(--border)", borderRadius: 12, background: "var(--panel)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--l1)", transform: "rotate(45deg)" }} />
              <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{s.message}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.relative_date}</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 12, color: "var(--text2)" }}>stash@{`{${s.index}}`}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <div
                onClick={() =>
                  apply.mutate(s.index, {
                    onSuccess: () => toast("Stash aplicado"),
                    onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível aplicar", "error"),
                  })
                }
                className="gs-press"
                style={{ padding: "7px 14px", borderRadius: 8, background: "var(--accent)", color: "var(--accentT)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Aplicar
              </div>
              <div
                onClick={() => setConfirmDrop(s.index)}
                className="gs-lift"
                style={{ padding: "7px 14px", borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--ddT)", fontSize: 13, cursor: "pointer" }}
              >
                Descartar
              </div>
            </div>
          </div>
        ))
      )}

      {confirmDrop !== null && (
        <ConfirmDialog
          message={`Descartar o stash stash@{${confirmDrop}}? O conteúdo guardado perde-se definitivamente.`}
          onCancel={() => setConfirmDrop(null)}
          onConfirm={() => {
            const idx = confirmDrop;
            setConfirmDrop(null);
            drop.mutate(idx, {
              onSuccess: () => toast("Stash descartado"),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível descartar", "error"),
            });
          }}
        />
      )}
    </div>
  );
}
