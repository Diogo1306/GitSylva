import { describe, it, expect, beforeEach } from "vitest";
import { useLocaleStore } from "./localeStore";

beforeEach(() => useLocaleStore.setState({ locale: "pt", userSet: false }));

describe("localeStore", () => {
  it("defaults to Portuguese with no explicit user choice", () => {
    const s = useLocaleStore.getState();
    expect(s.locale).toBe("pt");
    expect(s.userSet).toBe(false);
  });

  it("applyDetected switches the locale only until the user chooses", () => {
    // Startup detection may override the default...
    useLocaleStore.getState().applyDetected("en");
    expect(useLocaleStore.getState().locale).toBe("en");

    // ...but once the user picks a language, detection is a no-op.
    useLocaleStore.getState().setLocale("pt");
    expect(useLocaleStore.getState().userSet).toBe(true);
    useLocaleStore.getState().applyDetected("en");
    expect(useLocaleStore.getState().locale).toBe("pt");
  });

  it("setLocale pins the explicit choice", () => {
    useLocaleStore.getState().setLocale("en");
    expect(useLocaleStore.getState().locale).toBe("en");
    expect(useLocaleStore.getState().userSet).toBe(true);
  });
});
