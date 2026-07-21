import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { Onboarding } from "./Onboarding";
import { useThemeStore } from "../../state/themeStore";
import { useOnboardStore } from "../../state/onboardStore";

// Task 5: onboarding IA + keyboard pass.
// - "Continuar localmente" is the primary, first-in-tab-order CTA of the
//   login screen (replaces the old "continuar sem conta" text link).
// - GitHub/GitLab/Bitbucket move into a secondary, de-emphasized
//   "Integrações: em breve" group below the primary local path.
// - "Saltar" is removed: it produced the same reachable end state as
//   "Plantar e entrar" once the setup pickers are already live-applied, so a
//   second CTA was redundant (see task-5-report.md for the full rationale).
// - Every card/CTA is a real <button> or a Task-1 primitive (SelectableRow /
//   SelectableCard) — no bare <div onClick>. Choice groups also support
//   Left/Right arrow-key navigation between cards.

beforeEach(() => {
  // anims: false skips the timed splash screen so tests land straight on
  // "login" without racing a setTimeout.
  useThemeStore.getState().resetPrefs();
  useThemeStore.setState({ anims: false });
});

afterEach(() => {
  cleanup();
  useThemeStore.getState().resetPrefs();
  useOnboardStore.setState({ onboarded: false });
});

function renderOnboarding() {
  return render(<Onboarding />);
}

describe("Onboarding login screen: primary local action", () => {
  it("renders 'Continuar localmente' as a real, focusable button", () => {
    renderOnboarding();
    const btn = screen.getByRole("button", { name: "Continuar localmente" });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.tabIndex).not.toBe(-1);
  });

  it("places the primary CTA before the Integrações section in the DOM (tab order)", () => {
    renderOnboarding();
    const cta = screen.getByRole("button", { name: "Continuar localmente" });
    const github = screen.getByRole("button", { name: /GitHub/ });
    expect(cta.compareDocumentPosition(github) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("advances to the setup phase on click", () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: "Continuar localmente" }));
    expect(screen.getByText("Personaliza o teu jardim")).toBeTruthy();
  });
});

describe("Onboarding login screen: secondary integrations", () => {
  it("groups GitHub/GitLab/Bitbucket under a labeled 'em breve' section", () => {
    renderOnboarding();
    const group = screen.getByRole("group", { name: /Integrações.*em breve/i });
    expect(within(group).getByRole("button", { name: /GitHub/ })).toBeTruthy();
    expect(within(group).getByRole("button", { name: /GitLab/ })).toBeTruthy();
    expect(within(group).getByRole("button", { name: /Bitbucket/ })).toBeTruthy();
  });

  it("keeps every provider row keyboard-activatable (Enter) without advancing the phase", () => {
    renderOnboarding();
    const github = screen.getByRole("button", { name: /GitHub/ });
    github.focus();
    fireEvent.keyDown(github, { key: "Enter" });
    // Still on the login screen: unavailable providers don't move the flow.
    expect(screen.queryByText("Personaliza o teu jardim")).toBeNull();
  });

  it("still shows the Em breve affordance on each provider", () => {
    renderOnboarding();
    const group = screen.getByRole("group", { name: /Integrações.*em breve/i });
    expect(within(group).getAllByText("Em breve")).toHaveLength(3);
  });
});

describe("Onboarding: Saltar removal", () => {
  it("does not render a separate Saltar control", () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: "Continuar localmente" }));
    expect(screen.queryByText(/Saltar/)).toBeNull();
  });
});

describe("Onboarding setup phase: keyboard-operable choice cards", () => {
  function goToSetup() {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: "Continuar localmente" }));
  }

  it("theme cards activate via Enter and update the theme store", () => {
    goToSetup();
    const nipon = screen.getByRole("button", { name: /Nipon/ });
    nipon.focus();
    fireEvent.keyDown(nipon, { key: "Enter" });
    expect(useThemeStore.getState().theme).toBe("nipon");
  });

  it("tree-style pills activate via Space and update the theme store", () => {
    goToSetup();
    const sakura = screen.getByRole("button", { name: "Sakura" });
    sakura.focus();
    fireEvent.keyDown(sakura, { key: " " });
    expect(useThemeStore.getState().treeStyle).toBe("sakura");
  });

  it("repo-layout cards activate via Enter and update the theme store", () => {
    goToSetup();
    const sidebar = screen.getByRole("button", { name: "Barra lateral" });
    sidebar.focus();
    fireEvent.keyDown(sidebar, { key: "Enter" });
    expect(useThemeStore.getState().repoLayout).toBe("rail");
  });

  it("Right/Left arrow keys move focus between cards in the same group", () => {
    goToSetup();
    const group = screen.getByRole("group", { name: "Tema" });
    const cards = within(group).getAllByRole("button");
    cards[0].focus();
    fireEvent.keyDown(cards[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(cards[1]);
    fireEvent.keyDown(cards[1], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(cards[0]);
  });

  it("'Plantar e entrar' is a real button that advances to the grow phase", () => {
    goToSetup();
    const plantar = screen.getByRole("button", { name: "Plantar e entrar" });
    expect(plantar.tagName).toBe("BUTTON");
    fireEvent.click(plantar);
    expect(screen.getByText("A tua floresta está plantada")).toBeTruthy();
  });
});

describe("Onboarding grow phase: essential concepts", () => {
  it("mentions Cópia de trabalho, árvore de commits and Ctrl+K, and nothing else", () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: "Continuar localmente" }));
    fireEvent.click(screen.getByRole("button", { name: "Plantar e entrar" }));
    expect(screen.getByText(/Cópia de trabalho/)).toBeTruthy();
    expect(screen.getByText(/árvore de commits/)).toBeTruthy();
    expect(screen.getByText(/Ctrl\+K/)).toBeTruthy();
  });
});

describe("Onboarding: end-to-end keyboard-only completion", () => {
  it("completes login -> setup -> grow using only real buttons and Enter/Space on custom cards", () => {
    renderOnboarding();

    const cta = screen.getByRole("button", { name: "Continuar localmente" });
    expect(cta.tagName).toBe("BUTTON"); // native keyboard activation guaranteed
    fireEvent.click(cta);
    expect(screen.getByText("Personaliza o teu jardim")).toBeTruthy();

    const claro = screen.getByRole("button", { name: /Clássico/ });
    claro.focus();
    fireEvent.keyDown(claro, { key: "Enter" });
    expect(useThemeStore.getState().theme).toBe("claro");

    const plantar = screen.getByRole("button", { name: "Plantar e entrar" });
    expect(plantar.tagName).toBe("BUTTON");
    fireEvent.click(plantar);
    expect(screen.getByText("A tua floresta está plantada")).toBeTruthy();
  });
});

describe("Onboarding: no inline outline:none on focusable controls", () => {
  it("the primary CTA keeps a visible focus ring", () => {
    renderOnboarding();
    const cta = screen.getByRole("button", { name: "Continuar localmente" }) as HTMLElement;
    expect(cta.style.outline).not.toBe("none");
  });

  it("a theme card keeps a visible focus ring", () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: "Continuar localmente" }));
    const card = screen.getByRole("button", { name: /Batman/ }) as HTMLElement;
    expect(card.style.outline).not.toBe("none");
  });
});
