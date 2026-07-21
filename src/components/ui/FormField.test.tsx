import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FormField } from "./FormField";
import { Input } from "./Input";

afterEach(cleanup);

describe("FormField", () => {
  it("binds the label to the control via htmlFor/id", () => {
    render(
      <FormField label="Nome da branch">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("Nome da branch") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.id).toBeTruthy();
  });

  it("uses a provided id instead of generating one", () => {
    render(
      <FormField label="Email" id="email-field">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input.id).toBe("email-field");
  });

  it("wires a hint via aria-describedby", () => {
    render(
      <FormField label="Mensagem" hint="Máximo 72 caracteres">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("Mensagem") as HTMLInputElement;
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const hintEl = document.getElementById(describedBy!);
    expect(hintEl?.textContent).toBe("Máximo 72 caracteres");
  });

  it("wires an error via aria-describedby and aria-invalid, taking priority over the hint", () => {
    render(
      <FormField label="Remoto" hint="ex: origin" error="Obrigatório">
        <Input />
      </FormField>,
    );
    const input = screen.getByLabelText("Remoto") as HTMLInputElement;
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!.split(" ")[0]);
    expect(errorEl?.textContent).toBe("Obrigatório");
    expect(errorEl?.getAttribute("role")).toBe("alert");
  });

  it("does not disable the control's focus outline (wrapping keeps it visible)", () => {
    // Plain input so the assertion measures FormField's own effect, not the
    // app Input's pre-existing style.
    render(
      <FormField label="Nome">
        <input />
      </FormField>,
    );
    expect((screen.getByLabelText("Nome") as HTMLInputElement).style.outline).not.toBe("none");
  });
});
