import { useAppStore } from "./state/appStore";
import { OpenRepo } from "./features/repo/OpenRepo";
import { WorkingCopy } from "./features/working-copy/WorkingCopy";

export default function App() {
  const repo = useAppStore((s) => s.repo);
  if (!repo) return <OpenRepo />;
  return <WorkingCopy />;
}
