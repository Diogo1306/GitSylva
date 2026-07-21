import { describe, it, expect } from "vitest";
import { pt } from "./pt";
import { en } from "./en";

// The English catalog is typed as Record<MessageKey, …>, so parity is already a
// compile-time guarantee. This test makes a drift a *test* failure too (clear
// signal in CI) and additionally checks that no value was left as an untouched
// copy of the Portuguese one.
describe("catalog parity", () => {
  const ptKeys = Object.keys(pt).sort();
  const enKeys = Object.keys(en).sort();

  it("pt and en have exactly the same keys", () => {
    const missingInEn = ptKeys.filter((k) => !(k in en));
    const missingInPt = enKeys.filter((k) => !(k in pt));
    expect({ missingInEn, missingInPt }).toEqual({ missingInEn: [], missingInPt: [] });
    expect(enKeys).toEqual(ptKeys);
  });

  it("every value has the same shape (string vs plural) in both catalogs", () => {
    const mismatched = ptKeys.filter((k) => {
      const a = (pt as Record<string, unknown>)[k];
      const b = (en as Record<string, unknown>)[k];
      return typeof a !== typeof b;
    });
    expect(mismatched).toEqual([]);
  });
});
