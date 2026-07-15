import { useNotificationStore, type NotifKind } from "../state/notificationStore";
import { useToastStore, type ToastKind } from "../state/toastStore";
import { useThemeStore } from "../state/themeStore";

// One notification corner for everything (user request R5): notification
// cards AND quick toasts share the same stack at the bottom right, with the
// same card look and the same in/out motion. Toasts are click-to-dismiss;
// notifications keep ✕ and hover-pauses-the-timer.

const DOT: Record<NotifKind, string> = {
  success: "var(--leaf)",
  info: "var(--l1)",
  warning: "var(--stMT)",
  error: "var(--ddT)",
};

const TOAST_DOT: Record<ToastKind, string> = {
  info: "var(--accent)",
  success: "var(--daT)",
  error: "var(--ddT)",
};

// Card chrome shared by both kinds so the stack reads as one system.
function cardStyle(error: boolean, exiting: boolean, exitMs: number): React.CSSProperties {
  return {
    position: "relative",
    width: 310,
    boxSizing: "border-box",
    background: "var(--win)",
    border: `1px solid ${error ? "var(--ddT)" : "var(--border)"}`,
    borderRadius: 12,
    boxShadow: "var(--shadow-1)",
    padding: "13px 15px",
    display: "flex",
    gap: 11,
    alignItems: "flex-start",
    fontFamily: "var(--font)",
    animation: exiting
      ? `notifOut ${exitMs}ms var(--ease-standard) both`
      : "notifIn 300ms var(--ease-pop) both",
  };
}

// Small vine flourish hugging the card corner (animation spec §Toast),
// decorative and gated by the anims preference.
export function Vine({ treeStyle }: { treeStyle: string }) {
  // Static flourish — one curved stem plus a leaf/blossom, no animation loops.
  return (
    <svg
      width={34}
      height={30}
      viewBox="0 0 34 30"
      aria-hidden
      style={{ position: "absolute", top: -10, left: -8, pointerEvents: "none" }}
    >
      <path d="M4 28 C8 18 10 12 20 6" fill="none" stroke="var(--leaf)" strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
      {treeStyle === "sakura" ? (
        <g>
          {[0, 1, 2, 3, 4].map((a) => {
            const ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
            return <circle key={a} cx={22 + Math.cos(ang) * 2.6} cy={5 + Math.sin(ang) * 2.6} r={1.7} fill="var(--leaf)" />;
          })}
          <circle cx={22} cy={5} r={1.1} fill="var(--win)" />
        </g>
      ) : treeStyle === "grafo" ? (
        <circle cx={22} cy={5} r={2.6} fill="var(--win)" stroke="var(--l0)" strokeWidth={1.6} />
      ) : (
        <path d="M20 6 q6 -4 10 -2 q-4 6 -10 2 z" fill="var(--leaf)" />
      )}
    </svg>
  );
}

export function Notifications() {
  const notifications = useNotificationStore((s) => s.notifications);
  const dismiss = useNotificationStore((s) => s.dismiss);
  const pause = useNotificationStore((s) => s.pause);
  const resume = useNotificationStore((s) => s.resume);
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismiss);
  const anims = useThemeStore((s) => s.anims);
  const treeStyle = useThemeStore((s) => s.treeStyle);

  if (notifications.length === 0 && toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      style={{ position: "fixed", bottom: 16, right: 16, zIndex: 80, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}
    >
      {notifications.map((n) => (
        <div
          key={`n${n.id}`}
          role={n.kind === "error" ? "alert" : "status"}
          onMouseEnter={() => pause(n.id)}
          onMouseLeave={() => resume(n.id)}
          style={cardStyle(n.kind === "error", n.exiting, 340)}
        >
          {anims && <Vine treeStyle={treeStyle} />}
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: DOT[n.kind], marginTop: 4, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>{n.title}</div>
            {n.sub && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.4, overflowWrap: "break-word" }}>{n.sub}</div>
            )}
          </div>
          <button
            onClick={() => dismiss(n.id)}
            aria-label="Fechar notificação"
            style={{ width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", background: "transparent", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}
            className="gs-row"
          >
            ✕
          </button>
        </div>
      ))}
      {toasts.map((t) => (
        <div
          key={`t${t.id}`}
          onClick={() => dismissToast(t.id)}
          title="Fechar"
          role={t.kind === "error" ? "alert" : "status"}
          // The store removes the toast 220ms after dismiss — the exit must
          // not outlive that window.
          style={{ ...cardStyle(t.kind === "error", t.exiting, 200), cursor: "pointer" }}
        >
          {anims && <Vine treeStyle={treeStyle} />}
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: TOAST_DOT[t.kind], marginTop: 4, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
            {t.text}
          </span>
        </div>
      ))}
    </div>
  );
}
