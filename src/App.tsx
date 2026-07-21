import { Suspense, lazy, useEffect } from "react";
import { useAppStore } from "./state/appStore";
import { useOnboardStore } from "./state/onboardStore";
import { useApplyTheme } from "./theme/useApplyTheme";
import { AppShell } from "./features/shell/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Notifications } from "./components/Notifications";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { Wordmark } from "./components/Wordmark";
import { WinControls } from "./features/shell/Titlebar";

// Onboarding is first-run only, so it ships as its own chunk.
const Onboarding = lazy(() => import("./features/onboarding/Onboarding").then((m) => ({ default: m.Onboarding })));
// No repo open → the full repository screen (recents + add/clone/create), not
// a bare folder prompt (user request R5.5).
const RepoPicker = lazy(() => import("./features/repo/RepoPicker").then((m) => ({ default: m.RepoPicker })));

function Root() {
  const onboarded = useOnboardStore((s) => s.onboarded);
  const repo = useAppStore((s) => s.repo);

  if (!onboarded)
    return (
      <Suspense fallback={<div style={{ height: "100%", background: "var(--desk)" }} />}>
        <Onboarding />
      </Suspense>
    );
  if (!repo)
    return (
      <Suspense fallback={<div style={{ height: "100%", background: "var(--desk)" }} />}>
        {/* No repo yet: the picker still lives inside a NORMAL window frame —
            wordmark, drag strip and real window controls (R5.15; the bare
            full-screen version hid everything and couldn't even be closed). */}
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--win)", color: "var(--text)", overflow: "hidden" }}>
          <div
            data-tauri-drag-region
            style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", gap: 14, padding: "0 10px 0 16px", borderBottom: "1px solid var(--border)", background: "var(--panel)" }}
          >
            <div style={{ flexShrink: 0, pointerEvents: "none" }}>
              <Wordmark size={17} />
            </div>
            <div data-tauri-drag-region style={{ flex: 1, alignSelf: "stretch" }} />
            <WinControls />
          </div>
          <RepoPicker />
        </div>
      </Suspense>
    );
  return <AppShell />;
}

export default function App() {
  useApplyTheme();

  // Ambient loops (falling leaves, sway) pause while the window is blurred,
  // minimized or hidden — see the [data-win-hidden] rule in tokens.css.
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      if (document.hidden || !document.hasFocus()) root.setAttribute("data-win-hidden", "true");
      else root.removeAttribute("data-win-hidden");
    };
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Root />
      {/* App-level so toasts also show during onboarding and the repo picker
          (inside AppShell they only existed after a repo was open). */}
      <Notifications />
      <UpdatePrompt />
    </ErrorBoundary>
  );
}
