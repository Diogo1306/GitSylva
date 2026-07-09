import { useState } from "react";
import { pickFolder, openRepo } from "../../lib/api";
import { useAppStore } from "../../state/appStore";
import { TreeLogo } from "../../components/TreeLogo";
import "../shell/shell.css";

// Welcome / front door. Shown when no repository is open. On-brand: the growing
// tree-S mark and wordmark over the theme's desk gradient, with a single clear
// action. Account sign-in and recents live behind a later onboarding phase.
export function OpenRepo() {
  const setRepo = useAppStore((s) => s.setRepo);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleOpen() {
    setError(null);
    const path = await pickFolder();
    if (!path) return;
    setBusy(true);
    try {
      const info = await openRepo(path);
      setRepo(info);
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "não foi possível abrir o repositório");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        placeItems: "center",
        background: "var(--desk)",
        padding: 32,
        boxSizing: "border-box",
        animation: "fadeIn 0.4s ease both",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
        <TreeLogo size={112} animated crop />
        <div style={{ display: "flex", alignItems: "baseline", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 30, letterSpacing: "0.4px" }}>
          <span>git</span>
          <span style={{ display: "inline-block", margin: "0 2px", transform: "translateY(4px)" }}>
            <TreeLogo size={26} crop xScale={1.22} />
          </span>
          <span>ylva</span>
        </div>
        <div style={{ color: "var(--text2)", fontSize: 14, maxWidth: 360, lineHeight: 1.5 }}>
          Um cliente Git de desktop onde o histórico é uma árvore viva. Abra um repositório para começar.
        </div>
        <div
          onClick={() => !busy && handleOpen()}
          className="gs-press"
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 11,
            background: "var(--accent)",
            color: "var(--accentT)",
            fontSize: 14,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "A abrir…" : "Abrir repositório"}
        </div>
        {error && <div style={{ color: "var(--ddT)", fontSize: 13, maxWidth: 380 }}>{error}</div>}
      </div>
    </div>
  );
}
