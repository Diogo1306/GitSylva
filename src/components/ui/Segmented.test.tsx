import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Segmented } from "./Segmented";

afterEach(cleanup);

const options = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

describe("Segmented", () => {
  it("renders role=radiogroup with a role=radio per option, aria-checked reflecting value", () => {
    render(<Segmented options={options} value="en" aria-label="Idioma" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: "Idioma" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Português" }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("radio", { name: "English" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Español" }).getAttribute("aria-checked")).toBe("false");
  });

  it("clicking an option calls onChange with its value", () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="pt" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "English" }));
    expect(onChange).toHaveBeenCalledWith("en");
  });

  it("gives only the selected option roving tabindex 0", () => {
    render(<Segmented options={options} value="en" onChange={() => {}} />);
    expect((screen.getByRole("radio", { name: "Português" }) as HTMLButtonElement).tabIndex).toBe(-1);
    expect((screen.getByRole("radio", { name: "English" }) as HTMLButtonElement).tabIndex).toBe(0);
    expect((screen.getByRole("radio", { name: "Español" }) as HTMLButtonElement).tabIndex).toBe(-1);
  });

  it("ArrowRight selects and focuses the next option, wrapping at the end", () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="es" onChange={onChange} />);
    const es = screen.getByRole("radio", { name: "Español" });
    es.focus();
    fireEvent.keyDown(es, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("pt");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Português" }));
  });

  it("ArrowLeft selects and focuses the previous option, wrapping at the start", () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="pt" onChange={onChange} />);
    const pt = screen.getByRole("radio", { name: "Português" });
    pt.focus();
    fireEvent.keyDown(pt, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("es");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Español" }));
  });

  it("ArrowDown/ArrowUp also move selection (orientation-agnostic radiogroup)", () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="pt" onChange={onChange} />);
    const pt = screen.getByRole("radio", { name: "Português" });
    pt.focus();
    fireEvent.keyDown(pt, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith("en");
  });

  it("keeps a visible focus ring (does not disable the outline inline)", () => {
    render(<Segmented options={options} value="pt" onChange={() => {}} />);
    expect((screen.getByRole("radio", { name: "Português" }) as HTMLButtonElement).style.outline).not.toBe("none");
  });

  it("renders real buttons so Enter/Space activate natively", () => {
    render(<Segmented options={options} value="pt" onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "English" }).tagName).toBe("BUTTON");
  });
});
