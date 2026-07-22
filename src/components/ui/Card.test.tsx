import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Card } from "./Card";

afterEach(cleanup);

describe("Card", () => {
  it("renders its children inside a bordered, rounded panel", () => {
    render(<Card>WIP em main</Card>);
    const panel = screen.getByText("WIP em main");
    expect(panel.style.border).toBe("1px solid var(--border)");
    expect(panel.style.borderRadius).toBe("var(--r-card)");
    expect(panel.style.background).toBe("var(--panel)");
  });

  it("defaults padding to 18 and lets callers override it", () => {
    const { rerender } = render(<Card>A</Card>);
    expect(screen.getByText("A").style.padding).toBe("18px");
    rerender(<Card pad={10}>A</Card>);
    expect(screen.getByText("A").style.padding).toBe("10px");
  });
});
