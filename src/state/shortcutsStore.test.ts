import { describe, it, expect, beforeEach } from "vitest";
import {
  useShortcutsStore,
  comboFromEvent,
  formatCombo,
  actionForEvent,
  DEFAULT_BINDINGS,
} from "./shortcutsStore";

beforeEach(() => {
  useShortcutsStore.getState().reset();
});

const ev = (key: string, mods: Partial<{ ctrl: boolean; meta: boolean; shift: boolean; alt: boolean }> = {}) => ({
  key,
  ctrlKey: mods.ctrl ?? false,
  metaKey: mods.meta ?? false,
  shiftKey: mods.shift ?? false,
  altKey: mods.alt ?? false,
});

describe("comboFromEvent", () => {
  it("requires the mod key — plain typing never makes a combo", () => {
    expect(comboFromEvent(ev("k"))).toBeNull();
    expect(comboFromEvent(ev("Shift", { shift: true }))).toBeNull();
  });
  it("normalizes ctrl/meta and case", () => {
    expect(comboFromEvent(ev("K", { ctrl: true }))).toBe("mod+k");
    expect(comboFromEvent(ev("k", { meta: true }))).toBe("mod+k");
    expect(comboFromEvent(ev("L", { ctrl: true, shift: true }))).toBe("mod+shift+l");
    expect(comboFromEvent(ev("Enter", { ctrl: true }))).toBe("mod+enter");
  });
});

describe("bindings", () => {
  it("dispatches the default actions", () => {
    const b = useShortcutsStore.getState().bindings;
    expect(actionForEvent(ev("p", { ctrl: true }), b)).toBe("push");
    expect(actionForEvent(ev("L", { ctrl: true, shift: true }), b)).toBe("pull");
    expect(actionForEvent(ev("x", { ctrl: true }), b)).toBeNull();
  });

  it("swaps combos when rebinding onto a taken combo", () => {
    useShortcutsStore.getState().setBinding("push", "mod+k"); // taken by palette
    const b = useShortcutsStore.getState().bindings;
    expect(b.push).toBe("mod+k");
    expect(b.palette).toBe(DEFAULT_BINDINGS.push); // got push's old combo
  });

  it("reset restores the defaults", () => {
    useShortcutsStore.getState().setBinding("fetch", "mod+9");
    useShortcutsStore.getState().reset();
    expect(useShortcutsStore.getState().bindings).toEqual(DEFAULT_BINDINGS);
  });
});

describe("formatCombo", () => {
  it("renders per platform", () => {
    expect(formatCombo("mod+shift+l", true)).toEqual(["⌘", "⇧", "L"]);
    expect(formatCombo("mod+shift+l", false)).toEqual(["Ctrl", "Shift", "L"]);
    expect(formatCombo("mod+enter", false)).toEqual(["Ctrl", "↵"]);
  });
});
