import { useAppStore } from "../../state/appStore";
import { useStatus, useSyncStatus } from "../../state/queries";
import { Toolbar, ToolbarButton } from "../../components/ui/Toolbar";
import { Badge } from "../../components/ui/misc";
import { useBreakpoint } from "../../lib/useBreakpoint";

const mono = "'JetBrains Mono', monospace";

function Divider() {
  return <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />;
}

// A real toolbar button, styled to match the original pill look. Called as a
// plain function (not <ActionButton/>) so the element it returns — a real
// <ToolbarButton> — is a DIRECT child of <Toolbar>: that's what lets Toolbar
// recognize it and manage its roving tabindex/arrow-key slot (it only
// inspects its immediate children's element type).
function actionButton({
  key,
  label,
  onClick,
  soon,
  badge,
  badgeAccent,
}: {
  key: string;
  label: string;
  onClick?: () => void;
  // Dimmed but still clickable: the feature is planned and shows a toast.
  soon?: boolean;
  badge?: number | null;
  badgeAccent?: boolean;
}) {
  return (
    <ToolbarButton
      key={key}
      onClick={onClick}
      aria-label={label}
      title={soon ? `${label} · em breve` : label}
      style={{
        width: "auto",
        height: "auto",
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
        whiteSpace: "nowrap",
        opacity: soon ? 0.6 : 1,
      }}
    >
      {label}
      {badge != null && badge > 0 && <Badge accent={badgeAccent}>{badge}</Badge>}
    </ToolbarButton>
  );
}

export function ActionBar() {
  const repo = useAppStore((s) => s.repo)!;
  const setView = useAppStore((s) => s.setView);
  const setModal = useAppStore((s) => s.setModal);
  const { data } = useStatus(repo.path);
  const { data: syncData } = useSyncStatus(repo.path);
  const bp = useBreakpoint();

  const files = data ?? [];
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?").length;
  const repoName = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? repo.path;
  const ahead = syncData?.ahead ?? 0;
  const behind = syncData?.behind ?? 0;

  return (
    <Toolbar
      ariaLabel="Ações"
      style={{
        height: 54,
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        background: "var(--panel)",
        alignItems: "center",
        gap: 6,
        padding: "0 14px",
        // Narrow windows scroll the bar instead of clipping actions away.
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "thin",
      }}
    >
      {actionButton({ key: "commit", label: "Commit", onClick: () => setView("working"), badge: staged, badgeAccent: true })}
      <Divider />
      {actionButton({ key: "pull", label: "↓ Pull", onClick: () => setModal("pull"), badge: behind })}
      {actionButton({ key: "push", label: "↑ Push", onClick: () => setModal("push"), badge: ahead, badgeAccent: true })}
      <Divider />
      {actionButton({ key: "branch", label: "Branch", onClick: () => setModal("branch") })}
      {actionButton({ key: "merge", label: "Merge", onClick: () => setModal("merge") })}
      {actionButton({ key: "stash", label: "Stash", onClick: () => setModal("stash") })}
      {actionButton({ key: "tag", label: "Tag", onClick: () => setModal("tag") })}
      <div style={{ flex: 1 }} />
      {/* Task 6 progressive disclosure: this duplicates context already
          visible in the Sidebar/Titlebar — hide it first at narrow widths so
          the primary action buttons above get the room instead. */}
      {!bp.hideSecondary && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: mono, fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
          <span>
            {repoName}
            <span style={{ color: "var(--muted)" }}> / </span>
            <span style={{ color: "var(--l0)", fontWeight: 600 }}>{repo.current_branch}</span>
          </span>
          <span title="commits por enviar">↑{ahead}</span>
          <span title="commits por integrar">↓{behind}</span>
        </div>
      )}
    </Toolbar>
  );
}
