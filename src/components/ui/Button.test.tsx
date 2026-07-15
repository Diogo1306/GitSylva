import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label and fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);
    const btn = screen.getByText("Guardar");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("uses the accent background for the primary variant", () => {
    render(
      <Button variant="primary">
        <span>Commit</span>
      </Button>,
    );
    const btn = screen.getByText("Commit").closest("button")!;
    expect(btn.style.background).toContain("--accent");
  });
});
