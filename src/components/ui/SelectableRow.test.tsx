import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { SelectableRow, SelectableCard } from "./SelectableRow";

afterEach(cleanup);

describe("SelectableRow", () => {
  it("is a real focusable element with role=button by default", () => {
    render(
      <SelectableRow onSelect={() => {}}>
        Feature branch
      </SelectableRow>,
    );
    const row = screen.getByRole("button", { name: "Feature branch" });
    expect(row.tabIndex).toBe(0);
  });

  it("activates onSelect on Enter and on Space", () => {
    const onSelect = vi.fn();
    render(<SelectableRow onSelect={onSelect}>Row</SelectableRow>);
    const row = screen.getByRole("button", { name: "Row" });
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(row, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it("activates onSelect on click", () => {
    const onSelect = vi.fn();
    render(<SelectableRow onSelect={onSelect}>Row</SelectableRow>);
    fireEvent.click(screen.getByRole("button", { name: "Row" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("ignores Enter/Space and click when disabled", () => {
    const onSelect = vi.fn();
    render(
      <SelectableRow onSelect={onSelect} disabled>
        Row
      </SelectableRow>,
    );
    const row = screen.getByRole("button", { name: "Row" });
    expect(row.tabIndex).toBe(-1);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.click(row);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("uses role=option with aria-selected in a listbox context", () => {
    render(
      <div role="listbox">
        <SelectableRow role="option" selected onSelect={() => {}}>
          main
        </SelectableRow>
        <SelectableRow role="option" onSelect={() => {}}>
          develop
        </SelectableRow>
      </div>,
    );
    const main = screen.getByRole("option", { name: "main" });
    const develop = screen.getByRole("option", { name: "develop" });
    expect(main.getAttribute("aria-selected")).toBe("true");
    expect(develop.getAttribute("aria-selected")).toBe("false");
  });

  it("does not set aria-selected for the default button role", () => {
    render(
      <SelectableRow selected onSelect={() => {}}>
        Row
      </SelectableRow>,
    );
    expect(screen.getByRole("button", { name: "Row" }).getAttribute("aria-selected")).toBeNull();
  });
});

describe("SelectableCard", () => {
  it("renders a focusable role=button card that activates on Enter", () => {
    const onSelect = vi.fn();
    render(
      <SelectableCard onSelect={onSelect} selected>
        Escuro
      </SelectableCard>,
    );
    const card = screen.getByRole("button", { name: "Escuro" });
    expect(card.tabIndex).toBe(0);
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
