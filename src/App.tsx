import { Button } from "./components/Button";

// Temporary theme check. Confirms the Batman tokens and the Space Grotesk font
// are applied. This screen is replaced when the real UI arrives.
export default function App() {
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", display: "grid", gap: 16 }}>
        <h1 style={{ fontSize: 40, fontWeight: 600, margin: 0 }}>GitSylva</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Theme check. Dark background, light text, Space Grotesk font.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
    </div>
  );
}
