import type { ReactNode } from "react";
import { Button } from "./Button";

type EmptyStateProps = {
  icon?: ReactNode;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

// Dashed placeholder for empty lists (no stashes, clean working copy).
export function EmptyState({ icon, children, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      style={{
        border: "1px dashed var(--btnB)",
        borderRadius: "var(--r-card)",
        padding: "28px 20px",
        textAlign: "center",
        color: "var(--muted)",
        fontSize: "var(--fs-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--sp-2)",
      }}
    >
      {icon}
      <div>{children}</div>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} style={{ marginTop: "var(--sp-2)" }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
