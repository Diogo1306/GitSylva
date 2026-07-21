import { describe, it, expect } from "vitest";
import { translate } from "./translate";

describe("translate", () => {
  it("resolves a plain key per locale", () => {
    expect(translate("pt", "common.cancel")).toBe("Cancelar");
    expect(translate("en", "common.cancel")).toBe("Cancel");
  });

  it("interpolates named params", () => {
    expect(translate("pt", "time.minutesAgo", { count: 5 })).toBe("há 5 min");
    expect(translate("en", "time.minutesAgo", { count: 5 })).toBe("5 min ago");
  });

  it("selects plural forms by count", () => {
    expect(translate("pt", "time.daysAgo", { count: 1 })).toBe("há 1 dia");
    expect(translate("pt", "time.daysAgo", { count: 3 })).toBe("há 3 dias");
    expect(translate("en", "time.daysAgo", { count: 1 })).toBe("1 day ago");
    expect(translate("en", "time.daysAgo", { count: 3 })).toBe("3 days ago");
  });

  it("leaves unknown placeholders untouched", () => {
    // No param for {count} → the placeholder is preserved rather than "undefined".
    expect(translate("pt", "time.minutesAgo")).toBe("há {count} min");
  });

  it("falls back to Portuguese for a locale that is somehow missing an entry", () => {
    // Both catalogs are complete (guarded by the parity test); this exercises
    // the fallback branch directly via an unknown locale cast.
    expect(translate("de" as "pt", "common.save")).toBe("Guardar");
  });
});
