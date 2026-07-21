import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { useT } from "./index";
import { useLocaleStore } from "./localeStore";

function Sample() {
  const t = useT();
  return <div>{t("common.save")}</div>;
}

afterEach(() => {
  cleanup();
  useLocaleStore.setState({ locale: "pt", userSet: false });
});

describe("useT live switching", () => {
  it("re-renders translated text immediately when the locale changes", () => {
    useLocaleStore.setState({ locale: "pt", userSet: false });
    render(<Sample />);
    expect(screen.getByText("Guardar")).toBeTruthy();

    act(() => {
      useLocaleStore.getState().setLocale("en");
    });
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.queryByText("Guardar")).toBeNull();
  });
});
