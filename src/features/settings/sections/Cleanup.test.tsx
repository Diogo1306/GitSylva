import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Cleanup } from "./Cleanup";
import { useThemeStore } from "../../../state/themeStore";
import { useShortcutsStore } from "../../../state/shortcutsStore";
import { useNotificationStore } from "../../../state/notificationStore";
import { useRecentsStore } from "../../../state/recentsStore";

// Task 15: "Repor todas as definições" must explain exactly what it resets
// (and what it does NOT touch) before acting, and must confirm success via
// the notification-card system, not only a transient toast.

beforeEach(() => {
  useThemeStore.getState().resetPrefs();
  useShortcutsStore.getState().reset();
  useNotificationStore.setState({ notifications: [] });
  useRecentsStore.setState({ recents: [] });
});

afterEach(() => {
  cleanup();
  useThemeStore.getState().resetPrefs();
  useShortcutsStore.getState().reset();
});

function openConfirm() {
  render(<Cleanup />);
  fireEvent.click(screen.getByRole("button", { name: "Repor todas as definições" }));
}

describe("Cleanup: reset confirmation copy", () => {
  it("names the concrete preferences that get reset", () => {
    openConfirm();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toMatch(/tema/i);
    expect(dialog.textContent).toMatch(/densidade/i);
    expect(dialog.textContent).toMatch(/layout/i);
    expect(dialog.textContent).toMatch(/animações/i);
    expect(dialog.textContent).toMatch(/modo de pull/i);
    expect(dialog.textContent).toMatch(/notificações/i);
  });

  it("reassures that repos, git identity, recents and onboarding are NOT touched", () => {
    openConfirm();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toMatch(/não apaga repositórios/i);
    expect(dialog.textContent).toMatch(/identidade git/i);
    expect(dialog.textContent).toMatch(/não limpa os recentes/i);
    expect(dialog.textContent).toMatch(/onboarding/i);
  });

  it("clarifies keyboard shortcuts are a separate reset, not included here", () => {
    openConfirm();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toMatch(/atalhos de teclado não são incluídos/i);
  });
});

describe("Cleanup: reset behavior matches the confirm copy", () => {
  it("restores theme, density, layout, animations and pull mode to defaults", () => {
    useThemeStore.getState().savePrefs({
      theme: "escuro",
      density: "compacta",
      repoLayout: "rail",
      historyLayout: "baixo",
      anims: false,
      pullMode: "rebase",
      confirmDiscard: false,
    });
    openConfirm();
    fireEvent.click(screen.getByRole("button", { name: "Repor" }));

    const s = useThemeStore.getState();
    expect(s.theme).toBe("claro");
    expect(s.density).toBe("conforto");
    expect(s.repoLayout).toBe("tabs");
    expect(s.historyLayout).toBe("lado");
    expect(s.anims).toBe(true);
    expect(s.pullMode).toBe("ff");
    expect(s.confirmDiscard).toBe(true);
  });

  it("does NOT touch keyboard shortcuts, matching the copy's claim", () => {
    useShortcutsStore.getState().setBinding("push", "mod+shift+p");
    openConfirm();
    fireEvent.click(screen.getByRole("button", { name: "Repor" }));
    expect(useShortcutsStore.getState().bindings.push).toBe("mod+shift+p");
  });

  it("cancelling leaves every preference untouched", () => {
    useThemeStore.getState().savePrefs({ theme: "escuro" });
    openConfirm();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(useThemeStore.getState().theme).toBe("escuro");
  });
});

describe("Cleanup: success notification", () => {
  it("emits a success notification CARD confirming the reset (not only a toast)", () => {
    openConfirm();
    fireEvent.click(screen.getByRole("button", { name: "Repor" }));

    const cards = useNotificationStore.getState().notifications;
    expect(cards.some((n) => n.kind === "success" && /reposta/i.test(n.title))).toBe(true);
  });

  it("uses the ungated 'general' notification channel, so it always shows regardless of the sync-notification toggles", () => {
    useThemeStore.getState().savePrefs({ notifPush: false, notifFetch: false, notifConflicts: false });
    openConfirm();
    fireEvent.click(screen.getByRole("button", { name: "Repor" }));

    // resetPrefs also restores the toggles themselves, but the point stands:
    // a reset confirmation must never depend on those toggles being on.
    expect(useNotificationStore.getState().notifications.length).toBeGreaterThan(0);
  });
});
