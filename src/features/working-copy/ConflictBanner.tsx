import { useAppStore } from "../../state/appStore";
import { useConflictState, useConflictActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { Button } from "../../components/ui/Button";
import type { ConflictKind } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";

const KIND_LABEL: Record<ConflictKind, string> = {
  merge: "Merge",
  rebase: "Rebase",
  "cherry-pick": "Cherry-pick",
  revert: "Revert",
};

// Shown while a merge/rebase/cherry-pick/revert is in progress, or when there
// are bare conflicts (e.g. a conflicting stash apply). Lets the user pick a
// side per file (or mark it resolved after an external edit), then continue or
// abort the operation when there is one.
export function ConflictBanner() {
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useConflictState(repo.path);
  const actions = useConflictActions(repo.path);

  if (!data) return null;
  const kind: ConflictKind | null = data.in_rebase
    ? "rebase"
    : data.in_merge
      ? "merge"
      : data.in_cherry_pick
        ? "cherry-pick"
        : data.in_revert
          ? "revert"
          : null;
  if (!kind && data.files.length === 0) return null;
  const remaining = data.files.length;

  const smallBtn = { padding: "3px 9px", fontSize: 11.5 } as const;
  // One resolution at a time, and a failure (e.g. file deleted meanwhile)
  // must reach the user instead of dying silently.
  const resolving = actions.resolve.isPending || actions.markResolved.isPending;
  const resolveOpts = {
    onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível resolver o ficheiro", "error"),
  };

  return (
    <div style={{ margin: 12, border: "1px solid var(--ddT)", borderRadius: 12, background: "var(--ddB)", padding: 14, display: "flex", flexDirection: "column", gap: 10, animation: "popIn 0.2s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ddT)", flex: 1 }}>
          {kind ? `${KIND_LABEL[kind]} com conflitos` : "Conflitos por resolver"} · {remaining} por resolver
        </span>
        {kind && (
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              remaining === 0 &&
              actions.continue.mutate(kind, { onSuccess: () => toast(`${KIND_LABEL[kind]} concluído`), onError: (e: unknown) => toast((e as { message?: string })?.message ?? "ainda há conflitos", "error") })
            }
            style={remaining > 0 ? { opacity: 0.5, cursor: "default" } : undefined}
          >
            Continuar
          </Button>
        )}
        {kind && (
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              !actions.abort.isPending &&
              actions.abort.mutate(kind, {
                onSuccess: () => toast("Operação abortada"),
                onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível abortar", "error"),
              })
            }
          >
            {actions.abort.isPending ? "A abortar…" : "Abortar"}
          </Button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.files.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 8, background: "var(--panel)" }}>
            <span style={{ flex: 1, fontFamily: mono, fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}>{f}</span>
            <Button size="sm" style={smallBtn} onClick={() => !resolving && actions.resolve.mutate({ file: f, side: "ours" }, resolveOpts)}>Usar meu</Button>
            <Button size="sm" style={smallBtn} onClick={() => !resolving && actions.resolve.mutate({ file: f, side: "theirs" }, resolveOpts)}>Usar deles</Button>
            <Button size="sm" style={smallBtn} onClick={() => !resolving && actions.markResolved.mutate(f, resolveOpts)}>Resolvido</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
