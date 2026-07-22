import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "./themeStore";

// The store is a module singleton; each test starts from defaults.
beforeEach(() => {
  useThemeStore.getState().resetPrefs();
});

describe("themeStore.savePrefs", () => {
  it("resets the accent when the theme changes (each theme has its own list)", () => {
    useThemeStore.getState().savePrefs({ accentIdx: 3 });
    expect(useThemeStore.getState().accentIdx).toBe(3);

    useThemeStore.getState().savePrefs({ theme: "escuro" });
    expect(useThemeStore.getState().theme).toBe("escuro");
    expect(useThemeStore.getState().accentIdx).toBe(0);
  });

  it("keeps an explicitly chosen accent when set together with the theme", () => {
    useThemeStore.getState().savePrefs({ theme: "nipon", accentIdx: 2 });
    expect(useThemeStore.getState().accentIdx).toBe(2);
  });

  it("does not reset the accent when saving the SAME theme", () => {
    useThemeStore.getState().savePrefs({ accentIdx: 1 });
    useThemeStore.getState().savePrefs({ theme: "claro" });
    expect(useThemeStore.getState().accentIdx).toBe(1);
  });

  it("resetPrefs restores every default", () => {
    useThemeStore.getState().savePrefs({ theme: "gitclassic", anims: false, pullMode: "rebase", confirmDiscard: false });
    useThemeStore.getState().resetPrefs();
    const s = useThemeStore.getState();
    expect(s.theme).toBe("claro");
    expect(s.anims).toBe(true);
    expect(s.pullMode).toBe("ff");
    expect(s.confirmDiscard).toBe(true);
  });
});
