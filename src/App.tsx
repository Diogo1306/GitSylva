import { Suspense, lazy, useEffect } from "react";
import { useAppStore } from "./state/appStore";
import { useOnboardStore } from "./state/onboardStore";
import { useApplyTheme } from "./theme/useApplyTheme";
import { OpenRepo } from "./features/repo/OpenRepo";
import { AppShell } from "./features/shell/AppShell";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Notifications } from "./components/Notifications";

// Onboarding is first-run only, so it ships as its own chunk.
const Onboarding = lazy(() => import("./features/onboarding/Onboarding").then((m) => ({ default: m.Onboarding })));

function Root() {
  const onboarded = useOnboardStore((s) => s.onboarded);
  const repo = useAppStore((s) => s.repo);

  if (!onboarded)
    return (
      <Suspense fallback={<div style={{ height: "100%", background: "var(--desk)" }} />}>
        <Onboarding />
      </Suspense>
    );
  if (!repo) return <OpenRepo />;
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
    </ErrorBoundary>
  );
}
