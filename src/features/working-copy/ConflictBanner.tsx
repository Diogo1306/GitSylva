import { useAppStore } from "../../state/appStore";
import { useConflictState, useConflictActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { Button } from "../../components/ui/Button";

const mono = "'JetBrains Mono', monospace";

// Shown while a merge/rebase is in progress. Lets the user pick a side per file
// (or mark it resolved after an external edit), then continue or abort.
export function ConflictBanner() {
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useConflictState(repo.path);
  const actions = useConflictActions(repo.path);

  if (!data || (!data.in_merge && !data.in_rebase)) return null;
  const kind = data.in_rebase ? "rebase" : "merge";
  const remaining = data.files.length;

  const smallBtn = { padding: "3px 9px", fontSize: 11.5 } as const;

  return (
    <div style={{ margin: 12, border: "1px solid var(--ddT)", borderRadius: 12, background: "var(--ddB)", padding: 14, display: "flex", flexDirection: "column", gap: 10, animation: "popIn 0.2s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ddT)", flex: 1 }}>
          {kind === "rebase" ? "Rebase" : "Merge"} com conflitos · {remaining} por resolver
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            actions.continue.mutate(kind, { onSuccess: () => toast(`${kind === "rebase" ? "Rebase" : "Merge"} concluído`), onError: (e: unknown) => toast((e as { message?: string })?.message ?? "ainda há conflitos") })
          }
          style={remaining > 0 ? { opacity: 0.5, cursor: "default" } : undefined}
        >
          Continuar
        </Button>
        <Button variant="danger" size="sm" onClick={() => actions.abort.mutate(kind, { onSuccess: () => toast("Operação abortada") })}>
          Abortar
        </Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.files.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 8, background: "var(--panel)" }}>
            <span style={{ flex: 1, fontFamily: mono, fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}>{f}</span>
            <Button size="sm" style={smallBtn} onClick={() => actions.resolve.mutate({ file: f, side: "ours" })}>Usar meu</Button>
            <Button size="sm" style={smallBtn} onClick={() => actions.resolve.mutate({ file: f, side: "theirs" })}>Usar deles</Button>
            <Button size="sm" style={smallBtn} onClick={() => actions.markResolved.mutate(f)}>Resolvido</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
