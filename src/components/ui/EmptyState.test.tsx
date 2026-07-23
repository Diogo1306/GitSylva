import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

afterEach(cleanup);

describe("EmptyState", () => {
  it("renders the message", () => {
    render(<EmptyState>Sem stashes.</EmptyState>);
    expect(screen.getByText("Sem stashes.")).toBeTruthy();
  });

  it("renders an optional icon", () => {
    render(<EmptyState icon={<span data-testid="icon">*</span>}>Vazio</EmptyState>);
    expect(screen.getByTestId("icon")).toBeTruthy();
  });

  it("renders no action button when actionLabel/onAction are omitted", () => {
    render(<EmptyState>Vazio</EmptyState>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders an action button and fires onAction on click", () => {
    const onAction = vi.fn();
    render(
      <EmptyState actionLabel="Criar stash" onAction={onAction}>
        Sem stashes.
      </EmptyState>,
    );
    const btn = screen.getByRole("button", { name: "Criar stash" });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
