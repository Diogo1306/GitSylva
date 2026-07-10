import { useAppStore } from "./state/appStore";
import { useOnboardStore } from "./state/onboardStore";
import { useApplyTheme } from "./theme/useApplyTheme";
import { OpenRepo } from "./features/repo/OpenRepo";
import { AppShell } from "./features/shell/AppShell";
import { Onboarding } from "./features/onboarding/Onboarding";

export default function App() {
  useApplyTheme();
  const onboarded = useOnboardStore((s) => s.onboarded);
  const repo = useAppStore((s) => s.repo);

  if (!onboarded) return <Onboarding />;
  if (!repo) return <OpenRepo />;
  return <AppShell />;
}
