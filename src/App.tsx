import { useAppStore } from "./state/appStore";
import { OpenRepo } from "./features/repo/OpenRepo";

export default function App() {
  const repo = useAppStore((s) => s.repo);
  if (!repo) return <OpenRepo />;
  return (
    <div style={{ padding: 24 }}>
      <div>Repo: {repo.path}</div>
      <div>Branch: {repo.current_branch}</div>
    </div>
  );
}
