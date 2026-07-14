import { useToastStore, type ToastKind } from "../state/toastStore";
import { useThemeStore } from "../state/themeStore";
import { Vine } from "./Notifications";

const DOT: Record<ToastKind, string> = {
  info: "var(--accent)",
  success: "var(--daT)",
  error: "var(--ddT)",
};

// Bottom-centered toasts. Click a toast to dismiss it; errors also stay longer.
// Announced politely to screen readers via aria-live. A small vine flourish
// hugs the corner (animation spec §Toast), gated by the anims preference.
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const anims = useThemeStore((s) => s.anims);
  const treeStyle = useThemeStore((s) => s.treeStyle);
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ position: "fixed", bottom: 66, left: "50%", transform: "translateX(-50%)", zIndex: 80, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          title="Fechar"
          role={t.kind === "error" ? "alert" : undefined}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "var(--win)",
            border: `1px solid ${t.kind === "error" ? "var(--ddT)" : "var(--border)"}`,
            boxShadow: "var(--shadow-1)",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            color: "var(--text)",
            maxWidth: 520,
            cursor: "pointer",
            animation: t.exiting
              ? "toastOut 220ms var(--ease-standard) both"
              : "toastIn var(--motion-normal) var(--ease-pop) both",
          }}
        >
          {anims && <Vine treeStyle={treeStyle} />}
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: DOT[t.kind], flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
