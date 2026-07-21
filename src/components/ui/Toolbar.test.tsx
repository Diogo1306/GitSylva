import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Toolbar, ToolbarButton } from "./Toolbar";

afterEach(cleanup);

describe("Toolbar", () => {
  it("renders role=toolbar with real <button> children", () => {
    render(
      <Toolbar ariaLabel="Ações do commit">
        <ToolbarButton aria-label="Copiar">C</ToolbarButton>
        <ToolbarButton aria-label="Reverter">R</ToolbarButton>
      </Toolbar>,
    );
    const toolbar = screen.getByRole("toolbar", { name: "Ações do commit" });
    expect(toolbar).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copiar" }).tagName).toBe("BUTTON");
    expect(screen.getByRole("button", { name: "Reverter" }).tagName).toBe("BUTTON");
  });

  it("gives only one button roving tabindex 0 at a time", () => {
    render(
      <Toolbar ariaLabel="Ações">
        <ToolbarButton aria-label="Um">1</ToolbarButton>
        <ToolbarButton aria-label="Dois">2</ToolbarButton>
        <ToolbarButton aria-label="Três">3</ToolbarButton>
      </Toolbar>,
    );
    const [um, dois, tres] = [
      screen.getByRole("button", { name: "Um" }) as HTMLButtonElement,
      screen.getByRole("button", { name: "Dois" }) as HTMLButtonElement,
      screen.getByRole("button", { name: "Três" }) as HTMLButtonElement,
    ];
    expect(um.tabIndex).toBe(0);
    expect(dois.tabIndex).toBe(-1);
    expect(tres.tabIndex).toBe(-1);
  });

  it("ArrowRight/ArrowLeft roam focus between buttons and wrap", () => {
    render(
      <Toolbar ariaLabel="Ações">
        <ToolbarButton aria-label="Um">1</ToolbarButton>
        <ToolbarButton aria-label="Dois">2</ToolbarButton>
        <ToolbarButton aria-label="Três">3</ToolbarButton>
      </Toolbar>,
    );
    const um = screen.getByRole("button", { name: "Um" });
    const dois = screen.getByRole("button", { name: "Dois" });
    const tres = screen.getByRole("button", { name: "Três" });
    um.focus();
    fireEvent.keyDown(um, { key: "ArrowRight" });
    expect(document.activeElement).toBe(dois);
    fireEvent.keyDown(dois, { key: "ArrowRight" });
    expect(document.activeElement).toBe(tres);
    // Wraps back to the first button.
    fireEvent.keyDown(tres, { key: "ArrowRight" });
    expect(document.activeElement).toBe(um);
    fireEvent.keyDown(um, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(tres);
  });

  it("skips disabled buttons when roaming and when picking the initial tabbable one", () => {
    render(
      <Toolbar ariaLabel="Ações">
        <ToolbarButton aria-label="Um" disabled>
          1
        </ToolbarButton>
        <ToolbarButton aria-label="Dois">2</ToolbarButton>
        <ToolbarButton aria-label="Três" disabled>
          3
        </ToolbarButton>
        <ToolbarButton aria-label="Quatro">4</ToolbarButton>
      </Toolbar>,
    );
    const dois = screen.getByRole("button", { name: "Dois" }) as HTMLButtonElement;
    const quatro = screen.getByRole("button", { name: "Quatro" }) as HTMLButtonElement;
    // Disabled buttons can never be the initial roving-tabindex stop.
    expect(dois.tabIndex).toBe(0);
    dois.focus();
    fireEvent.keyDown(dois, { key: "ArrowRight" });
    expect(document.activeElement).toBe(quatro);
    fireEvent.keyDown(quatro, { key: "ArrowRight" });
    expect(document.activeElement).toBe(dois);
  });

  it("ArrowDown/ArrowUp roam focus in a vertical toolbar", () => {
    render(
      <Toolbar ariaLabel="Ações" orientation="vertical">
        <ToolbarButton aria-label="Um">1</ToolbarButton>
        <ToolbarButton aria-label="Dois">2</ToolbarButton>
      </Toolbar>,
    );
    const um = screen.getByRole("button", { name: "Um" });
    const dois = screen.getByRole("button", { name: "Dois" });
    um.focus();
    fireEvent.keyDown(um, { key: "ArrowDown" });
    expect(document.activeElement).toBe(dois);
  });

  it("leaves non-ToolbarButton children untouched and roves only real buttons", () => {
    render(
      <Toolbar ariaLabel="Ações">
        <ToolbarButton aria-label="Um">1</ToolbarButton>
        <span data-testid="divider" aria-hidden="true">
          |
        </span>
        <ToolbarButton aria-label="Dois">2</ToolbarButton>
      </Toolbar>,
    );
    const divider = screen.getByTestId("divider");
    // The passthrough child must not receive roving-tabindex/keydown props.
    expect(divider.getAttribute("tabindex")).toBeNull();
    expect(divider.hasAttribute("data-toolbar-item")).toBe(false);
    // Roving still walks button-to-button, ignoring the divider in between.
    const um = screen.getByRole("button", { name: "Um" });
    const dois = screen.getByRole("button", { name: "Dois" });
    expect((um as HTMLButtonElement).tabIndex).toBe(0);
    expect((dois as HTMLButtonElement).tabIndex).toBe(-1);
    um.focus();
    fireEvent.keyDown(um, { key: "ArrowRight" });
    expect(document.activeElement).toBe(dois);
  });
});

describe("ToolbarButton", () => {
  it("activates onClick via Enter and Space", () => {
    const onClick = vi.fn();
    render(<ToolbarButton onClick={onClick}>X</ToolbarButton>);
    const btn = screen.getByRole("button", { name: "X" });
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(btn, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("does not activate when disabled", () => {
    const onClick = vi.fn();
    render(
      <ToolbarButton onClick={onClick} disabled>
        X
      </ToolbarButton>,
    );
    const btn = screen.getByRole("button", { name: "X" }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps a visible focus ring (does not disable the outline inline)", () => {
    render(<ToolbarButton>X</ToolbarButton>);
    expect(screen.getByRole("button", { name: "X" }).style.outline).not.toBe("none");
  });
});
