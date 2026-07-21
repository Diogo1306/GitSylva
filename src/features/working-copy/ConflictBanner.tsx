import { useAppStore } from "../../state/appStore";
import { useConflictState, useConflictActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { Button } from "../../components/ui/Button";
import { useT } from "../../i18n";
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
  const t = useT();
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
    onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("workingCopy.conflict.resolveError"), "error"),
  };

  return (
    <div style={{ margin: 12, border: "1px solid var(--ddT)", borderRadius: 12, background: "var(--ddB)", padding: 14, display: "flex", flexDirection: "column", gap: 10, animation: "popIn 0.2s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ddT)", flex: 1 }}>
          {kind ? t("workingCopy.conflict.withConflicts", { kind: KIND_LABEL[kind] }) : t("workingCopy.conflict.unresolved")} · {t("workingCopy.conflict.remaining", { count: remaining })}
        </span>
        {kind && (
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              remaining === 0 &&
              actions.continue.mutate(kind, { onSuccess: () => toast(t("workingCopy.conflict.continueDone", { kind: KIND_LABEL[kind] })), onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("workingCopy.conflict.stillConflicts"), "error") })
            }
            style={remaining > 0 ? { opacity: 0.5, cursor: "default" } : undefined}
          >
            {t("workingCopy.conflict.continue")}
          </Button>
        )}
        {kind && (
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              !actions.abort.isPending &&
              actions.abort.mutate(kind, {
                onSuccess: () => toast(t("workingCopy.conflict.aborted")),
                onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("workingCopy.conflict.abortError"), "error"),
              })
            }
          >
            {actions.abort.isPending ? t("workingCopy.conflict.aborting") : t("workingCopy.conflict.abort")}
          </Button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {data.files.map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 8, background: "var(--panel)" }}>
            <span style={{ flex: 1, fontFamily: mono, fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}>{f}</span>
            <Button size="sm" style={smallBtn} onClick={() => !resolving && actions.resolve.mutate({ file: f, side: "ours" }, resolveOpts)}>{t("workingCopy.conflict.useOurs")}</Button>
            <Button size="sm" style={smallBtn} onClick={() => !resolving && actions.resolve.mutate({ file: f, side: "theirs" }, resolveOpts)}>{t("workingCopy.conflict.useTheirs")}</Button>
            <Button size="sm" style={smallBtn} onClick={() => !resolving && actions.markResolved.mutate(f, resolveOpts)}>{t("workingCopy.conflict.resolved")}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
