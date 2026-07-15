import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useNotificationStore } from "./notificationStore";
import { useThemeStore } from "./themeStore";

beforeEach(() => {
  vi.useFakeTimers();
  useNotificationStore.setState({ notifications: [] });
  useThemeStore.getState().resetPrefs();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("notificationStore", () => {
  it("adds a notification and auto-dismisses after ~4s (exit first)", () => {
    useNotificationStore.getState().push("Push concluído", "origin", "success", "push");
    expect(useNotificationStore.getState().notifications).toHaveLength(1);

    vi.advanceTimersByTime(4001);
    // Exit phase: still mounted but marked exiting.
    expect(useNotificationStore.getState().notifications[0]?.exiting).toBe(true);
    vi.advanceTimersByTime(400);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("manual dismiss cancels the auto timer (no double exit)", () => {
    useNotificationStore.getState().push("A", undefined, "info");
    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().dismiss(id);
    expect(useNotificationStore.getState().notifications[0].exiting).toBe(true);
    vi.advanceTimersByTime(10_000);
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  it("hover pause stops the clock; resume finishes it", () => {
    useNotificationStore.getState().push("A");
    const id = useNotificationStore.getState().notifications[0].id;
    vi.advanceTimersByTime(2000);
    useNotificationStore.getState().pause(id);
    vi.advanceTimersByTime(60_000);
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0].exiting).toBe(false);

    useNotificationStore.getState().resume(id);
    vi.advanceTimersByTime(2500);
    expect(useNotificationStore.getState().notifications[0]?.exiting ?? true).toBe(true);
  });

  it("respects the Settings toggles per category", () => {
    useThemeStore.getState().savePrefs({ notifFetch: false });
    useNotificationStore.getState().push("Fetch concluído", undefined, "success", "fetch");
    expect(useNotificationStore.getState().notifications).toHaveLength(0);

    useNotificationStore.getState().push("Outra coisa", undefined, "info", "general");
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
  });
});
