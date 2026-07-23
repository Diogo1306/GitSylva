import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Accounts } from "./Accounts";
import { useToastStore } from "../../../state/toastStore";

// Checklist §12 "Contas & Acesso": rows for GitHub/GitLab/Bitbucket, all shown
// as not-connected (no OAuth backend yet), Connect is a clear soon-stub — it
// must never look or behave like a real login.

afterEach(() => {
  cleanup();
  useToastStore.setState({ toasts: [] });
});

describe("Accounts: renders one row per provider, all not connected", () => {
  it.each(["GitHub", "GitLab", "Bitbucket"])("shows %s with its own Connect button", (provider) => {
    render(<Accounts />);
    expect(screen.getByText(provider)).toBeTruthy();
    expect(screen.getByRole("button", { name: `Ligar conta ${provider}` })).toBeTruthy();
  });

  it("every row starts as not connected — three rows, three 'Não ligado' labels", () => {
    render(<Accounts />);
    expect(screen.getAllByText("Não ligado")).toHaveLength(3);
  });
});

describe("Accounts: Connect is a stub, not a fake login", () => {
  it("clicking Connect does not claim any account got linked — it only toasts the soon message", () => {
    render(<Accounts />);
    fireEvent.click(screen.getByRole("button", { name: "Ligar conta GitHub" }));
    expect(useToastStore.getState().toasts.some((t) => t.text === "Ligar contas chega numa fase futura")).toBe(true);
    // Still "Não ligado" afterwards — nothing pretends to have authenticated.
    expect(screen.getAllByText("Não ligado")).toHaveLength(3);
  });

  it("every Connect control is a real, keyboard-focusable <button>", () => {
    render(<Accounts />);
    for (const provider of ["GitHub", "GitLab", "Bitbucket"]) {
      const btn = screen.getByRole("button", { name: `Ligar conta ${provider}` });
      expect(btn.tagName).toBe("BUTTON");
    }
  });
});
