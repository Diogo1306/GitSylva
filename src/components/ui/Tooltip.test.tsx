import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Tooltip } from "./Tooltip";

afterEach(cleanup);

describe("Tooltip", () => {
  it("is not shown until hover or focus", () => {
    render(
      <Tooltip content="Preparar ficheiro">
        <button>+</button>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows on mouse hover and hides on mouse leave", () => {
    render(
      <Tooltip content="Preparar ficheiro">
        <button>+</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("+");
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole("tooltip").textContent).toContain("Preparar ficheiro");
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("shows on keyboard focus and hides on blur (not just native title)", () => {
    render(
      <Tooltip content="Preparar ficheiro">
        <button>+</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("+");
    expect(trigger.getAttribute("title")).toBeNull();
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeTruthy();
    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("links the trigger to the tooltip via aria-describedby while visible", () => {
    render(
      <Tooltip content="Preparar ficheiro">
        <button>+</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("+");
    fireEvent.focus(trigger);
    const tooltip = screen.getByRole("tooltip");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("renders a shortcut-hint slot alongside the content", () => {
    render(
      <Tooltip content="Preparar ficheiro" shortcut="Ctrl+S">
        <button>+</button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByText("+"));
    expect(screen.getByRole("tooltip").textContent).toContain("Ctrl+S");
  });
});
