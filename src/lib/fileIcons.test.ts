import { describe, expect, it } from "vitest";
import { iconFor } from "./fileIcons";

describe("iconFor", () => {
  it("maps common extensions to their language tile", () => {
    expect(iconFor("src/lib/api.ts").label).toBe("TS");
    expect(iconFor("src/App.tsx").label).toBe("TS");
    expect(iconFor("index.html").label).toBe("<>");
    expect(iconFor("styles/main.css").label).toBe("#");
    expect(iconFor("src-tauri/src/lib.rs").label).toBe("RS");
    expect(iconFor("Gemfile.rb").label).toBe("RB");
  });

  it("is case-insensitive and separator-agnostic", () => {
    expect(iconFor("Docs\\README.MD").label).toBe("MD");
  });

  it("recognizes special filenames before extensions", () => {
    expect(iconFor("Dockerfile").label).toBe("D");
    expect(iconFor(".gitignore").glyph).toBe("git");
    expect(iconFor("Cargo.lock").glyph).toBe("lock");
    expect(iconFor(".env").label).toBe("≡");
  });

  it("falls back to the neutral doc tile", () => {
    expect(iconFor("dados.xyz-desconhecido").glyph).toBe("doc");
    expect(iconFor("sem-extensao").glyph).toBe("doc");
  });
});
