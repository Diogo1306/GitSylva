import { describe, it, expect, vi, afterEach } from "vitest";
import { detectLocale } from "./detect";

function stubLanguages(languages: string[], language = languages[0]) {
  vi.stubGlobal("navigator", { languages, language });
}

afterEach(() => vi.unstubAllGlobals());

describe("detectLocale", () => {
  it("detects Portuguese variants", () => {
    stubLanguages(["pt-PT"]);
    expect(detectLocale()).toBe("pt");
    stubLanguages(["pt-BR"]);
    expect(detectLocale()).toBe("pt");
  });

  it("detects English variants", () => {
    stubLanguages(["en-US"]);
    expect(detectLocale()).toBe("en");
    stubLanguages(["en-GB"]);
    expect(detectLocale()).toBe("en");
  });

  it("falls back to Portuguese for other locales", () => {
    stubLanguages(["de-DE", "fr-FR"]);
    expect(detectLocale()).toBe("pt");
  });

  it("prefers the first supported language in the list", () => {
    stubLanguages(["de-DE", "en-US"]);
    expect(detectLocale()).toBe("en");
  });
});
