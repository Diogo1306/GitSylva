import { useToastStore } from "../state/toastStore";

// Bottom-centered toasts. Entrance animation is gated by the decorative-motion
// setting via the shared keyframes.
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div style={{ position: "fixed", bottom: 66, left: "50%", transform: "translateX(-50%)", zIndex: 80, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--win)",
            border: "1px solid var(--border)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            color: "var(--text)",
            whiteSpace: "nowrap",
            animation: "toastIn 0.25s cubic-bezier(0.2,0.9,0.3,1) both",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
