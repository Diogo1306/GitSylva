import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Toggle, IconButton } from "./misc";

afterEach(cleanup);

describe("Toggle", () => {
  it("renders a real focusable button with aria-pressed reflecting state", () => {
    render(<Toggle on aria-label="Animações" onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "Animações" });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("reflects the off state", () => {
    render(<Toggle on={false} aria-label="Animações" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Animações" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("activates onClick on click and on Enter/Space", () => {
    const onClick = vi.fn();
    render(<Toggle on aria-label="Animações" onClick={onClick} />);
    const btn = screen.getByRole("button", { name: "Animações" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(btn, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("is part of natural tab order (no explicit tabIndex needed)", () => {
    render(<Toggle on aria-label="Animações" onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: "Animações" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

describe("IconButton", () => {
  it("renders a real button with an accessible name from the title prop", () => {
    render(
      <IconButton title="Fechar" onClick={() => {}}>
        X
      </IconButton>,
    );
    const btn = screen.getByRole("button", { name: "Fechar" });
    expect(btn.tagName).toBe("BUTTON");
  });

  it("activates onClick on click and on Enter/Space", () => {
    const onClick = vi.fn();
    render(
      <IconButton title="Fechar" onClick={onClick}>
        X
      </IconButton>,
    );
    const btn = screen.getByRole("button", { name: "Fechar" });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(btn, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(3);
  });
});
