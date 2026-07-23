import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("renders the status letter as its content", () => {
    render(<StatusBadge status="A" />);
    expect(screen.getByText("A")).toBeTruthy();
  });

  it("defaults to M when no status is given", () => {
    render(<StatusBadge />);
    expect(screen.getByText("M")).toBeTruthy();
  });

  it.each([
    ["A", "var(--stAB)", "var(--stAT)"],
    ["M", "var(--stMB)", "var(--stMT)"],
    ["D", "var(--stDB)", "var(--stDT)"],
    ["U", "var(--stDB)", "var(--stDT)"],
  ] as const)("maps status %s to its theme tokens", (status, bg, color) => {
    render(<StatusBadge status={status} />);
    const el = screen.getByText(status);
    expect(el.style.background).toBe(bg);
    expect(el.style.color).toBe(color);
  });

  it("passes through an optional title for accessibility", () => {
    render(<StatusBadge status="D" title="Apagado" />);
    expect(screen.getByText("D").getAttribute("title")).toBe("Apagado");
  });
});
