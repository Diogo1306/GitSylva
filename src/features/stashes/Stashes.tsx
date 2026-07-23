import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStashes, useStashFiles, useStashActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { errMsg } from "../../lib/errors";
import { useT } from "../../i18n";

// V2: action buttons on this screen (header CTA, apply/pop/discard) are 36px tall.
const H36 = { height: 36 } as const;

// The design's card meta line: "{n} arquivos · a, b, …".
function StashMeta({ path, index }: { path: string; index: number }) {
  const t = useT();
  const { data } = useStashFiles(path, index);
  if (!data || data.length === 0) return null;
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {t("stashes.filesCount", { count: data.length })} · {data.slice(0, 3).join(", ")}
      {data.length > 3 ? "…" : ""}
    </div>
  );
}

export function Stashes() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const setModal = useAppStore((s) => s.setModal);
  const { data, isLoading, error } = useStashes(repo.path);
  const { apply, pop, drop } = useStashActions(repo.path);
  const [confirmDrop, setConfirmDrop] = useState<number | null>(null);
  const stashes = data ?? [];
  // One stash mutation at a time: indices shift after pop/drop, so a second
  // click mid-flight could hit the wrong stash.
  const busy = apply.isPending || pop.isPending || drop.isPending;

  return (
    <div style={{ flex: 1, padding: "var(--sp-10)", display: "flex", flexDirection: "column", gap: "var(--sp-6)", overflowY: "auto", animation: "fadeUp 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)", maxWidth: 620 }}>
        <div style={{ fontSize: "var(--fs-lg)", fontWeight: "var(--fw-semibold)", color: "var(--text)", flex: 1 }}>{t("shell.nav.stashes")}</div>
        <Button variant="primary" style={H36} onClick={() => setModal("stash")}>{t("stashes.createStash")}</Button>
      </div>

      {isLoading ? (
        <div style={{ color: "var(--muted)", fontSize: "var(--fs-sm)" }}>{t("common.loading")}</div>
      ) : error ? (
        <div style={{ color: "var(--ddT)", fontSize: "var(--fs-sm)" }}>{errMsg(error, t("stashes.readError"))}</div>
      ) : stashes.length === 0 ? (
        <div style={{ maxWidth: 620 }}>
          <EmptyState actionLabel={t("stashes.emptyAction")} onAction={() => setModal("stash")}>{t("stashes.empty")}</EmptyState>
        </div>
      ) : (
        stashes.map((s) => (
          <Card key={s.index} style={{ maxWidth: 620, padding: "18px 20px", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: "var(--l1)", transform: "rotate(45deg)" }} />
              <span style={{ fontSize: "var(--fs-md)", fontWeight: "var(--fw-semibold)", flex: 1 }}>{s.message}</span>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>{s.relative_date}</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-xs)", color: "var(--text2)" }}>stash@{`{${s.index}}`}</div>
            <StashMeta path={repo.path} index={s.index} />
            <div style={{ display: "flex", gap: "var(--sp-3)", marginTop: "var(--sp-1)" }}>
              <Button
                variant="primary"
                style={H36}
                disabled={busy}
                onClick={() =>
                  apply.mutate(s.index, {
                    onSuccess: () => toast(t("stashes.applied")),
                    onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("stashes.applyError"), "error"),
                  })
                }
              >
                {apply.isPending ? t("stashes.applying") : t("stashes.apply")}
              </Button>
              <Button
                variant="secondary"
                style={H36}
                disabled={busy}
                title={t("stashes.popTitle")}
                onClick={() =>
                  pop.mutate(s.index, {
                    onSuccess: () => toast(t("stashes.poppedDone")),
                    onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("stashes.popError"), "error"),
                  })
                }
              >
                {pop.isPending ? t("stashes.applying") : t("stashes.applyRemove")}
              </Button>
              <Button variant="secondary" style={H36} onClick={() => setConfirmDrop(s.index)}>
                {t("stashes.discard")}
              </Button>
            </div>
          </Card>
        ))
      )}

      {confirmDrop !== null && (
        <ConfirmDialog
          message={t("stashes.dropConfirm", { index: confirmDrop })}
          onCancel={() => setConfirmDrop(null)}
          onConfirm={() => {
            const idx = confirmDrop;
            setConfirmDrop(null);
            drop.mutate(idx, {
              onSuccess: () => toast(t("stashes.dropped")),
              onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("stashes.dropError"), "error"),
            });
          }}
        />
      )}
    </div>
  );
}
