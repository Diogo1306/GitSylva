import { pickFolder } from "../../lib/api";
import { useRecentsStore } from "../../state/recentsStore";
import { useOpenRepo } from "./useOpenRepo";
import { TreeLogo } from "../../components/TreeLogo";
import { FallingLeaves } from "../../components/FallingLeaves";
import { initials } from "../../lib/format";
import "../shell/shell.css";

// Welcome / front door. Shown when no repository is open. On-brand: the growing
// tree-S mark and wordmark over the theme's desk gradient, a clear open action,
// and a quick list of recent repositories.
export function OpenRepo() {
  const { open, busy, error } = useOpenRepo();
  const recents = useRecentsStore((s) => s.recents);

  async function handleOpen() {
    const path = await pickFolder();
    if (!path) return;
    await open(path);
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      <FallingLeaves />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
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

        {recents.length > 0 && (
          <div style={{ marginTop: 14, width: 380, textAlign: "left" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", padding: "0 4px 8px" }}>RECENTES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {recents.slice(0, 5).map((r) => (
                <div
                  key={r.path}
                  onClick={() => !busy && open(r.path)}
                  className="gs-row"
                  title={r.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "9px 12px",
                    borderRadius: 11,
                    border: "1px solid var(--border)",
                    background: "var(--panel)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--l0bg)", color: "var(--l0)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11.5, flexShrink: 0 }}>
                    {initials(r.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.branch} · {r.path}
                    </div>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: 14 }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
