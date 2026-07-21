import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStashes, useStashFiles, useStashActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { errMsg } from "../../lib/errors";
import { comboHint } from "../../lib/platform";
import { useShortcutsStore } from "../../state/shortcutsStore";
import { useT } from "../../i18n";

const mono = "'JetBrains Mono', monospace";

// The design's card meta line: "{n} arquivos · a, b, …".
function StashMeta({ path, index }: { path: string; index: number }) {
  const t = useT();
  const { data } = useStashFiles(path, index);
  if (!data || data.length === 0) return null;
  return (
    <div style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
    <div style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", animation: "fadeUp 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", flex: 1 }}>Stashes</div>
        <div onClick={() => setModal("stash")} className="gs-lift" style={{ padding: "7px 14px", borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          + {t("stashes.saveStash")}
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>{t("common.loading")}</div>
      ) : error ? (
        <div style={{ color: "var(--ddT)", fontSize: 13 }}>{errMsg(error, t("stashes.readError"))}</div>
      ) : stashes.length === 0 ? (
        <div style={{ maxWidth: 620, border: "1px dashed var(--btnB)", borderRadius: 12, padding: "28px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13.5 }}>
          {t("stashes.empty", { combo: comboHint(useShortcutsStore.getState().bindings.stash) })}
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
            <StashMeta path={repo.path} index={s.index} />
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <div
                onClick={() =>
                  // apply/pop/drop on the same stash list are incompatible in
                  // flight — one at a time (double-click included).
                  !busy &&
                  apply.mutate(s.index, {
                    onSuccess: () => toast(t("stashes.applied")),
                    onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("stashes.applyError"), "error"),
                  })
                }
                className="gs-press"
                style={{ padding: "7px 14px", borderRadius: 8, background: "var(--accent)", color: "var(--accentT)", fontSize: 13, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}
              >
                {apply.isPending ? t("stashes.applying") : t("stashes.apply")}
              </div>
              <div
                onClick={() =>
                  !busy &&
                  pop.mutate(s.index, {
                    onSuccess: () => toast(t("stashes.poppedDone")),
                    onError: (e: unknown) => toast((e as { message?: string })?.message ?? t("stashes.popError"), "error"),
                  })
                }
                title={t("stashes.popTitle")}
                className="gs-lift"
                style={{ padding: "7px 14px", borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", fontSize: 13, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}
              >
                {pop.isPending ? t("stashes.applying") : t("stashes.applyRemove")}
              </div>
              <div
                onClick={() => setConfirmDrop(s.index)}
                className="gs-lift"
                style={{ padding: "7px 14px", borderRadius: 8, background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--ddT)", fontSize: 13, cursor: "pointer" }}
              >
                {t("stashes.discard")}
              </div>
            </div>
          </div>
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
