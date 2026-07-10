import { useAppStore } from "../../state/appStore";
import { useStatus, useSyncStatus, useSyncActions } from "../../state/queries";
import { toast } from "../../state/toastStore";

const mono = "'JetBrains Mono', monospace";

function Divider() {
  return <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />;
}

function Btn({
  label,
  onClick,
  soon,
  badge,
  badgeAccent,
}: {
  label: string;
  onClick?: () => void;
  // Dimmed but still clickable: the feature is planned and shows a toast.
  soon?: boolean;
  badge?: number | null;
  badgeAccent?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      title={soon ? `${label} · em breve` : label}
      className="gs-lift"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 13px",
        borderRadius: 8,
        background: "var(--btn)",
        border: "1px solid var(--btnB)",
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--btnT)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        opacity: soon ? 0.6 : 1,
      }}
    >
      {label}
      {badge != null && badge > 0 && (
        <span
          style={{
            background: badgeAccent ? "var(--accent)" : "var(--badge)",
            color: badgeAccent ? "var(--accentT)" : "var(--badgeT)",
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "1px 6px",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function ActionBar() {
  const repo = useAppStore((s) => s.repo)!;
  const setView = useAppStore((s) => s.setView);
  const setModal = useAppStore((s) => s.setModal);
  const { data } = useStatus(repo.path);
  const { data: syncData } = useSyncStatus(repo.path);
  const sync = useSyncActions(repo.path);

  const files = data ?? [];
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?").length;
  const repoName = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? repo.path;
  const ahead = syncData?.ahead ?? 0;
  const behind = syncData?.behind ?? 0;

  function doPull() {
    sync.pull.mutate(undefined, {
      onSuccess: () => toast("Pull concluído"),
      onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível fazer pull"),
    });
  }
  function doPush() {
    sync.push.mutate(undefined, {
      onSuccess: () => toast("Push concluído"),
      onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível fazer push"),
    });
  }

  return (
    <div
      style={{
        height: 54,
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        background: "var(--panel)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 14px",
      }}
    >
      <Btn label="Commit" onClick={() => setView("working")} badge={staged} badgeAccent />
      <Divider />
      <Btn label={sync.pull.isPending ? "↓ …" : "↓ Pull"} onClick={doPull} badge={behind} />
      <Btn label={sync.push.isPending ? "↑ …" : "↑ Push"} onClick={doPush} badge={ahead} badgeAccent />
      <Divider />
      <Btn label="Branch" onClick={() => setModal("branch")} />
      <Btn label="Merge" onClick={() => setModal("merge")} />
      <Btn label="Stash" onClick={() => setModal("stash")} />
      <Btn label="Tag" onClick={() => setModal("tag")} />
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: mono, fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
        <span>
          {repoName}
          <span style={{ color: "var(--muted)" }}> / </span>
          <span style={{ color: "var(--l0)", fontWeight: 600 }}>{repo.current_branch}</span>
        </span>
        <span title="commits por enviar">↑{ahead}</span>
        <span title="commits por integrar">↓{behind}</span>
      </div>
    </div>
  );
}
