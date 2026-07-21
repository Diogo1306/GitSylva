import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Input, Textarea } from "./Input";

afterEach(cleanup);

// Fix (Task 4): Input/Textarea used to set outline:"none" inline, which
// permanently suppressed the shared :focus-visible ring from tokens.css for
// every consumer (including the branch/tag modal inputs). Focus must stay
// visible.

describe("Input", () => {
  it("does not disable the focus outline inline (the shared :focus-visible ring must survive)", () => {
    render(<Input placeholder="texto" />);
    const input = screen.getByPlaceholderText("texto") as HTMLInputElement;
    expect(input.style.outline).not.toBe("none");
  });

  it("still applies the mono font when requested", () => {
    render(<Input mono placeholder="mono" />);
    const input = screen.getByPlaceholderText("mono") as HTMLInputElement;
    expect(input.style.fontFamily).toBe("var(--font-mono)");
  });
});

describe("Textarea", () => {
  it("does not disable the focus outline inline", () => {
    render(<Textarea placeholder="area" />);
    const el = screen.getByPlaceholderText("area") as HTMLTextAreaElement;
    expect(el.style.outline).not.toBe("none");
  });
});
