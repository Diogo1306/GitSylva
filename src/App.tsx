import { useAppStore } from "./state/appStore";
import { useApplyTheme } from "./theme/useApplyTheme";
import { OpenRepo } from "./features/repo/OpenRepo";
import { AppShell } from "./features/shell/AppShell";

export default function App() {
  useApplyTheme();
  const repo = useAppStore((s) => s.repo);
  if (!repo) return <OpenRepo />;
  return <AppShell />;
}
