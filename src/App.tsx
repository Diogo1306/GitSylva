import { Suspense, lazy } from "react";
import { useAppStore } from "./state/appStore";
import { useOnboardStore } from "./state/onboardStore";
import { useApplyTheme } from "./theme/useApplyTheme";
import { OpenRepo } from "./features/repo/OpenRepo";
import { AppShell } from "./features/shell/AppShell";

// Onboarding is first-run only, so it ships as its own chunk.
const Onboarding = lazy(() => import("./features/onboarding/Onboarding").then((m) => ({ default: m.Onboarding })));

export default function App() {
  useApplyTheme();
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
